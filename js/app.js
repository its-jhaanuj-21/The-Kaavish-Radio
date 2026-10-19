/**
 * The Kaavish Radio — Main Application Logic
 * Inspired by Deluxe Saloon (deluxesalon.in)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Visual Rain Effect
  const rainCanvas = new RainCanvasEffect('rainCanvas');
  rainCanvas.start();

  // Initialize YouTube Audio Player
  window.kaavishPlayer.initYouTubeAPI();

  // -------------------------------------------------------------------------
  // Real Live Active Listeners Tracking
  // -------------------------------------------------------------------------
  const liveCountEl = document.getElementById('liveListenerCount');

  // Unique session ID per active browser tab
  let mySessionId = sessionStorage.getItem('kaavish_live_session');
  if (!mySessionId) {
    mySessionId = 'ls_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('kaavish_live_session', mySessionId);
  }

  function updateLiveListenerUI(count) {
    if (!liveCountEl) return;
    const n = Math.max(1, parseInt(count, 10) || 1);
    liveCountEl.textContent = `${n.toLocaleString()} ${n === 1 ? 'listening' : 'listening'}`;
  }

  async function sendHeartbeat() {
    try {
      const res = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: mySessionId,
          isPlaying: window.kaavishPlayer ? window.kaavishPlayer.isPlaying : false
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.count === 'number') {
          updateLiveListenerUI(data.count);
        }
      }
    } catch (err) {
      // Offline fallback: at least this current user is listening
      updateLiveListenerUI(1);
    }
  }

  // Initial heartbeat immediately
  sendHeartbeat();

  // Periodic heartbeat every 15 seconds to maintain active presence
  setInterval(sendHeartbeat, 15000);

  // Notify server when tab closes so count decrements immediately
  window.addEventListener('beforeunload', () => {
    try {
      const payload = JSON.stringify({ sessionId: mySessionId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/leave', payload);
      } else {
        fetch('/api/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        });
      }
    } catch (e) {}
  });

  // Re-sync immediately when returning to tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      sendHeartbeat();
    }
  });

  // -------------------------------------------------------------------------
  // Theme Switching (With Desktop & Mobile Responsive Versions)
  // -------------------------------------------------------------------------
  const themes = [
    {
      id: 'img1',
      name: 'Kaavish Acoustic Sunset (Img 1)',
      desktop: 'assets/images/Img1.png',
      mobile: 'assets/images/Img1_mob.png',
      thumb: 'assets/images/Img1.png',
      caption: '🎸 Acoustic Sunset Room'
    },
    {
      id: 'img2',
      name: 'Stage Spotlight Duo (Img 2)',
      desktop: 'assets/images/Img2.png',
      mobile: 'assets/images/Img2_mob.png',
      thumb: 'assets/images/Img2.png',
      caption: '✨ Stage Spotlight Duo'
    },
    {
      id: 'img3',
      name: 'Live Concert Stage (Img 3)',
      desktop: 'assets/images/Img3.png',
      mobile: 'assets/images/Img3_mob.png',
      thumb: 'assets/images/Img3.png',
      caption: '🎙️ Live Concert Stage'
    },
    {
      id: 'courtyard',
      name: 'Monsoon Heritage Veranda',
      desktop: 'assets/images/theme_courtyard.jpg',
      mobile: 'assets/images/theme_courtyard.jpg',
      thumb: 'assets/images/theme_courtyard.jpg',
      caption: '🌧️ Monsoon Veranda'
    },
    {
      id: 'sunset',
      name: 'Golden Hour Sunset Studio',
      desktop: 'assets/images/theme_sunset.jpg',
      mobile: 'assets/images/theme_sunset.jpg',
      thumb: 'assets/images/theme_sunset.jpg',
      caption: '🌅 Golden Hour Studio'
    },
    {
      id: 'midnight',
      name: 'Midnight Rainy Loft',
      desktop: 'assets/images/theme_midnight.jpg',
      mobile: 'assets/images/theme_midnight.jpg',
      thumb: 'assets/images/theme_midnight.jpg',
      caption: '🌙 Midnight Rain Loft'
    }
  ];

  let currentThemeIdx = 0;

  function isMobileView() {
    return window.innerWidth <= 768;
  }

  function updateBackgroundImages() {
    const isMobile = isMobileView();
    themes.forEach((theme, i) => {
      const bgEl = document.getElementById(`sceneTheme_${i}`);
      if (bgEl) {
        const bgUrl = (isMobile && theme.mobile) ? theme.mobile : theme.desktop;
        bgEl.style.backgroundImage = `url('${bgUrl}')`;
      }
    });
  }

  function renderThemeCards() {
    const grid = document.getElementById('themesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const isMobile = isMobileView();

    themes.forEach((theme, i) => {
      const card = document.createElement('div');
      card.className = `theme-card ${i === currentThemeIdx ? 'active' : ''}`;
      card.dataset.themeIndex = i;
      const previewImg = (isMobile && theme.mobile) ? theme.mobile : theme.thumb;
      card.innerHTML = `
        <img src="${previewImg}" alt="${theme.name}" class="theme-card-img" loading="lazy">
        <div class="theme-card-caption">${theme.caption}</div>
      `;
      card.addEventListener('click', () => {
        applyTheme(i);
        closeModal('themeModal');
      });
      grid.appendChild(card);
    });
  }

  function applyTheme(index) {
    currentThemeIdx = (index + themes.length) % themes.length;
    themes.forEach((_, i) => {
      const el = document.getElementById(`sceneTheme_${i}`);
      if (el) {
        if (i === currentThemeIdx) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    document.querySelectorAll('.theme-card').forEach((card, i) => {
      if (i === currentThemeIdx) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    showToast(`Theme: ${themes[currentThemeIdx].name}`);
  }

  // Initial setup for themes
  updateBackgroundImages();
  renderThemeCards();

  // Listen to screen resizes / orientation changes for responsive mobile wallpapers
  window.addEventListener('resize', () => {
    updateBackgroundImages();
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(updateBackgroundImages, 200);
  });

  document.getElementById('themeCycleBtn')?.addEventListener('click', () => {
    renderThemeCards();
    openModal('themeModal');
  });

  // -------------------------------------------------------------------------
  // Ambient Sound Toggles (Baarish, Vinyl Crackle, Crickets, Baadal)
  // -------------------------------------------------------------------------
  const baarishChip = document.getElementById('chipBaarish');
  const vinylChip = document.getElementById('chipVinyl');
  const cricketsChip = document.getElementById('chipCrickets');
  const thunderChip = document.getElementById('chipThunder');

  baarishChip?.addEventListener('click', () => {
    const active = window.ambientEngine.toggleRain();
    baarishChip.classList.toggle('active', active);
    const rainSlider = document.getElementById('mixerRain');
    if (rainSlider) rainSlider.value = active ? 65 : 0;
    showToast(active ? "🌧️ Baarish (Rain) enabled" : "🌧️ Rain muted");
  });

  vinylChip?.addEventListener('click', () => {
    const active = window.ambientEngine.toggleVinyl();
    vinylChip.classList.toggle('active', active);
    const vinylSlider = document.getElementById('mixerVinyl');
    if (vinylSlider) vinylSlider.value = active ? 50 : 0;
    showToast(active ? "📻 Vintage Vinyl Crackle enabled" : "📻 Vinyl muted");
  });

  cricketsChip?.addEventListener('click', () => {
    const active = window.ambientEngine.toggleCrickets();
    cricketsChip.classList.toggle('active', active);
    const cricketsSlider = document.getElementById('mixerCrickets');
    if (cricketsSlider) cricketsSlider.value = active ? 40 : 0;
    showToast(active ? "🌙 Night Crickets enabled" : "🌙 Crickets muted");
  });

  thunderChip?.addEventListener('click', () => {
    const active = window.ambientEngine.toggleThunder();
    thunderChip.classList.toggle('active', active);
    const thunderSlider = document.getElementById('mixerThunder');
    if (thunderSlider) thunderSlider.value = active ? 50 : 0;
    showToast(active ? "⛈️ Distant Thunder enabled" : "⛈️ Thunder muted");
  });

  // Mixer Sliders
  document.getElementById('mixerRain')?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100;
    window.ambientEngine.setVolume('rain', val);
    if (val > 0 && !window.ambientEngine.nodes.rain.active) {
      window.ambientEngine.toggleRain(true);
      baarishChip?.classList.add('active');
    } else if (val === 0 && window.ambientEngine.nodes.rain.active) {
      window.ambientEngine.toggleRain(false);
      baarishChip?.classList.remove('active');
    }
  });

  document.getElementById('mixerVinyl')?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100;
    window.ambientEngine.setVolume('vinyl', val);
    if (val > 0 && !window.ambientEngine.nodes.vinyl.active) {
      window.ambientEngine.toggleVinyl(true);
      vinylChip?.classList.add('active');
    } else if (val === 0 && window.ambientEngine.nodes.vinyl.active) {
      window.ambientEngine.toggleVinyl(false);
      vinylChip?.classList.remove('active');
    }
  });

  document.getElementById('mixerCrickets')?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100;
    window.ambientEngine.setVolume('crickets', val);
    if (val > 0 && !window.ambientEngine.nodes.crickets.active) {
      window.ambientEngine.toggleCrickets(true);
      cricketsChip?.classList.add('active');
    } else if (val === 0 && window.ambientEngine.nodes.crickets.active) {
      window.ambientEngine.toggleCrickets(false);
      cricketsChip?.classList.remove('active');
    }
  });

  document.getElementById('mixerThunder')?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100;
    window.ambientEngine.setVolume('thunder', val);
    if (val > 0 && !window.ambientEngine.nodes.thunder.active) {
      window.ambientEngine.toggleThunder(true);
      thunderChip?.classList.add('active');
    } else if (val === 0 && window.ambientEngine.nodes.thunder.active) {
      window.ambientEngine.toggleThunder(false);
      thunderChip?.classList.remove('active');
    }
  });

  // -------------------------------------------------------------------------
  // Populate Playlist in Modal with Live Search
  // -------------------------------------------------------------------------
  const playlistContainer = document.getElementById('playlistRows');
  const searchInput = document.getElementById('songSearchInput');
  const searchClearBtn = document.getElementById('songSearchClear');
  const countIndicator = document.getElementById('songCountIndicator');

  function renderPlaylist(filterQuery = '') {
    if (!playlistContainer) return;
    playlistContainer.innerHTML = '';
    const q = filterQuery.trim().toLowerCase();

    const currentTrackIdx = window.kaavishPlayer ? window.kaavishPlayer.currentIndex : 0;

    const filtered = KAAVISH_PLAYLIST.map((song, originalIdx) => ({ song, originalIdx })).filter(({ song }) => {
      if (!q) return true;
      const titleMatch = (song.title || '').toLowerCase().includes(q);
      const artistMatch = (song.artist || '').toLowerCase().includes(q);
      const albumMatch = (song.album || '').toLowerCase().includes(q);
      const subtitleMatch = (song.subtitle || '').toLowerCase().includes(q);
      const lyricsMatch = (song.lyrics || '').toLowerCase().includes(q);
      return titleMatch || artistMatch || albumMatch || subtitleMatch || lyricsMatch;
    });

    if (countIndicator) {
      if (q) {
        countIndicator.textContent = `Found ${filtered.length} of ${KAAVISH_PLAYLIST.length} songs`;
      } else {
        countIndicator.textContent = `${KAAVISH_PLAYLIST.length} songs available`;
      }
    }

    if (filtered.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'no-songs-found';
      emptyDiv.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <div>No songs found matching "${filterQuery}"</div>
      `;
      playlistContainer.appendChild(emptyDiv);
      return;
    }

    filtered.forEach(({ song, originalIdx }) => {
      const row = document.createElement('div');
      row.className = `track-list-item ${originalIdx === currentTrackIdx ? 'current-song' : ''}`;
      row.dataset.songIndex = originalIdx;
      row.innerHTML = `
        <div class="song-idx-info">
          <span class="song-idx">${originalIdx + 1 < 10 ? '0' : ''}${originalIdx + 1}</span>
          <div class="song-names">
            <strong>${song.title}</strong>
            <span>${song.artist || 'The Kaavish'} • ${song.album || song.subtitle || ''}</span>
          </div>
        </div>
        <div style="font-size: 0.8rem; color: #fbbf24;">▶</div>
      `;
      row.addEventListener('click', () => {
        window.kaavishPlayer.loadTrack(originalIdx, true);
        updateActivePlaylistRow(originalIdx);
        closeModal('playlistModal');
      });
      playlistContainer.appendChild(row);
    });
  }

  function updateActivePlaylistRow(activeIdx) {
    document.querySelectorAll('.track-list-item').forEach((row) => {
      const idx = parseInt(row.dataset.songIndex, 10);
      if (idx === activeIdx) {
        row.classList.add('current-song');
      } else {
        row.classList.remove('current-song');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.style.display = val ? 'flex' : 'none';
      }
      renderPlaylist(val);
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
      }
      searchClearBtn.style.display = 'none';
      renderPlaylist('');
    });
  }

  // Initial render
  renderPlaylist('');

  // Reset playlist to full list on open without activating search focus
  document.getElementById('btnOpenPlaylist')?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      if (searchClearBtn) searchClearBtn.style.display = 'none';
      renderPlaylist('');
      searchInput.blur();
    }
  });

  window.addEventListener('trackchange', (e) => {
    updateActivePlaylistRow(e.detail.index);
    updateLyricsContent(e.detail.index);
  });

  // -------------------------------------------------------------------------
  // Lyrics Modal
  // -------------------------------------------------------------------------
  function updateLyricsContent(idx) {
    const song = KAAVISH_PLAYLIST[idx];
    const titleEl = document.getElementById('lyricsModalTitle');
    const contentEl = document.getElementById('lyricsModalBody');
    if (titleEl) titleEl.textContent = `${song.title} — Lyrics`;
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="font-family: var(--font-serif); font-size: 1.25rem; font-style: italic; line-height: 1.85; color: #fef3c7; white-space: pre-line; text-align: center; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
          ${song.lyrics}
        </div>
      `;
    }
  }

  // Initial lyrics populate
  updateLyricsContent(0);

  // -------------------------------------------------------------------------
  // Modals Controller
  // -------------------------------------------------------------------------
  window.openModal = function(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  };

  window.closeModal = function(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  };

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) modal.classList.remove('active');
    });
  });

  // Modal open buttons
  document.getElementById('btnOpenMixer')?.addEventListener('click', () => openModal('mixerModal'));
  document.getElementById('btnOpenPlaylist')?.addEventListener('click', () => openModal('playlistModal'));
  document.getElementById('btnOpenLyrics')?.addEventListener('click', () => openModal('lyricsModal'));
  document.getElementById('btnOpenAbout')?.addEventListener('click', () => openModal('aboutModal'));
  document.getElementById('btnOpenNotes')?.addEventListener('click', () => openModal('notesModal'));
  document.getElementById('btnOpenSupport')?.addEventListener('click', () => openModal('supportModal'));

  // Support Modal UPI Copy
  const copyUpiBtn = document.getElementById('copyUpiBtn');
  const copyUpiText = document.getElementById('copyUpiText');
  copyUpiBtn?.addEventListener('click', async () => {
    const upiId = document.getElementById('supportUpiId')?.textContent?.trim() || 'anujjha196@naviaxis';
    try {
      await navigator.clipboard.writeText(upiId);
      if (copyUpiText) copyUpiText.textContent = 'Copied!';
      showToast('✓ UPI ID copied: ' + upiId);
      setTimeout(() => {
        if (copyUpiText) copyUpiText.textContent = 'Copy';
      }, 2500);
    } catch (err) {
      showToast('UPI ID: ' + upiId);
    }
  });

  // Mini Banner close
  document.getElementById('closeBannerBtn')?.addEventListener('click', () => {
    const banner = document.getElementById('miniBanner');
    if (banner) banner.style.display = 'none';
  });

  // Share button
  document.getElementById('btnShare')?.addEventListener('click', async () => {
    const shareTitle = 'The Kaavish Radio (TKR) — A Soulful Courtyard of Timeless Harmonies';
    const shareText = '📻✨ The Kaavish Radio (TKR) — A Soulful Courtyard of Timeless Harmonies\n\n' +
      'Step into an ambient, ad-free musical sanctuary dedicated to the poetry and timeless melodies of The Kaavish. ' +
      'Listen to Faasle, Bachpan, Nindiya Re alongside soothing rain and vintage vinyl crackle.\n\n' +
      '🔗 Listen live:\n';
    const shareUrl = window.location.href;
    const fullSharePayload = `${shareText}${shareUrl}`;

    if (navigator.share) {
      try {
        const shareOptions = {
          title: shareTitle,
          text: shareText,
          url: shareUrl
        };

        // Attach TKR logo image if supported by the browser's share sheet
        try {
          const imgRes = await fetch('assets/icons/icon-512.png');
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const file = new File([blob], 'the-kaavish-radio-tkr.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareOptions.files = [file];
            }
          }
        } catch (e) {}

        await navigator.share(shareOptions);
        showToast('✨ Thank you for sharing The Kaavish Radio!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy rich message with link to clipboard
    try {
      await navigator.clipboard.writeText(fullSharePayload);
      showToast('🔗 Beautiful invitation & link copied to clipboard!');
    } catch (e) {
      navigator.clipboard.writeText(shareUrl);
      showToast('🔗 Radio link copied to clipboard!');
    }
  });

  // Fan Notes / Community Chat
  const noteForm = document.getElementById('fanNoteForm');
  const noteInput = document.getElementById('fanNoteInput');
  const authorInput = document.getElementById('fanAuthorInput');
  const submitBtn = document.getElementById('fanNoteSubmitBtn');
  const notesContainer = document.getElementById('fanNotesList');

  // Load remembered author name
  if (authorInput) {
    const savedAuthor = localStorage.getItem('kaavish_fan_author');
    if (savedAuthor) authorInput.value = savedAuthor;
  }

  // Default initial comments removed — loads cleanly from data/notes.json or API
  const defaultNotes = [];

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTime(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 2) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  let activeNotes = [];

  function renderNotes(notes) {
    if (!notesContainer) return;
    notesContainer.innerHTML = '';

    if (!notes || notes.length === 0) {
      notesContainer.innerHTML = `<div style="text-align:center; padding: 24px 10px; color: #a8a29e; font-size: 0.85rem; font-style: italic;">No reflections yet. Be the first to leave one below.</div>`;
      return;
    }

    notes.forEach(n => {
      const bubble = document.createElement('div');
      bubble.className = 'fan-note-bubble';
      const timeStr = formatTime(n.timestamp);
      bubble.innerHTML = `
        <div class="fan-note-text">“${escapeHtml(n.text)}”</div>
        <div class="fan-note-meta">
          <cite>— ${escapeHtml(n.author || 'Anonymous Listener')}</cite>
          ${timeStr ? `<span class="fan-note-time">${escapeHtml(timeStr)}</span>` : ''}
        </div>
      `;
      notesContainer.appendChild(bubble);
    });
  }

  async function loadCommunityNotes() {
    let fetched = null;

    // 1. Try server API (/api/notes)
    try {
      const res = await fetch('/api/notes', { cache: 'no-cache' });
      if (res.ok) {
        fetched = await res.json();
      }
    } catch (e) {}

    // 2. Fallback to static data/notes.json if server API is not available
    if (fetched === null) {
      try {
        const resStatic = await fetch('data/notes.json', { cache: 'no-cache' });
        if (resStatic.ok) {
          fetched = await resStatic.json();
        }
      } catch (e) {}
    }

    if (!Array.isArray(fetched)) {
      fetched = [];
    }

    activeNotes = fetched;
    renderNotes(activeNotes);
  }

  noteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = noteInput?.value?.trim();
    const author = authorInput?.value?.trim() || 'Anonymous Listener';

    if (!text) return;

    // Save author name preference for next time
    localStorage.setItem('kaavish_fan_author', author);

    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text,
      author,
      timestamp: new Date().toISOString()
    };

    // Optimistic local update
    const localSaved = JSON.parse(localStorage.getItem('kaavish_fan_notes') || '[]');
    localSaved.unshift(newNote);
    localStorage.setItem('kaavish_fan_notes', JSON.stringify(localSaved));

    activeNotes.unshift(newNote);
    renderNotes(activeNotes);
    if (notesContainer) notesContainer.scrollTop = 0;

    if (noteInput) noteInput.value = '';

    // Show posting state on button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Posting...</span>`;
    }

    // Send to backend /api/notes so it's stored in code / disk and shared with all users
    try {
      const resp = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.notes && Array.isArray(data.notes)) {
          // Sync with server notes
          activeNotes = data.notes;
          renderNotes(activeNotes);
        }
      }
    } catch (err) {
      console.warn('Note saved locally. Server sync pending:', err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>Post</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        `;
      }
    }

    showToast('✨ Note posted to the Kaavish community board!');
  });

  // Initial load & modal trigger
  loadCommunityNotes();
  document.getElementById('btnOpenNotes')?.addEventListener('click', () => {
    loadCommunityNotes();
  });

  // -------------------------------------------------------------------------
  // Toast Helper
  // -------------------------------------------------------------------------
  const toastEl = document.getElementById('toastNotice');
  let toastTimer = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  }
  window.showToast = showToast;

  // -------------------------------------------------------------------------
  // Helper: Escape HTML
  // -------------------------------------------------------------------------
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // -------------------------------------------------------------------------
  // User Account & Musical Profile Controller
  // -------------------------------------------------------------------------
  const btnUserAuth = document.getElementById('btnUserAuth');
  const navUserInitials = document.getElementById('navUserInitials');
  const navUserName = document.getElementById('navUserName');

  const authLoggedOutView = document.getElementById('authLoggedOutView');
  const authLoggedInView = document.getElementById('authLoggedInView');

  // Logged-out forms and tabs
  const tabBtnSignIn = document.getElementById('tabBtnSignIn');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const signInForm = document.getElementById('signInForm');
  const registerForm = document.getElementById('registerForm');
  const loginUsernameInput = document.getElementById('loginUsernameInput');
  const loginPasswordInput = document.getElementById('loginPasswordInput');
  const btnSubmitLogin = document.getElementById('btnSubmitLogin');

  const regNameInput = document.getElementById('regNameInput');
  const regUsernameInput = document.getElementById('regUsernameInput');
  const regPasswordInput = document.getElementById('regPasswordInput');
  const regFavSingerInput = document.getElementById('regFavSingerInput');
  const regFavSongInput = document.getElementById('regFavSongInput');
  const regStatusInput = document.getElementById('regStatusInput');
  const btnSubmitRegister = document.getElementById('btnSubmitRegister');

  // Logged-in profile view elements
  const profileLargeInitials = document.getElementById('profileLargeInitials');
  const profileDisplayName = document.getElementById('profileDisplayName');
  const profileDisplayUsername = document.getElementById('profileDisplayUsername');
  const profileDisplayStatus = document.getElementById('profileDisplayStatus');
  const profileFriendsCount = document.getElementById('profileFriendsCount');

  const tabBtnProfileTaste = document.getElementById('tabBtnProfileTaste');
  const tabBtnFriendsList = document.getElementById('tabBtnFriendsList');
  const tabContentProfileTaste = document.getElementById('tabContentProfileTaste');
  const tabContentFriendsList = document.getElementById('tabContentFriendsList');

  const editProfileForm = document.getElementById('editProfileForm');
  const editNameInput = document.getElementById('editNameInput');
  const editFavSingerInput = document.getElementById('editFavSingerInput');
  const editFavSongInput = document.getElementById('editFavSongInput');
  const editStatusInput = document.getElementById('editStatusInput');
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  const btnLogoutBtn = document.getElementById('btnLogoutBtn');
  const friendsListContainer = document.getElementById('friendsListContainer');

  // Friend Profile Inspection Modal
  const viewFriendAvatar = document.getElementById('viewFriendAvatar');
  const viewFriendName = document.getElementById('viewFriendName');
  const viewFriendUsername = document.getElementById('viewFriendUsername');
  const viewFriendStatus = document.getElementById('viewFriendStatus');
  const viewFriendSinger = document.getElementById('viewFriendSinger');
  const viewFriendSong = document.getElementById('viewFriendSong');
  const btnInviteFriendToMehfil = document.getElementById('btnInviteFriendToMehfil');

  // Knock Approval Modal (Host opens door for friend)
  const knockApplicantAvatar = document.getElementById('knockApplicantAvatar');
  const knockApplicantName = document.getElementById('knockApplicantName');
  const knockApplicantUsername = document.getElementById('knockApplicantUsername');
  const knockApplicantStatus = document.getElementById('knockApplicantStatus');
  const knockApplicantSinger = document.getElementById('knockApplicantSinger');
  const knockApplicantSong = document.getElementById('knockApplicantSong');
  const btnKnockAllow = document.getElementById('btnKnockAllow');
  const btnKnockDecline = document.getElementById('btnKnockDecline');
  let currentKnockApplicant = null;

  // Open Auth modal on nav button click
  btnUserAuth?.addEventListener('click', () => {
    openModal('authModal');
    if (window.authManager && window.authManager.isLoggedIn) {
      loadAndRenderFriends();
    }
  });

  // Switch between Sign In and Register tabs
  tabBtnSignIn?.addEventListener('click', () => {
    tabBtnSignIn.classList.add('active');
    tabBtnRegister?.classList.remove('active');
    if (signInForm) signInForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
  });

  tabBtnRegister?.addEventListener('click', () => {
    tabBtnRegister.classList.add('active');
    tabBtnSignIn?.classList.remove('active');
    if (registerForm) registerForm.style.display = 'block';
    if (signInForm) signInForm.style.display = 'none';
  });

  // Switch between Musical Profile and Friends List tabs
  tabBtnProfileTaste?.addEventListener('click', () => {
    tabBtnProfileTaste.classList.add('active');
    tabBtnFriendsList?.classList.remove('active');
    if (tabContentProfileTaste) tabContentProfileTaste.style.display = 'block';
    if (tabContentFriendsList) tabContentFriendsList.style.display = 'none';
  });

  tabBtnFriendsList?.addEventListener('click', () => {
    tabBtnFriendsList.classList.add('active');
    tabBtnProfileTaste?.classList.remove('active');
    if (tabContentFriendsList) tabContentFriendsList.style.display = 'block';
    if (tabContentProfileTaste) tabContentProfileTaste.style.display = 'none';
    loadAndRenderFriends();
  });

  // Handle Login submission
  signInForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginUsernameInput?.value?.trim();
    const password = loginPasswordInput?.value;
    if (!username || !password) {
      showToast('⚠️ Please enter your username and password');
      return;
    }

    if (btnSubmitLogin) {
      btnSubmitLogin.disabled = true;
      btnSubmitLogin.innerHTML = '<span>Signing in...</span>';
    }

    try {
      const user = await window.authManager.login(username, password);
      showToast(`✨ Welcome back, ${user.name}!`);
      if (loginPasswordInput) loginPasswordInput.value = '';
    } catch (err) {
      showToast('❌ ' + (err.message || 'Login failed'));
    } finally {
      if (btnSubmitLogin) {
        btnSubmitLogin.disabled = false;
        btnSubmitLogin.innerHTML = '<span>Sign In</span>';
      }
    }
  });

  // Handle Registration submission
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = regNameInput?.value?.trim();
    const username = regUsernameInput?.value?.trim();
    const password = regPasswordInput?.value;
    const favSinger = regFavSingerInput?.value?.trim() || '';
    const favSong = regFavSongInput?.value?.trim() || '';
    const status = regStatusInput?.value?.trim() || '';

    if (!name || !username || !password) {
      showToast('⚠️ Please fill in name, username, and password');
      return;
    }

    if (btnSubmitRegister) {
      btnSubmitRegister.disabled = true;
      btnSubmitRegister.innerHTML = '<span>Creating account...</span>';
    }

    try {
      const user = await window.authManager.register({
        name,
        username,
        password,
        favSinger,
        favSong,
        status
      });
      showToast(`✨ Welcome to The Kaavish Sanctuary, ${user.name}!`);
      if (regPasswordInput) regPasswordInput.value = '';
    } catch (err) {
      showToast('❌ ' + (err.message || 'Registration failed'));
    } finally {
      if (btnSubmitRegister) {
        btnSubmitRegister.disabled = false;
        btnSubmitRegister.innerHTML = '<span>Create Soul Account</span>';
      }
    }
  });

  // Handle Profile Update submission
  editProfileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = editNameInput?.value?.trim();
    const favSinger = editFavSingerInput?.value?.trim() || '';
    const favSong = editFavSongInput?.value?.trim() || '';
    const status = editStatusInput?.value?.trim() || '';

    if (!name) {
      showToast('⚠️ Display name is required');
      return;
    }

    if (btnSaveProfile) {
      btnSaveProfile.disabled = true;
      btnSaveProfile.innerHTML = '<span>Saving...</span>';
    }

    try {
      await window.authManager.updateProfile({ name, favSinger, favSong, status });
      showToast('✓ Musical profile updated successfully');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Update failed'));
    } finally {
      if (btnSaveProfile) {
        btnSaveProfile.disabled = false;
        btnSaveProfile.innerHTML = '<span>Save Changes</span>';
      }
    }
  });

  // Handle Logout
  btnLogoutBtn?.addEventListener('click', async () => {
    await window.authManager.logout();
    showToast('👋 You have been signed out.');
  });

  // Update UI on Auth State Change
  function updateAuthUI(user) {
    if (user) {
      if (navUserInitials) {
        navUserInitials.textContent = user.initials || 'KR';
        navUserInitials.style.display = 'inline-flex';
      }
      if (navUserName) {
        navUserName.textContent = user.name ? user.name.split(' ')[0] : 'Account';
      }
      if (authLoggedOutView) authLoggedOutView.style.display = 'none';
      if (authLoggedInView) authLoggedInView.style.display = 'block';

      if (profileLargeInitials) profileLargeInitials.textContent = user.initials || 'KR';
      if (profileDisplayName) profileDisplayName.textContent = user.name || '';
      if (profileDisplayUsername) profileDisplayUsername.textContent = '@' + (user.username || '');
      if (profileDisplayStatus) {
        profileDisplayStatus.textContent = user.profile?.status
          ? `“${user.profile.status}”`
          : '“Lost in peaceful Kaavish chords...”';
      }
      if (profileFriendsCount) {
        profileFriendsCount.textContent = (user.friends || []).length;
      }

      if (editNameInput) editNameInput.value = user.name || '';
      if (editFavSingerInput) editFavSingerInput.value = user.profile?.favSinger || '';
      if (editFavSongInput) editFavSongInput.value = user.profile?.favSong || '';
      if (editStatusInput) editStatusInput.value = user.profile?.status || '';
    } else {
      if (navUserInitials) navUserInitials.style.display = 'none';
      if (navUserName) navUserName.textContent = 'Account';
      if (authLoggedOutView) authLoggedOutView.style.display = 'block';
      if (authLoggedInView) authLoggedInView.style.display = 'none';
    }
  }

  window.addEventListener('authstatechange', (e) => {
    updateAuthUI(e.detail.user);
  });

  // Load and Render Confirmed Mutual Friends (Privacy Protected)
  async function loadAndRenderFriends() {
    if (!window.authManager || !window.authManager.isLoggedIn) return;
    if (!friendsListContainer) return;

    friendsListContainer.innerHTML = '<div style="text-align:center; padding:15px; color:#d1c5b4; font-size:0.82rem;">Loading verified friends...</div>';

    try {
      const friends = await window.authManager.getFriends();
      if (profileFriendsCount) profileFriendsCount.textContent = friends.length;

      if (!friends || friends.length === 0) {
        friendsListContainer.innerHTML = `
          <div class="friends-empty-state">
            <div class="friends-empty-state-icon">🕊️</div>
            <div style="font-weight:600; color:#e2d7c9; margin-bottom:4px;">No friends yet</div>
            <div style="font-size:0.75rem; color:#a8a29e; line-height:1.4;">
              Start a private Mehfil and share your code. When a listener knocks and you click <em>Allow & Add Friend</em>, they will appear here!
            </div>
          </div>
        `;
        return;
      }

      friendsListContainer.innerHTML = friends.map((f) => `
        <div class="friend-card" data-friend-id="${f.id}">
          <div class="friend-card-left">
            <div class="friend-card-avatar">${escapeHTML(f.initials || 'KR')}</div>
            <div class="friend-card-info">
              <div class="friend-card-name">${escapeHTML(f.name)}</div>
              <div class="friend-card-user">@${escapeHTML(f.username)}</div>
              <div class="friend-card-taste">${
                f.profile?.status
                  ? escapeHTML(f.profile.status)
                  : (f.profile?.favSong ? 'Fav Song: ' + escapeHTML(f.profile.favSong) : 'Soul Listener')
              }</div>
            </div>
          </div>
          <div class="friend-card-actions">
            <button type="button" class="action-pill-btn" style="padding: 5px 12px; font-size: 0.72rem;">Profile</button>
          </div>
        </div>
      `).join('');

      friendsListContainer.querySelectorAll('.friend-card').forEach((card) => {
        card.addEventListener('click', () => {
          const fId = card.getAttribute('data-friend-id');
          const friend = friends.find((item) => item.id === fId);
          if (friend) showFriendProfileModal(friend);
        });
      });
    } catch (err) {
      friendsListContainer.innerHTML = `<div style="text-align:center; padding:15px; color:#fca5a5; font-size:0.82rem;">Failed to load friends: ${escapeHTML(err.message)}</div>`;
    }
  }

  function showFriendProfileModal(friend) {
    if (viewFriendAvatar) viewFriendAvatar.textContent = friend.initials || 'KR';
    if (viewFriendName) viewFriendName.textContent = friend.name || 'Friend';
    if (viewFriendUsername) viewFriendUsername.textContent = '@' + (friend.username || '');
    if (viewFriendStatus) {
      viewFriendStatus.textContent = friend.profile?.status
        ? `"${friend.profile.status}"`
        : '"Listening to The Kaavish..."';
    }
    if (viewFriendSinger) viewFriendSinger.textContent = friend.profile?.favSinger || '-';
    if (viewFriendSong) viewFriendSong.textContent = friend.profile?.favSong || '-';

    if (btnInviteFriendToMehfil) {
      btnInviteFriendToMehfil.onclick = async () => {
        closeModal('friendProfileModal');
        openModal('collabModal');
        if (!window.roomSync.roomId) {
          try {
            await window.roomSync.createRoom(true);
            showToast(`✨ Mehfil #${window.roomSync.roomId} created for you and ${friend.name}!`);
          } catch (e) {}
        }
      };
    }

    openModal('friendProfileModal');
  }

  // Initialize auth manager from stored token
  if (window.authManager) {
    window.authManager.init().catch(() => {});
  }

  // -------------------------------------------------------------------------
  // Mehfil • Listen Together in Sync (Collab Room UI Controller)
  // -------------------------------------------------------------------------
  const btnOpenCollab = document.getElementById('btnOpenCollab');
  const collabNavText = document.getElementById('collabNavText');
  const activeRoomNavPill = document.getElementById('activeRoomNavPill');
  const activeRoomNavText = document.getElementById('activeRoomNavText');
  const roomSyncTag = document.getElementById('roomSyncTag');

  const collabInactiveView = document.getElementById('collabInactiveView');
  const collabKnockingView = document.getElementById('collabKnockingView');
  const collabActiveView = document.getElementById('collabActiveView');
  const checkPrivateRoom = document.getElementById('checkPrivateRoom');
  const btnCreateRoom = document.getElementById('btnCreateRoom');
  const btnJoinRoom = document.getElementById('btnJoinRoom');
  const joinRoomForm = document.getElementById('joinRoomForm');
  const joinRoomCodeInput = document.getElementById('joinRoomCodeInput');
  const btnCancelKnock = document.getElementById('btnCancelKnock');

  const displayRoomCode = document.getElementById('displayRoomCode');
  const displayMemberCount = document.getElementById('displayMemberCount');
  const displayRoleBadge = document.getElementById('displayRoleBadge');
  const btnCopyRoomCode = document.getElementById('btnCopyRoomCode');
  const copyCodeText = document.getElementById('copyCodeText');
  const btnShareInviteLink = document.getElementById('btnShareInviteLink');
  const btnLeaveRoom = document.getElementById('btnLeaveRoom');

  btnOpenCollab?.addEventListener('click', () => openModal('collabModal'));
  activeRoomNavPill?.addEventListener('click', () => openModal('collabModal'));

  // Create room (supports private / account approval mode)
  btnCreateRoom?.addEventListener('click', async () => {
    const isPrivate = checkPrivateRoom ? checkPrivateRoom.checked : false;

    if (isPrivate && (!window.authManager || !window.authManager.isLoggedIn)) {
      showToast('🔒 Please sign in to create a private friend Mehfil');
      openModal('authModal');
      return;
    }

    btnCreateRoom.disabled = true;
    const origHTML = btnCreateRoom.innerHTML;
    btnCreateRoom.innerHTML = '<span>Creating Mehfil...</span>';
    try {
      const res = await window.roomSync.createRoom(isPrivate);
      showToast(`✨ Mehfil #${res.roomId} created! ${isPrivate ? 'Guests will knock for your approval.' : 'Share the code.'}`);
    } catch (err) {
      showToast('❌ ' + (err.message || 'Failed to create room'));
    } finally {
      btnCreateRoom.disabled = false;
      btnCreateRoom.innerHTML = origHTML;
    }
  });

  // Join room (handles direct join, ACCOUNT_REQUIRED, and KNOCK_REQUIRED)
  async function handleJoinSubmit() {
    const code = joinRoomCodeInput?.value?.trim();
    if (!code) {
      showToast('⚠️ Please enter the 6-digit room code');
      joinRoomCodeInput?.focus();
      return;
    }

    if (btnJoinRoom) {
      btnJoinRoom.disabled = true;
      btnJoinRoom.innerHTML = '<span>Joining...</span>';
    }

    try {
      const res = await window.roomSync.joinRoom(code);
      showToast(`✨ Joined Mehfil #${res.roomId}! Audio synchronized.`);
      if (joinRoomCodeInput) joinRoomCodeInput.value = '';
    } catch (err) {
      if (err.code === 'ACCOUNT_REQUIRED') {
        showToast('🔒 This is a private Mehfil. Please sign in or register to join.');
        openModal('authModal');
        return;
      }

      if (err.code === 'KNOCK_REQUIRED') {
        // Switch to knocking waiting view
        if (collabInactiveView) collabInactiveView.style.display = 'none';
        if (collabKnockingView) collabKnockingView.style.display = 'block';
        showToast('🚪 Knocking at the door... Waiting for host approval.');

        try {
          await window.roomSync.knockRoom(code);
          const pollRes = await window.roomSync.pollKnockStatus(code);

          if (pollRes.status === 'approved') {
            showToast('✨ Host allowed your entry! Joining Mehfil...');
            await window.roomSync.joinRoom(code);
            if (collabKnockingView) collabKnockingView.style.display = 'none';
            if (joinRoomCodeInput) joinRoomCodeInput.value = '';
            // Refresh friends since host approved
            if (window.authManager && window.authManager.isLoggedIn) {
              window.authManager.getFriends();
            }
          } else if (pollRes.status === 'declined') {
            showToast('🚫 Host declined the join request.');
            if (collabKnockingView) collabKnockingView.style.display = 'none';
            if (collabInactiveView) collabInactiveView.style.display = 'block';
          }
        } catch (pollErr) {
          if (pollErr.message !== 'Knock cancelled') {
            showToast('❌ ' + (pollErr.message || 'Knock request timed out'));
          }
          if (collabKnockingView) collabKnockingView.style.display = 'none';
          if (collabInactiveView) collabInactiveView.style.display = 'block';
        }
        return;
      }

      showToast('❌ ' + (err.message || 'Could not join room'));
    } finally {
      if (btnJoinRoom) {
        btnJoinRoom.disabled = false;
        btnJoinRoom.innerHTML = '<span>Join</span>';
      }
    }
  }

  btnJoinRoom?.addEventListener('click', handleJoinSubmit);
  joinRoomForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleJoinSubmit();
  });

  // Cancel Knock button
  btnCancelKnock?.addEventListener('click', () => {
    window.roomSync.cancelKnock();
    if (collabKnockingView) collabKnockingView.style.display = 'none';
    if (collabInactiveView) collabInactiveView.style.display = 'block';
    showToast('Knock request cancelled');
  });

  // Host Knock Received Event (SSE live notification)
  window.addEventListener('roomknockreceived', (e) => {
    const applicant = e.detail;
    if (!applicant) return;
    currentKnockApplicant = applicant;

    if (knockApplicantAvatar) knockApplicantAvatar.textContent = applicant.initials || 'KR';
    if (knockApplicantName) knockApplicantName.textContent = applicant.name || 'Soul Listener';
    if (knockApplicantUsername) knockApplicantUsername.textContent = '@' + (applicant.username || 'user');
    if (knockApplicantStatus) {
      knockApplicantStatus.textContent = applicant.profile?.status
        ? `"${applicant.profile.status}"`
        : '"Listening to The Kaavish..."';
    }
    if (knockApplicantSinger) knockApplicantSinger.textContent = applicant.profile?.favSinger || '-';
    if (knockApplicantSong) knockApplicantSong.textContent = applicant.profile?.favSong || '-';

    openModal('knockModal');
    showToast(`🚪 ${applicant.name} (@${applicant.username}) is knocking at your Mehfil!`);
  });

  // Host Allow & Add Friend
  btnKnockAllow?.addEventListener('click', async () => {
    if (!currentKnockApplicant || !window.roomSync.roomId) return;
    const applicant = currentKnockApplicant;
    try {
      await window.roomSync.respondToKnock(window.roomSync.roomId, applicant.userId, true);
      closeModal('knockModal');
      showToast(`✓ Allowed ${applicant.name}! You are now Soul Friends.`);
      if (window.authManager && window.authManager.isLoggedIn) {
        window.authManager.getFriends();
      }
    } catch (err) {
      showToast('❌ ' + (err.message || 'Failed to respond to knock'));
    }
  });

  // Host Decline Knock
  btnKnockDecline?.addEventListener('click', async () => {
    if (!currentKnockApplicant || !window.roomSync.roomId) return;
    const applicant = currentKnockApplicant;
    try {
      await window.roomSync.respondToKnock(window.roomSync.roomId, applicant.userId, false);
      closeModal('knockModal');
      showToast(`Declined request from ${applicant.name}.`);
    } catch (err) {
      showToast('❌ ' + (err.message || 'Failed to respond to knock'));
    }
  });

  // Copy room code
  btnCopyRoomCode?.addEventListener('click', async () => {
    if (!window.roomSync.roomId) return;
    try {
      await navigator.clipboard.writeText(window.roomSync.roomId);
      if (copyCodeText) copyCodeText.textContent = 'Copied!';
      showToast(`✓ Room Code ${window.roomSync.roomId} copied!`);
      setTimeout(() => {
        if (copyCodeText) copyCodeText.textContent = 'Copy Code';
      }, 2500);
    } catch (e) {
      showToast(`Room Code: ${window.roomSync.roomId}`);
    }
  });

  // Share invite link
  btnShareInviteLink?.addEventListener('click', async () => {
    if (!window.roomSync.roomId) return;
    const inviteUrl = window.roomSync.getInviteLink();
    const shareTitle = 'Join my Kaavish Radio Mehfil • Listen Together';
    const shareText = `📻✨ Listen to The Kaavish with me in real-time acoustic sync!\nRoom Code: ${window.roomSync.roomId}\n\nJoin here:\n${inviteUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: inviteUrl
        });
        showToast('✨ Invite shared successfully!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      showToast('🔗 Invite message & link copied to clipboard!');
    } catch (e) {
      navigator.clipboard.writeText(inviteUrl);
      showToast('🔗 Invite link copied to clipboard!');
    }
  });

  // Leave room
  btnLeaveRoom?.addEventListener('click', async () => {
    await window.roomSync.leaveRoom();
    showToast('👋 You have left the Mehfil');
  });

  // Room state change listener
  window.addEventListener('roomstatechange', (e) => {
    const detail = e.detail;
    if (detail.active) {
      if (activeRoomNavPill) activeRoomNavPill.style.display = 'inline-flex';
      if (activeRoomNavText) activeRoomNavText.textContent = `Mehfil #${detail.roomId}`;
      if (roomSyncTag) roomSyncTag.style.display = 'inline-flex';
      if (collabNavText) collabNavText.textContent = 'In Mehfil';
      btnOpenCollab?.classList.add('in-room');

      if (collabInactiveView) collabInactiveView.style.display = 'none';
      if (collabKnockingView) collabKnockingView.style.display = 'none';
      if (collabActiveView) collabActiveView.style.display = 'block';

      if (displayRoomCode) displayRoomCode.textContent = detail.roomId;
      if (displayMemberCount) {
        const count = detail.membersCount;
        displayMemberCount.textContent = `👥 ${count} ${count === 1 ? 'soul' : 'souls'} in sync`;
      }
      if (displayRoleBadge) {
        displayRoleBadge.textContent = detail.isHost ? 'Host' : 'Listener';
      }
    } else {
      if (activeRoomNavPill) activeRoomNavPill.style.display = 'none';
      if (roomSyncTag) roomSyncTag.style.display = 'none';
      if (collabNavText) collabNavText.textContent = 'Mehfil';
      btnOpenCollab?.classList.remove('in-room');

      if (collabInactiveView) collabInactiveView.style.display = 'block';
      if (collabKnockingView) collabKnockingView.style.display = 'none';
      if (collabActiveView) collabActiveView.style.display = 'none';
    }
  });

  // Auto-detect invite code from URL: ?room=123456
  if (window.roomSync && window.roomSync.autoJoinCode) {
    if (joinRoomCodeInput) {
      joinRoomCodeInput.value = window.roomSync.autoJoinCode;
    }
    setTimeout(() => {
      openModal('collabModal');
      showToast(`🔑 Room code #${window.roomSync.autoJoinCode} detected! Tap Join to sync.`);
    }, 600);
  }

  // -------------------------------------------------------------------------
  // Progressive Web App (PWA) Registration & Install Prompt
  // -------------------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[TKR PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[TKR PWA] Service Worker registration failed:', err);
        });
    });
  }

  let deferredInstallPrompt = null;
  const installBtn = document.getElementById('btnInstallApp');
  const heroDownloadBtn = document.getElementById('btnHeroDownload');
  const modalInstallBtn = document.getElementById('btnInstallModalAction');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
    }
  });

  async function triggerInstallFlow() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try {
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('✨ Thank you for downloading The Kaavish Radio (TKR)!');
          if (installBtn) installBtn.style.display = 'none';
        }
      } catch (err) {}
      deferredInstallPrompt = null;
      closeModal('installModal');
    } else {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (isStandalone) {
        showToast('✨ The Kaavish Radio is already installed on your device!');
      } else {
        openModal('installModal');
      }
    }
  }

  installBtn?.addEventListener('click', triggerInstallFlow);
  heroDownloadBtn?.addEventListener('click', triggerInstallFlow);
  modalInstallBtn?.addEventListener('click', triggerInstallFlow);

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installBtn) installBtn.style.display = 'none';
    closeModal('installModal');
    showToast('✨ The Kaavish Radio (TKR) installed successfully!');
  });

  // Auto-prompt on first click to unlock AudioContext
  document.body.addEventListener('click', () => {
    window.ambientEngine.ensureContext();
  }, { once: true });
});
