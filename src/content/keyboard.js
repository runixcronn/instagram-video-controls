/**
 * KeyboardController - Manages shortcuts for Instagram videos.
 * Safely ignores shortcuts when user is interacting with text inputs or writing comments.
 */
class KeyboardController {
  constructor(videoTracker, osdController, settings) {
    this.tracker = videoTracker;
    this.osd = osdController;
    this.settings = settings || {
      seekStep: 5,
      seekStepLarge: 10,
      showOsd: true
    };

    this.SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

    this._onKeyDown = this._onKeyDown.bind(this);
    window.addEventListener('keydown', this._onKeyDown, { capture: true });
  }

  updateSettings(newSettings) {
    this.settings = Object.assign(this.settings, newSettings);
  }

  _isTypingContext(e) {
    const el = document.activeElement;
    if (!el) return false;

    // Standard input tags
    const tag = el.tagName.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return true;
    }

    // Rich text editors & comments
    if (el.isContentEditable) return true;

    // ARIA roles for custom inputs
    const role = el.getAttribute('role');
    if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
      return true;
    }

    // Check if target element inside input
    if (e.target && e.target.isContentEditable) return true;

    return false;
  }

  _onKeyDown(e) {
    // Never intercept when typing
    if (this._isTypingContext(e)) return;

    // Ignore modifier combinations (Ctrl+C, Alt+Tab, etc.) except Shift for < / >
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const video = this.tracker.getActiveVideo();
    if (!video) return;

    const key = e.key;
    const code = e.code;

    switch (code) {
      // 5-second Seek Backward
      case 'ArrowLeft': {
        e.preventDefault();
        e.stopPropagation();
        const step = this.settings.seekStep || 5;
        this._seek(video, -step);
        if (this.settings.showOsd) {
          this.osd.show(video, `-${step}s`, 'seek-backward');
        }
        break;
      }

      // 5-second Seek Forward
      case 'ArrowRight': {
        e.preventDefault();
        e.stopPropagation();
        const step = this.settings.seekStep || 5;
        this._seek(video, step);
        if (this.settings.showOsd) {
          this.osd.show(video, `+${step}s`, 'seek-forward');
        }
        break;
      }

      // 10-second Seek Backward (YouTube J)
      case 'KeyJ': {
        e.preventDefault();
        e.stopPropagation();
        const step = this.settings.seekStepLarge || 10;
        this._seek(video, -step);
        if (this.settings.showOsd) {
          this.osd.show(video, `-${step}s`, 'seek-backward');
        }
        break;
      }

      // 10-second Seek Forward (YouTube L)
      case 'KeyL': {
        e.preventDefault();
        e.stopPropagation();
        const step = this.settings.seekStepLarge || 10;
        this._seek(video, step);
        if (this.settings.showOsd) {
          this.osd.show(video, `+${step}s`, 'seek-forward');
        }
        break;
      }

      // Play / Pause Toggle (Space or K)
      case 'Space':
      case 'KeyK': {
        e.preventDefault();
        e.stopPropagation();
        if (video.paused) {
          video.play().catch(() => {});
          if (this.settings.showOsd) this.osd.show(video, 'Oynatılıyor', 'play');
        } else {
          video.pause();
          if (this.settings.showOsd) this.osd.show(video, 'Duraklatıldı', 'pause');
        }
        break;
      }

      // Mute / Unmute (M)
      case 'KeyM': {
        e.preventDefault();
        e.stopPropagation();
        video.muted = !video.muted;
        if (this.settings.showOsd) {
          this.osd.show(
            video,
            video.muted ? 'Sessiz' : 'Ses Açık',
            video.muted ? 'mute' : 'volume'
          );
        }
        break;
      }

      // Playback Speed Down (< or , or [)
      case 'BracketLeft':
      case 'Comma': {
        if (e.shiftKey || code === 'BracketLeft') {
          e.preventDefault();
          e.stopPropagation();
          this._adjustSpeed(video, -1);
        }
        break;
      }

      // Playback Speed Up (> or . or ])
      case 'BracketRight':
      case 'Period': {
        if (e.shiftKey || code === 'BracketRight') {
          e.preventDefault();
          e.stopPropagation();
          this._adjustSpeed(video, 1);
        }
        break;
      }

      // Fullscreen (F)
      case 'KeyF': {
        e.preventDefault();
        e.stopPropagation();
        this._toggleFullscreen(video);
        break;
      }
    }
  }

  _seek(video, delta) {
    if (!video.duration || isNaN(video.duration)) {
      video.currentTime = Math.max(0, video.currentTime + delta);
      return;
    }
    const newTime = Math.min(Math.max(0, video.currentTime + delta), video.duration);
    video.currentTime = newTime;
  }

  _adjustSpeed(video, direction) {
    const currentSpeed = video.playbackRate || 1.0;
    let nextIndex = this.SPEEDS.findIndex((s) => Math.abs(s - currentSpeed) < 0.05);

    if (nextIndex === -1) {
      nextIndex = this.SPEEDS.indexOf(1.0);
    }

    nextIndex = Math.max(0, Math.min(this.SPEEDS.length - 1, nextIndex + direction));
    const newSpeed = this.SPEEDS[nextIndex];
    video.playbackRate = newSpeed;

    if (this.settings.showOsd) {
      this.osd.show(video, `${newSpeed}x Hız`, 'speed');
    }
  }

  _toggleFullscreen(video) {
    const container = video.closest('article') || video.parentElement;
    const target = container || video;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }
}

window.IGVC_Keyboard = KeyboardController;
