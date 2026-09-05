/**
 * UIOverlayController - Injects a compact, elegant floating control bar directly on Instagram videos.
 * Features:
 * - Direct click buttons: -5s, Play/Pause, +5s, Playback Speed (1.0x/1.25x/1.5x/2.0x).
 * - Live timestamp counter: 00:07 / 00:19.
 * - Position switcher (⇅): Flip between Top and Above-Caption with 1 click.
 * - Anti-collision: Sits safely above captions and away from Instagram's native sound button.
 * - Zero fragile drag gestures: 100% stable, fast, and lightweight.
 */
class UIOverlayController {
  constructor(videoTracker, osdController, settings) {
    this.tracker = videoTracker;
    this.osd = osdController;
    this.settings = Object.assign(
      {
        showButtons: true,
        seekStep: 5,
        overlayPosition: 'above-caption' // 'above-caption' | 'top' | 'bottom'
      },
      settings
    );

    this.SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

    this._init();
  }

  updateSettings(newSettings) {
    this.settings = Object.assign(this.settings, newSettings);

    document.querySelectorAll('.igvc-controls-container').forEach((el) => {
      const isVisible = this.settings.showButtons !== false && this.settings.showScrubber !== false;
      el.style.display = isVisible ? 'flex' : 'none';
      this._applyPositionClass(el, this.settings.overlayPosition);
    });
  }

  _applyPositionClass(overlay, pos) {
    overlay.classList.remove('igvc-pos-top', 'igvc-pos-above-caption', 'igvc-pos-bottom');
    if (pos === 'top') {
      overlay.classList.add('igvc-pos-top');
    } else if (pos === 'bottom') {
      overlay.classList.add('igvc-pos-bottom');
    } else {
      overlay.classList.add('igvc-pos-above-caption');
    }
  }

  _init() {
    this.tracker.onVideoAdded((video) => this._attachOverlay(video));
  }

