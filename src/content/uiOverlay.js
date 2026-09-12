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
        overlayPosition: "above-caption", // 'above-caption' | 'top' | 'bottom'
      },
      settings,
    );

    this.SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    this.overlayRecords = new WeakMap();

    this._init();
  }

  updateSettings(newSettings) {
    this.settings = Object.assign(this.settings, newSettings);

    document.querySelectorAll(".igvc-controls-container").forEach((el) => {
      const isVisible =
        this.settings.showButtons !== false &&
        this.settings.showScrubber !== false;
      el.style.display = isVisible ? "flex" : "none";
      this._applyPositionClass(el, this.settings.overlayPosition);
    });
  }

  _applyPositionClass(overlay, pos) {
    overlay.classList.remove(
      "igvc-pos-top",
      "igvc-pos-above-caption",
      "igvc-pos-bottom",
    );
    if (pos === "top") {
      overlay.classList.add("igvc-pos-top");
    } else if (pos === "bottom") {
      overlay.classList.add("igvc-pos-bottom");
    } else {
      overlay.classList.add("igvc-pos-above-caption");
    }
  }

  _applySizeClass(overlay, video) {
    const width = video.getBoundingClientRect().width;
    overlay.classList.toggle("igvc-compact", width > 0 && width < 360);
    overlay.classList.toggle("igvc-tight", width > 0 && width < 190);
  }

  _init() {
    this.tracker.onVideoAdded((video) => this._attachOverlay(video));
    this.tracker.onVideoRemoved((video) => this._detachOverlay(video));
  }

  _attachOverlay(video) {
    const container = this._findOverlayContainer(video);
    if (!container) return;

    const existing = this.overlayRecords.get(video);
    if (existing) {
      if (existing.overlay.isConnected) {
        if (existing.overlay.parentElement !== container) {
          container.appendChild(existing.overlay);
          existing.bindContainer(container);
        }
        this._applySizeClass(existing.overlay, video);
        return;
      }
      existing.cleanup();
      this.overlayRecords.delete(video);
    }

    const overlay = document.createElement("div");
    overlay.className = "igvc-controls-container";
    this._applyPositionClass(overlay, this.settings.overlayPosition);
    this._applySizeClass(overlay, video);

    const isVisible =
      this.settings.showButtons !== false &&
      this.settings.showScrubber !== false;
    if (!isVisible) {
      overlay.style.display = "none";
    }

    // Clean, compact button bar without problematic scrubber line
    overlay.innerHTML = `
      <div class="igvc-bottom-bar">
        <div class="igvc-controls-row">
          <button type="button" class="igvc-btn igvc-btn-seek igvc-btn-rewind" title="Geri Sar (${this.settings.seekStep || 5}s)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
            <span>-${this.settings.seekStep || 5}</span>
          </button>
          <button type="button" class="igvc-btn igvc-btn-playpause" title="Oynat / Duraklat">
            <svg class="igvc-icon-play" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg class="igvc-icon-pause" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:none">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button type="button" class="igvc-btn igvc-btn-seek igvc-btn-forward" title="İleri Sar (${this.settings.seekStep || 5}s)">
            <span>+${this.settings.seekStep || 5}</span>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 8-8 8-8z"/>
            </svg>
          </button>
          <button type="button" class="igvc-btn igvc-btn-speed" title="Oynatma Hızı">
            ⚡ 1.0x
          </button>
          <span class="igvc-time-display">00:00 / 00:00</span>
        </div>
        <div class="igvc-actions-row">
          <button type="button" class="igvc-btn igvc-btn-toggle-pos" title="Konumu Değiştir (Üst / Alt)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M12 3l4 4H8l4-4zm0 18l-4-4h8l-4 4zM4 11h16v2H4v-2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const eventCleanups = [];
    const listen = (target, type, handler, options) => {
      target.addEventListener(type, handler, options);
      eventCleanups.push(() =>
        target.removeEventListener(type, handler, options),
      );
    };
    const activateVideo = () => this.tracker.setActiveVideo?.(video);
    const consumeControlEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
      activateVideo();
    };
    const isolateControlEvent = (e) => {
      e.stopPropagation();
      activateVideo();
    };
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() =>
        this._applySizeClass(overlay, video),
      );
      resizeObserver.observe(video);
      eventCleanups.push(() => resizeObserver.disconnect());
    }

    // Prevent clicks from triggering Instagram's video tap-to-pause
    ["click", "dblclick"].forEach((evt) => {
      listen(overlay, evt, consumeControlEvent);
    });
    [
      "pointerdown",
      "pointerup",
      "pointercancel",
      "mousedown",
      "mouseup",
      "touchstart",
      "touchend",
    ].forEach((evt) => {
      listen(overlay, evt, isolateControlEvent);
    });

    container.appendChild(overlay);

    // Bind UI elements
    const timeDisplay = overlay.querySelector(".igvc-time-display");
    const playPauseBtn = overlay.querySelector(".igvc-btn-playpause");
    const playIcon = overlay.querySelector(".igvc-icon-play");
    const pauseIcon = overlay.querySelector(".igvc-icon-pause");
    const rewindBtn = overlay.querySelector(".igvc-btn-rewind");
    const forwardBtn = overlay.querySelector(".igvc-btn-forward");
    const speedBtn = overlay.querySelector(".igvc-btn-speed");
    const togglePosBtn = overlay.querySelector(".igvc-btn-toggle-pos");

    // Sync play/pause state
    const updatePlayState = () => {
      if (video.paused) {
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
        overlay.classList.add("igvc-force-visible");
      } else {
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
        overlay.classList.remove("igvc-force-visible");
      }
    };

    listen(video, "play", updatePlayState);
    listen(video, "pause", updatePlayState);
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

    listen(video, "timeupdate", updateTimeUI);
    listen(video, "loadedmetadata", updateTimeUI);
    listen(video, "durationchange", updateTimeUI);

    // Sync speed
    const updateSpeedUI = () => {
      const speed = video.playbackRate || 1.0;
      speedBtn.textContent = `⚡ ${speed}x`;
    };
    listen(video, "ratechange", updateSpeedUI);
    updateSpeedUI();

    // Button actions
    listen(playPauseBtn, "click", (e) => {
      consumeControlEvent(e);
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    listen(rewindBtn, "click", (e) => {
      consumeControlEvent(e);
      const step = this.settings.seekStep || 5;
      video.currentTime = Math.max(0, video.currentTime - step);
      if (this.settings.showOsd) {
        this.osd.show(video, `-${step}s`, "seek-backward");
      }
    });

    listen(forwardBtn, "click", (e) => {
      consumeControlEvent(e);
      const step = this.settings.seekStep || 5;
      const dur = video.duration || Infinity;
      video.currentTime = Math.min(dur, video.currentTime + step);
      if (this.settings.showOsd) {
        this.osd.show(video, `+${step}s`, "seek-forward");
      }
    });

    // Speed button: cycles 0.75x -> 1.0x -> 1.25x -> 1.5x -> 2.0x
    listen(speedBtn, "click", (e) => {
      consumeControlEvent(e);
      const current = video.playbackRate || 1.0;
      let idx = this.SPEED_OPTIONS.findIndex(
        (s) => Math.abs(s - current) < 0.05,
      );
      idx = (idx + 1) % this.SPEED_OPTIONS.length;
      const nextSpeed = this.SPEED_OPTIONS[idx];
      video.playbackRate = nextSpeed;
      if (this.settings.showOsd) {
        this.osd.show(video, `${nextSpeed}x Hız`, "speed");
      }
    });

    // Position toggle button (flips between 'above-caption' and 'top')
    listen(togglePosBtn, "click", (e) => {
      consumeControlEvent(e);
      const currentPos = this.settings.overlayPosition || "above-caption";
      const newPos = currentPos === "top" ? "above-caption" : "top";
      this.settings.overlayPosition = newPos;

      document.querySelectorAll(".igvc-controls-container").forEach((el) => {
        this._applyPositionClass(el, newPos);
      });

      if (this.settings.showOsd) {
        this.osd.show(
          video,
          newPos === "top" ? "Konum: Üst" : "Konum: Yazı Üstü",
          "info",
        );
      }

      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.sync
      ) {
        chrome.storage.sync.set({ overlayPosition: newPos }).catch(() => {});
      }
    });

    // Auto-hide controls when idle (shows on hover or paused)
    let hideTimer = null;
    const showOverlay = () => {
      this._applySizeClass(overlay, video);
      overlay.classList.add("igvc-active-hover");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!video.paused) {
          overlay.classList.remove("igvc-active-hover");
        }
      }, 2500);
    };

    const hideOverlay = () => {
      if (!video.paused) {
        overlay.classList.remove("igvc-active-hover");
      }
    };
    const record = {
      overlay,
      container: null,
      containerCleanups: [],
      bindContainer: (nextContainer) => {
        record.containerCleanups.forEach((cleanup) => cleanup());
        record.containerCleanups = [];
        record.container = nextContainer;

        const bind = (type, handler, options) => {
          nextContainer.addEventListener(type, handler, options);
          record.containerCleanups.push(() =>
            nextContainer.removeEventListener(type, handler, options),
          );
        };

        bind("mousemove", showOverlay);
        bind("mouseenter", showOverlay);
        bind("pointermove", showOverlay, { passive: true });
        bind("mouseleave", hideOverlay);
      },
      cleanup: () => {
        clearTimeout(hideTimer);
        record.containerCleanups.forEach((cleanup) => cleanup());
        eventCleanups.forEach((cleanup) => cleanup());
        overlay.remove();
      },
    };

    record.bindContainer(container);
    this.overlayRecords.set(video, record);
  }

  _detachOverlay(video) {
    const record = this.overlayRecords.get(video);
    if (!record) return;

    record.cleanup();
    this.overlayRecords.delete(video);
  }

  _formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}`;
  }

  _findOverlayContainer(video) {
    const vRect = video.getBoundingClientRect();
    let container = null;
    let parent = video.parentElement;

    while (parent && parent !== document.body) {
      const rect = parent.getBoundingClientRect();
      if (
        rect.width >= vRect.width * 0.9 &&
        rect.height >= vRect.height * 0.9
      ) {
        container = parent;
        break;
      }
      parent = parent.parentElement;
    }

    container ||= video.parentElement;
    if (!container) return null;

    const anchor = video.closest("a[href]");
    const dialog = video.closest('[role="dialog"]');
    if (anchor?.contains(container) && anchor.parentElement) {
      const host = anchor.parentElement;
      const rect = host.getBoundingClientRect();
      const sameContext = !dialog || dialog.contains(host);
      const sizedLikeVideo =
        vRect.width > 0 &&
        vRect.height > 0 &&
        rect.width >= vRect.width * 0.9 &&
        rect.width <= vRect.width * 1.5 &&
        rect.height >= vRect.height * 0.9 &&
        rect.height <= vRect.height * 1.5;

      if (sameContext && sizedLikeVideo) {
        container = host;
      }
    }

    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
    return container;
  }
}

window.IGVC_UIOverlay = UIOverlayController;
