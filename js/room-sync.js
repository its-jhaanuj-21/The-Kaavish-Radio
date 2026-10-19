/**
 * The Kaavish Radio — Real-time Mehfil / Listen Together Sync Engine
 * Enables two or more listeners to synchronize music playback down to the exact beat.
 */

class RoomSyncManager {
  constructor() {
    this.roomId = null;
    this.memberId = null;
    this.isHost = false;
    this.membersCount = 1;
    this.eventSource = null;
    this.isApplyingRemoteSync = false;
    this.autoJoinCode = null;
    this.userName = localStorage.getItem('kaavish_fan_author') || 'Listener';
  }

  init() {
    // Check if the page was opened with an invite link: ?room=123456 or ?mehfil=123456
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

  isActive() {
    return Boolean(this.roomId && this.memberId);
  }

  getInviteLink() {
    if (!this.roomId) return window.location.origin;
    const base = window.location.origin + window.location.pathname;
    return `${base}?room=${this.roomId}`;
  }

  async createRoom() {
    const player = window.kaavishPlayer;
    const initialTrackIndex = player ? player.currentIndex : 0;
    const initialIsPlaying = player ? player.isPlaying : false;
    const initialCurrentTime = player ? player.getCurrentTime() : 0;

    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: this.userName,
          state: {
            trackIndex: initialTrackIndex,
            isPlaying: initialIsPlaying,
            currentTime: initialCurrentTime
          }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create room');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Room creation failed');
      }

      this.roomId = data.roomId;
      this.memberId = data.memberId;
      this.isHost = true;
      this.membersCount = 1;

      // Update URL query param quietly
      this.updateUrlParam(this.roomId);

      // Connect to SSE stream
      this.connectSSE();

      // Trigger UI updates
      this.dispatchRoomUpdate();

      return {
        success: true,
        roomId: this.roomId,
        inviteUrl: this.getInviteLink()
      };
    } catch (err) {
      console.error('[RoomSync] Error creating room:', err);
      throw err;
    }
  }

  async joinRoom(code) {
    const cleanCode = (code || '').toString().trim().replace(/[^0-9]/g, '');
    if (!cleanCode || cleanCode.length < 5) {
      throw new Error('Please enter a valid 6-digit room code');
    }

    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: cleanCode,
          memberName: this.userName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Room not found. Please verify the code.');
      }

      this.roomId = data.roomId;
      this.memberId = data.memberId;
      this.isHost = false;
      this.membersCount = data.membersCount || 2;

      this.updateUrlParam(this.roomId);
      this.connectSSE();

      // Synchronize player with host's state
      this.applyInitialState(data.state);

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

  async leaveRoom() {
    if (!this.isActive()) return;

    const oldRoomId = this.roomId;
    const oldMemberId = this.memberId;

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (e) {}
      this.eventSource = null;
    }

    this.roomId = null;
    this.memberId = null;
    this.isHost = false;
    this.membersCount = 1;

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
      try {
        this.eventSource.close();
      } catch (e) {}
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

    this.eventSource.addEventListener('sync_action', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.senderId === this.memberId) return; // Don't apply own broadcasts
        this.applyRemoteAction(payload.action, payload.data, payload.timestamp);
      } catch (err) {
        console.error('[RoomSync] Error parsing sync action:', err);
      }
    });

    this.eventSource.onerror = () => {
      // EventSource auto-reconnects on temporary drops
    };
  }

  applyInitialState(state) {
    if (!state) return;
    const player = window.kaavishPlayer;
    if (!player) return;

    this.isApplyingRemoteSync = true;

    const trackIndex = (typeof state.trackIndex === 'number') ? state.trackIndex : 0;
    const isPlaying = Boolean(state.isPlaying);
    const targetTime = (typeof state.currentTime === 'number') ? Math.max(0, state.currentTime) : 0;

    // Load track
    player.loadTrack(trackIndex, isPlaying, true);

    // After player is ready, seek to time
    const applySeek = () => {
      if (player.ytReady && player.ytPlayer) {
        player.seekToTime(targetTime);
        if (isPlaying) {
          player.playTrack(true);
        }
        setTimeout(() => {
          this.isApplyingRemoteSync = false;
        }, 300);
      } else {
        setTimeout(applySeek, 200);
      }
    };
    setTimeout(applySeek, 300);
  }

  applyRemoteAction(action, data, timestamp) {
    const player = window.kaavishPlayer;
    if (!player) return;

    this.isApplyingRemoteSync = true;

    // Latency compensation in seconds
    const latencySec = timestamp ? Math.max(0, (Date.now() - timestamp) / 1000) : 0;

    if (action === 'PLAY') {
      if (data && typeof data.trackIndex === 'number' && data.trackIndex !== player.currentIndex) {
        player.loadTrack(data.trackIndex, true, true);
      }
      const targetTime = (data && typeof data.currentTime === 'number') ? (data.currentTime + latencySec) : player.getCurrentTime();
      player.seekToTime(targetTime);
      player.playTrack(true);

      if (window.showToast) {
        window.showToast('▶ Synced: Playing with Mehfil');
      }
    } else if (action === 'PAUSE') {
      player.pauseTrack(true);
      if (data && typeof data.currentTime === 'number') {
        player.seekToTime(data.currentTime);
      }
      if (window.showToast) {
        window.showToast('⏸ Synced: Paused with Mehfil');
      }
    } else if (action === 'SEEK') {
      if (data && typeof data.currentTime === 'number') {
        const targetTime = data.currentTime + latencySec;
        player.seekToTime(targetTime);
        if (window.showToast) {
          window.showToast('⏩ Synced timeline with Mehfil');
        }
      }
    } else if (action === 'TRACK_CHANGE') {
      if (data && typeof data.trackIndex === 'number') {
        player.loadTrack(data.trackIndex, data.autoPlay !== false, true);
        if (typeof data.currentTime === 'number') {
          setTimeout(() => {
            player.seekToTime(data.currentTime + latencySec);
          }, 350);
        }
        const song = player.playlist[data.trackIndex];
        if (song && window.showToast) {
          window.showToast(`🎵 Room changed song to: ${song.title}`);
        }
      }
    }

    setTimeout(() => {
      this.isApplyingRemoteSync = false;
    }, 400);
  }

  broadcastAction(action, data) {
    if (!this.isActive() || this.isApplyingRemoteSync) return;

    try {
      fetch('/api/room/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          memberId: this.memberId,
          action,
          data
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
