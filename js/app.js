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
  // Live Listeners Simulator
  // -------------------------------------------------------------------------
  const liveCountEl = document.getElementById('liveListenerCount');
  let currentListeners = 1429;

  setInterval(() => {
    const delta = Math.floor(Math.random() * 5) - 2;
    currentListeners = Math.max(1280, Math.min(1850, currentListeners + delta));
    if (liveCountEl) {
      liveCountEl.textContent = `${currentListeners.toLocaleString()} listening`;
    }
  }, 4500);

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
        searchInput.focus();
      }
      searchClearBtn.style.display = 'none';
      renderPlaylist('');
    });
  }

  // Initial render
  renderPlaylist('');

  // Auto-focus search input when opening playlist modal
  document.getElementById('btnOpenPlaylist')?.addEventListener('click', () => {
    setTimeout(() => {
      if (searchInput) {
        searchInput.value = '';
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        renderPlaylist('');
        searchInput.focus();
      }
    }, 150);
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
  document.getElementById('btnOpenMobileQR')?.addEventListener('click', () => openModal('mobileQRModal'));

  // Mini Banner close
  document.getElementById('closeBannerBtn')?.addEventListener('click', () => {
    const banner = document.getElementById('miniBanner');
    if (banner) banner.style.display = 'none';
  });

  // Share button
  document.getElementById('btnShare')?.addEventListener('click', async () => {
    const shareData = {
      title: 'The Kaavish Radio',
      text: 'Immerse in an ambient street-corner sanctuary dedicated to the timeless music of The Kaavish.',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch(err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
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

  // Auto-prompt on first click to unlock AudioContext
  document.body.addEventListener('click', () => {
    window.ambientEngine.ensureContext();
  }, { once: true });
});
