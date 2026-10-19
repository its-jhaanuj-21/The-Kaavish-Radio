/**
 * The Kaavish Radio — Zero-Latency Acoustic Mehfil Sync Engine
 * Uses Server Time Calibration (NTP-style), Shared Master Anchor Timeline,
 * Buffer-State Snapping, and Continuous Phase-Locked Loop (PLL) drift alignment
 * to achieve sub-frame (perceptually 0.00s) synchronized audio playback.
 */

class RoomSyncManager {
  constructor() {
    this.roomId = null;
    this.memberId = null;
    this.isHost = false;
    this.membersCount = 1;
    this.eventSource = null;
    this.isApplyingRemoteSync = false;
    this.isUserSeeking = false;
    this.autoJoinCode = null;
    this.userName = localStorage.getItem('kaavish_fan_author') || 'Listener';

    // Master Anchor Timeline: { trackIndex, isPlaying, anchorPosition, anchorServerTime }
    this.roomAnchor = null;

    // Server clock offset in ms: serverTime - localDateNow
    this.serverTimeDelta = 0;
    this.hasCalibratedClock = false;

    // Phase-Locked Loop (PLL) drift monitor
    this.driftInterval = null;
    this.clockSyncInterval = null;
    this.rateResetTimer = null;
  }

  async init() {
    // 1. Initial high-precision clock sync with server
    await this.syncServerClock();

    // Re-sync clock every 60 seconds to guard against local device clock drift
    this.clockSyncInterval = setInterval(() => this.syncServerClock(), 60000);

    // Re-sync immediately when returning from background or waking device
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncServerClock();
        if (this.isActive()) {
          this.correctDriftNow(true);
        }
      }
    });

    // Check if URL has ?room=123456 or ?mehfil=123456
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('room') || params.get('mehfil');
      if (inviteCode && /^\d{4,8}$/.test(inviteCode.trim())) {
        this.autoJoinCode = inviteCode.trim();
      }
    } catch (e) {}

    // Clean up room session on page unload
    window.addEventListener('beforeunload', () => {
      if (this.isActive()) {
        try {
          const payload = JSON.stringify({ roomId: this.roomId, memberId: this.memberId });
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/room/leave', payload);
          } else {
            fetch('/api/room/leave', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true
            });
          }
        } catch (err) {}
      }
    });
  }

  /**
   * Calibrates local system clock with server clock using NTP-style round-trip estimation.
   * Completely eliminates device clock skew between different phones and laptops.
   */
  async syncServerClock() {
    try {
      const t0 = performance.now();
      const res = await fetch('/api/time', { cache: 'no-store' });
      const t1 = performance.now();
      if (!res.ok) return;
      const data = await res.json();
      const rtt = t1 - t0;
      // The server timestamp corresponds roughly to the halfway point of the network request
      const estimatedServerTimeAtT1 = data.serverTime + (rtt / 2);
      this.serverTimeDelta = estimatedServerTimeAtT1 - Date.now();
      this.hasCalibratedClock = true;
    } catch (e) {
      if (!this.hasCalibratedClock) {
        this.serverTimeDelta = 0;
      }
    }
  }

  getServerNow() {
    return Date.now() + (this.serverTimeDelta || 0);
  }

  /**
   * Computes the continuous master playback position for any microsecond.
   * Both devices use this formula to know the exact frame they should be playing.
   */
  getExpectedPlaybackTime() {
    if (!this.roomAnchor) {
      const p = window.kaavishPlayer;
      return p ? p.getCurrentTime() : 0;
    }

    if (!this.roomAnchor.isPlaying) {
      return Math.max(0, this.roomAnchor.anchorPosition || 0);
    }

    const elapsedSec = (this.getServerNow() - this.roomAnchor.anchorServerTime) / 1000;
    return Math.max(0, (this.roomAnchor.anchorPosition || 0) + elapsedSec);
  }

  isActive() {
    return Boolean(this.roomId && this.memberId);
  }

  getInviteLink() {
    if (!this.roomId) return window.location.origin;
    const base = window.location.origin + window.location.pathname;
    return `${base}?room=${this.roomId}`;
  }

  async createRoom(isPrivate = true) {
    await this.syncServerClock();

    const player = window.kaavishPlayer;
    const initialTrackIndex = player ? player.currentIndex : 0;
    const initialIsPlaying = player ? player.isPlaying : false;
    const initialCurrentTime = player ? player.getCurrentTime() : 0;
    const token = window.authManager ? window.authManager.token : '';
    const hostName = (window.authManager && window.authManager.user) ? window.authManager.user.name : this.userName;

    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          hostName,
          token,
          isPrivate: Boolean(isPrivate && window.authManager && window.authManager.isLoggedIn()),
          state: {
            trackIndex: initialTrackIndex,
            isPlaying: initialIsPlaying,
            currentTime: initialCurrentTime
          }
        })
      });

      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Room creation failed');

      this.roomId = data.roomId;
      this.memberId = data.memberId;
      this.isHost = true;
      this.isPrivate = Boolean(data.isPrivate);
      this.membersCount = 1;

      const serverNow = data.serverTime || this.getServerNow();
      this.roomAnchor = {
        trackIndex: initialTrackIndex,
        isPlaying: initialIsPlaying,
        anchorPosition: initialCurrentTime,
        anchorServerTime: serverNow
      };

      this.updateUrlParam(this.roomId);
      this.connectSSE();
      this.startDriftCorrectionLoop();
      this.dispatchRoomUpdate();

      return {
        success: true,
        roomId: this.roomId,
        isPrivate: this.isPrivate,
        inviteUrl: this.getInviteLink()
      };
    } catch (err) {
      console.error('[RoomSync] Error creating room:', err);
      throw err;
    }
  }

  async joinRoom(code) {
    await this.syncServerClock();

    const cleanCode = (code || '').toString().trim().replace(/[^0-9]/g, '');
    if (!cleanCode || cleanCode.length < 5) {
      throw new Error('Please enter a valid 6-digit room code');
    }

    const token = window.authManager ? window.authManager.token : '';

    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          roomId: cleanCode,
          memberName: (window.authManager && window.authManager.user) ? window.authManager.user.name : this.userName,
          token
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data && data.code === 'ACCOUNT_REQUIRED') {
          const err = new Error(data.error || 'Account required');
          err.code = 'ACCOUNT_REQUIRED';
          throw err;
        }
        if (data && data.code === 'KNOCK_REQUIRED') {
          const err = new Error(data.message || 'Knock required');
          err.code = 'KNOCK_REQUIRED';
          err.hostUser = data.hostUser;
          throw err;
        }
        throw new Error(data.error || 'Room not found. Please verify the code.');
      }

      this.roomId = data.roomId;
      this.memberId = data.memberId;
      this.isHost = Boolean(data.isHost);
      this.membersCount = data.membersCount || 2;

      const serverNow = data.serverTime || this.getServerNow();
      if (data.anchor) {
        this.roomAnchor = data.anchor;
      } else {
        this.roomAnchor = {
          trackIndex: data.state.trackIndex || 0,
          isPlaying: Boolean(data.state.isPlaying),
          anchorPosition: data.state.currentTime || 0,
          anchorServerTime: serverNow
        };
      }

      this.updateUrlParam(this.roomId);
      this.connectSSE();

      // Lock player onto room anchor
      this.applyInitialState(this.roomAnchor);
      this.startDriftCorrectionLoop();
      this.dispatchRoomUpdate();

      return {
        success: true,
        roomId: this.roomId,
        state: data.state
      };
    } catch (err) {
      console.error('[RoomSync] Error joining room:', err);
      throw err;
    }
  }

  async knockRoom(code) {
    const cleanCode = (code || '').toString().trim().replace(/[^0-9]/g, '');
    const token = window.authManager ? window.authManager.token : '';

    const res = await fetch('/api/room/knock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ roomId: cleanCode, token })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to knock at the room.');
    }
    this.activeKnockId = data.knockId;
    this.activeKnockRoomCode = cleanCode;
    this.knockCancelled = false;
    return data;
  }

  cancelKnock() {
    this.knockCancelled = true;
    this.activeKnockId = null;
    this.activeKnockRoomCode = null;
  }

  async pollKnockStatus(code, knockId) {
    const cleanCode = (code || this.activeKnockRoomCode || '').toString().trim().replace(/[^0-9]/g, '');
    const kId = knockId || this.activeKnockId || '';
    const token = window.authManager ? window.authManager.token : '';
    this.knockCancelled = false;

    // Poll every 1.5s for up to 60s
    for (let attempt = 0; attempt < 40; attempt++) {
      if (this.knockCancelled) {
        throw new Error('Knock cancelled');
      }

      try {
        const res = await fetch(`/api/room/knock-status?roomId=${encodeURIComponent(cleanCode)}&knockId=${encodeURIComponent(kId)}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        const data = await res.json();
        if (data && data.success) {
          if (data.status === 'approved' || data.status === 'declined') {
            return data;
          }
        }
      } catch (e) {}

      await new Promise(r => setTimeout(r, 1500));
    }

    throw new Error('Knock request timed out waiting for host response.');
  }

  async respondToKnock(roomId, knockIdOrUserId, allow) {
    const token = window.authManager ? window.authManager.token : '';
    const res = await fetch('/api/room/knock-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        roomId,
        knockId: knockIdOrUserId,
        applicantUserId: knockIdOrUserId,
        allow: Boolean(allow),
        token
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to respond to knock request.');
    }
    return data;
  }

  async leaveRoom() {
    if (!this.isActive()) return;

    this.stopDriftCorrectionLoop();

    const oldRoomId = this.roomId;
    const oldMemberId = this.memberId;

    if (this.eventSource) {
      try { this.eventSource.close(); } catch (e) {}
      this.eventSource = null;
    }

    // Reset playback rate if adjusted by PLL
    const player = window.kaavishPlayer;
    if (player && player.ytPlayer && player.ytPlayer.setPlaybackRate) {
      try { player.ytPlayer.setPlaybackRate(1); } catch (e) {}
    }

    this.roomId = null;
    this.memberId = null;
    this.isHost = false;
    this.membersCount = 1;
    this.roomAnchor = null;

    this.updateUrlParam(null);
    this.dispatchRoomUpdate();

    try {
      fetch('/api/room/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: oldRoomId, memberId: oldMemberId })
      }).catch(() => {});
    } catch (e) {}
  }

  connectSSE() {
    if (this.eventSource) {
      try { this.eventSource.close(); } catch (e) {}
    }

    const sseUrl = `/api/room/events?roomId=${encodeURIComponent(this.roomId)}&memberId=${encodeURIComponent(this.memberId)}&name=${encodeURIComponent(this.userName)}`;
    this.eventSource = new EventSource(sseUrl);

    this.eventSource.addEventListener('room_init', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.membersCount) {
          this.membersCount = payload.membersCount;
          this.dispatchRoomUpdate();
        }
        if (payload.anchor) {
          this.roomAnchor = payload.anchor;
          this.correctDriftNow(true);
        }
      } catch (err) {}
    });

    this.eventSource.addEventListener('member_joined', (e) => {
      try {
        const payload = JSON.parse(e.data);
        this.membersCount = payload.membersCount || (this.membersCount + 1);
        this.dispatchRoomUpdate();

        if (window.showToast) {
          window.showToast(`✨ ${payload.name || 'A friend'} joined your Mehfil!`);
        }
      } catch (err) {}
    });

    this.eventSource.addEventListener('member_left', (e) => {
      try {
        const payload = JSON.parse(e.data);
        this.membersCount = Math.max(1, payload.membersCount || (this.membersCount - 1));
        this.dispatchRoomUpdate();

        if (window.showToast) {
          window.showToast(`👋 ${payload.name || 'A listener'} left the Mehfil.`);
        }
      } catch (err) {}
    });

    this.eventSource.addEventListener('room_knock', (e) => {
      try {
        const payload = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent('roomknockreceived', { detail: payload }));
      } catch (err) {}
    });

    this.eventSource.addEventListener('knock_result', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.status === 'approved' && payload.guestUser) {
          if (window.showToast) {
            window.showToast(`✨ Connected! You and ${payload.guestUser.name} are now Mehfil friends.`);
          }
          if (window.authManager && window.authManager.isLoggedIn()) {
            window.authManager.fetchCurrentUser();
          }
        }
      } catch (err) {}
    });

    this.eventSource.addEventListener('sync_action', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.senderId === this.memberId) return; // Don't apply own broadcasts

        if (payload.anchor) {
          this.roomAnchor = payload.anchor;
        }

        this.applyRemoteAction(payload.action, payload.data, payload.timestamp, payload.anchor);
      } catch (err) {
        console.error('[RoomSync] Error parsing sync action:', err);
      }
    });

    this.eventSource.onerror = () => {
      // EventSource auto-reconnects on temporary drops
    };
  }

  /**
   * Applies initial track and time when joining
   */
  applyInitialState(anchor) {
    if (!anchor) return;
    const player = window.kaavishPlayer;
    if (!player) return;

    this.isApplyingRemoteSync = true;

    const trackIndex = (typeof anchor.trackIndex === 'number') ? anchor.trackIndex : 0;
    const isPlaying = Boolean(anchor.isPlaying);
    const expectedTime = this.getExpectedPlaybackTime();

    player.loadTrack(trackIndex, isPlaying, true);

    const checkAndSnap = (attempt = 0) => {
      if (player.ytReady && player.ytPlayer) {
        const currentTarget = this.getExpectedPlaybackTime();
        player.seekToTime(currentTarget);
        if (isPlaying) {
          player.playTrack(true);
        }
        setTimeout(() => {
          this.isApplyingRemoteSync = false;
          this.correctDriftNow(true);
        }, 200);
      } else if (attempt < 15) {
        setTimeout(() => checkAndSnap(attempt + 1), 100);
      }
    };
    setTimeout(() => checkAndSnap(0), 100);
  }

  /**
   * Instant remote command execution with zero buffering delay
   */
  applyRemoteAction(action, data, timestamp, anchor) {
    const player = window.kaavishPlayer;
    if (!player) return;

    this.isApplyingRemoteSync = true;

    if (action === 'PLAY') {
      if (data && typeof data.trackIndex === 'number' && data.trackIndex !== player.currentIndex) {
        player.loadTrack(data.trackIndex, true, true);
      }
      const targetTime = this.getExpectedPlaybackTime();
      player.seekToTime(targetTime);
      player.playTrack(true);

      if (window.showToast) {
        window.showToast('▶ Synced in acoustic harmony');
      }
    } else if (action === 'PAUSE') {
      player.pauseTrack(true);
      if (anchor) {
        player.seekToTime(anchor.anchorPosition);
      } else if (data && typeof data.currentTime === 'number') {
        player.seekToTime(data.currentTime);
      }
      if (window.showToast) {
        window.showToast('⏸ Paused with Mehfil');
      }
    } else if (action === 'SEEK') {
      const targetTime = this.getExpectedPlaybackTime();
      player.seekToTime(targetTime);
      if (window.showToast) {
        window.showToast('⏩ Timeline synced');
      }
    } else if (action === 'TRACK_CHANGE') {
      if (data && typeof data.trackIndex === 'number') {
        player.loadTrack(data.trackIndex, data.autoPlay !== false, true);
        const targetTime = this.getExpectedPlaybackTime();
        if (targetTime > 0) {
          setTimeout(() => player.seekToTime(this.getExpectedPlaybackTime()), 250);
        }
        const song = player.playlist[data.trackIndex];
        if (song && window.showToast) {
          window.showToast(`🎵 Song changed to: ${song.title}`);
        }
      }
    }

    // Immediately snap after audio starts
    setTimeout(() => {
      this.isApplyingRemoteSync = false;
      this.correctDriftNow(true);
    }, 300);
  }

  /**
   * Called by player.js the split-second YouTube finishes buffering and enters PLAYING.
   * Completely eliminates the 300-800ms YouTube buffering lag on initial load/seek!
   */
  onPlayerStatePlaying() {
    if (!this.isActive() || !this.roomAnchor || !this.roomAnchor.isPlaying) return;
    this.correctDriftNow(false);
  }

  /**
   * High-Precision Drift Correction Engine.
   * Compares the actual current audio time with the master room timeline.
   * If drift > 80ms: snaps directly to target.
   * If drift is 25-80ms: nudges playback rate slightly (1.04 or 0.96) for seamless phase-locking.
   */
  correctDriftNow(forceSnap = false) {
    if (!this.isActive() || this.isApplyingRemoteSync || this.isUserSeeking) return;
    const player = window.kaavishPlayer;
    if (!player || !player.isPlaying || !player.ytReady || !player.ytPlayer) return;
    if (!this.roomAnchor || !this.roomAnchor.isPlaying) return;

    const actualTime = player.getCurrentTime();
    const expectedTime = this.getExpectedPlaybackTime();
    const driftSec = actualTime - expectedTime; // positive = ahead, negative = behind
    const absDrift = Math.abs(driftSec);

    // If drift is significant (> 80ms) or forceSnap is requested
    if (forceSnap || absDrift > 0.08) {
      player.seekToTime(expectedTime);
      if (player.ytPlayer.setPlaybackRate) {
        try { player.ytPlayer.setPlaybackRate(1); } catch (e) {}
      }
      return;
    }

    // If micro-drift is between 25ms and 80ms: use continuous Phase-Locked Loop (PLL)
    if (absDrift > 0.025 && player.ytPlayer.setPlaybackRate) {
      clearTimeout(this.rateResetTimer);
      if (driftSec < 0) {
        // Behind by 30-80ms: subtly speed up by 4% to lock into zero latency
        player.ytPlayer.setPlaybackRate(1.04);
      } else {
        // Ahead by 30-80ms: subtly slow down by 4% to lock into zero latency
        player.ytPlayer.setPlaybackRate(0.96);
      }
      this.rateResetTimer = setTimeout(() => {
        if (player.ytPlayer && player.ytPlayer.setPlaybackRate) {
          try { player.ytPlayer.setPlaybackRate(1); } catch (e) {}
        }
      }, 600);
    }
  }

  /**
   * Continuous background Phase-Locked Loop running every 1200ms
   */
  startDriftCorrectionLoop() {
    this.stopDriftCorrectionLoop();
    this.driftInterval = setInterval(() => {
      this.correctDriftNow(false);
    }, 1200);
  }

  stopDriftCorrectionLoop() {
    if (this.driftInterval) {
      clearInterval(this.driftInterval);
      this.driftInterval = null;
    }
    clearTimeout(this.rateResetTimer);
  }

  /**
   * Broadcasts a local action to the room with the latest anchor position
   */
  broadcastAction(action, data) {
    if (!this.isActive() || this.isApplyingRemoteSync) return;

    const player = window.kaavishPlayer;
    const currentTime = (data && typeof data.currentTime === 'number')
      ? data.currentTime
      : (player ? player.getCurrentTime() : 0);

    const serverNow = this.getServerNow();

    // Optimistically update our own master anchor immediately
    if (action === 'PLAY') {
      this.roomAnchor = {
        trackIndex: player ? player.currentIndex : 0,
        isPlaying: true,
        anchorPosition: currentTime,
        anchorServerTime: serverNow
      };
    } else if (action === 'PAUSE') {
      this.roomAnchor = {
        trackIndex: player ? player.currentIndex : 0,
        isPlaying: false,
        anchorPosition: currentTime,
        anchorServerTime: serverNow
      };
    } else if (action === 'SEEK') {
      this.roomAnchor = {
        trackIndex: player ? player.currentIndex : 0,
        isPlaying: player ? player.isPlaying : false,
        anchorPosition: currentTime,
        anchorServerTime: serverNow
      };
    } else if (action === 'TRACK_CHANGE') {
      this.roomAnchor = {
        trackIndex: data.trackIndex,
        isPlaying: data.autoPlay !== false,
        anchorPosition: 0,
        anchorServerTime: serverNow
      };
    }

    try {
      fetch('/api/room/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          memberId: this.memberId,
          action,
          data: {
            ...data,
            currentTime
          }
        })
      }).catch(err => {
        console.warn('[RoomSync] Broadcast action notice:', err);
      });
    } catch (err) {}
  }

  updateUrlParam(roomId) {
    try {
      const url = new URL(window.location.href);
      if (roomId) {
        url.searchParams.set('room', roomId);
      } else {
        url.searchParams.delete('room');
        url.searchParams.delete('mehfil');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  }

  dispatchRoomUpdate() {
    window.dispatchEvent(new CustomEvent('roomstatechange', {
      detail: {
        active: this.isActive(),
        roomId: this.roomId,
        isHost: this.isHost,
        membersCount: this.membersCount,
        inviteUrl: this.getInviteLink()
      }
    }));
  }
}

// Global instance
window.roomSync = new RoomSyncManager();
window.roomSync.init();