  _attachOverlay(video) {
    if (video.__igvc_overlay_attached) return;
    video.__igvc_overlay_attached = true;

    const container = this._findOverlayContainer(video);
    if (!container) return;

    const overlay = document.createElement('div');
    overlay.className = 'igvc-controls-container';
    this._applyPositionClass(overlay, this.settings.overlayPosition);

    const isVisible = this.settings.showButtons !== false && this.settings.showScrubber !== false;
    if (!isVisible) {
      overlay.style.display = 'none';
    }

    // Clean, compact button bar without problematic scrubber line
    overlay.innerHTML = `
      <div class="igvc-bottom-bar">
        <div class="igvc-controls-row">
          <button class="igvc-btn igvc-btn-seek igvc-btn-rewind" title="Geri Sar (${this.settings.seekStep || 5}s)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
            <span>-${this.settings.seekStep || 5}</span>
          </button>
          <button class="igvc-btn igvc-btn-playpause" title="Oynat / Duraklat">
            <svg class="igvc-icon-play" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg class="igvc-icon-pause" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:none">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button class="igvc-btn igvc-btn-seek igvc-btn-forward" title="İleri Sar (${this.settings.seekStep || 5}s)">
            <span>+${this.settings.seekStep || 5}</span>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 8-8 8-8z"/>
            </svg>
          </button>
          <button class="igvc-btn igvc-btn-speed" title="Oynatma Hızı">
            ⚡ 1.0x
          </button>
          <span class="igvc-time-display">00:00 / 00:00</span>
        </div>
        <div class="igvc-actions-row">
          <button class="igvc-btn igvc-btn-toggle-pos" title="Konumu Değiştir (Üst / Alt)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 3l4 4H8l4-4zm0 18l-4-4h8l-4 4zM4 11h16v2H4v-2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Prevent clicks from triggering Instagram's video tap-to-pause
    ['click', 'dblclick', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach((evt) => {
      overlay.addEventListener(evt, (e) => {
        e.stopPropagation();
      });
    });

    container.appendChild(overlay);

    // Bind UI elements
    const timeDisplay = overlay.querySelector('.igvc-time-display');
    const playPauseBtn = overlay.querySelector('.igvc-btn-playpause');
    const playIcon = overlay.querySelector('.igvc-icon-play');
    const pauseIcon = overlay.querySelector('.igvc-icon-pause');
    const rewindBtn = overlay.querySelector('.igvc-btn-rewind');
    const forwardBtn = overlay.querySelector('.igvc-btn-forward');
    const speedBtn = overlay.querySelector('.igvc-btn-speed');
    const togglePosBtn = overlay.querySelector('.igvc-btn-toggle-pos');

    // Sync play/pause state
    const updatePlayState = () => {
      if (video.paused) {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        overlay.classList.add('igvc-force-visible');
      } else {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        overlay.classList.remove('igvc-force-visible');
      }
    };

    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);
    updatePlayState();

    // Sync time updates
    const updateTimeUI = () => {
      const current = video.currentTime || 0;
      const duration = video.duration || 0;

      if (duration > 0) {
        timeDisplay.textContent = `${this._formatTime(current)} / ${this._formatTime(duration)}`;
      } else {
        timeDisplay.textContent = `${this._formatTime(current)}`;
      }
    };

    video.addEventListener('timeupdate', updateTimeUI);
    video.addEventListener('loadedmetadata', updateTimeUI);
    video.addEventListener('durationchange', updateTimeUI);

    // Sync speed
    const updateSpeedUI = () => {
      const speed = video.playbackRate || 1.0;
      speedBtn.textContent = `⚡ ${speed}x`;
    };
    video.addEventListener('ratechange', updateSpeedUI);
    updateSpeedUI();

    // Button actions
    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    rewindBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const step = this.settings.seekStep || 5;
      video.currentTime = Math.max(0, video.currentTime - step);
      if (this.settings.showOsd) {
        this.osd.show(video, `-${step}s`, 'seek-backward');
      }
    });

    forwardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const step = this.settings.seekStep || 5;
      const dur = video.duration || Infinity;
      video.currentTime = Math.min(dur, video.currentTime + step);
      if (this.settings.showOsd) {
        this.osd.show(video, `+${step}s`, 'seek-forward');
      }
    });

    // Speed button: cycles 0.75x -> 1.0x -> 1.25x -> 1.5x -> 2.0x
    speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = video.playbackRate || 1.0;
      let idx = this.SPEED_OPTIONS.findIndex((s) => Math.abs(s - current) < 0.05);
      idx = (idx + 1) % this.SPEED_OPTIONS.length;
      const nextSpeed = this.SPEED_OPTIONS[idx];
      video.playbackRate = nextSpeed;
      if (this.settings.showOsd) {
        this.osd.show(video, `${nextSpeed}x Hız`, 'speed');
      }
    });

    // Position toggle button (flips between 'above-caption' and 'top')
    togglePosBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentPos = this.settings.overlayPosition || 'above-caption';
      const newPos = currentPos === 'top' ? 'above-caption' : 'top';
      this.settings.overlayPosition = newPos;

      document.querySelectorAll('.igvc-controls-container').forEach((el) => {
        this._applyPositionClass(el, newPos);
      });

      if (this.settings.showOsd) {
        this.osd.show(video, newPos === 'top' ? 'Konum: Üst' : 'Konum: Yazı Üstü', 'info');
      }

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ overlayPosition: newPos }).catch(() => {});
      }
    });

    // Auto-hide controls when idle (shows on hover or paused)
    let hideTimer = null;
    const showOverlay = () => {
      overlay.classList.add('igvc-active-hover');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!video.paused) {
          overlay.classList.remove('igvc-active-hover');
        }
      }, 2500);
    };

    container.addEventListener('mousemove', showOverlay);
    container.addEventListener('mouseenter', showOverlay);
    container.addEventListener('pointermove', showOverlay, { passive: true });
    container.addEventListener('mouseleave', () => {
      if (!video.paused) {
        overlay.classList.remove('igvc-active-hover');
      }
    });
  }

  _formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}`;
  }

  _findOverlayContainer(video) {
    let parent = video.parentElement;
    while (parent && parent !== document.body) {
      const rect = parent.getBoundingClientRect();
      const vRect = video.getBoundingClientRect();
      if (rect.width >= vRect.width * 0.9 && rect.height >= vRect.height * 0.9) {
        const computed = window.getComputedStyle(parent).position;
        if (computed === 'static') {
          parent.style.position = 'relative';
        }
        return parent;
      }
      parent = parent.parentElement;
    }
    return video.parentElement;
  }
}

window.IGVC_UIOverlay = UIOverlayController;
