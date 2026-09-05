/**
 * OSDController - Displays On-Screen Display badges/HUD over the active video.
 * Shows feedback for seek jumps (+5s/-5s), play/pause, volume, and playback speed.
 */
class OSDController {
  constructor() {
    this.activeBadge = null;
    this.hideTimeout = null;
    this.accumulatedSeek = 0;
    this.accumulatedTimer = null;
  }

  /**
   * Show feedback on the given video.
   * @param {HTMLVideoElement} video 
   * @param {string} text - e.g. "+5s", "1.25x", "Oynatılıyor"
   * @param {string} type - 'seek' | 'play' | 'pause' | 'speed' | 'volume'
   */
  show(video, text, type = 'info') {
    if (!video || !document.contains(video)) return;

    // Locate suitable parent container
    const container = this._findVideoContainer(video);
    if (!container) return;

    // Ensure container is positioned for absolute child
    const computedPos = window.getComputedStyle(container).position;
    if (computedPos === 'static') {
      container.style.position = 'relative';
    }

    let badge = container.querySelector('.igvc-osd-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'igvc-osd-badge';
      container.appendChild(badge);
    }

    // Choose appropriate icon
    let iconSvg = '';
    switch (type) {
      case 'seek-forward':
        iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>';
        break;
      case 'seek-backward':
        iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm9-12v12l-8.5-6L20 6z" transform="rotate(180 12 12)"/></svg>';
        break;
      case 'play':
        iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        break;
      case 'pause':
        iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        break;
      case 'speed':
        iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>';
        break;
      case 'mute':
        iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
        break;
      case 'volume':
        iconSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        break;
      default:
        iconSvg = '';
    }

    badge.innerHTML = `${iconSvg}<span>${text}</span>`;
    badge.classList.remove('igvc-osd-visible');

    // Force reflow for clean restart of transition
    void badge.offsetWidth;
    badge.classList.add('igvc-osd-visible');

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = setTimeout(() => {
      badge.classList.remove('igvc-osd-visible');
    }, 850);
  }

  _findVideoContainer(video) {
    // Look for parent with substantial size matching the video
    let current = video.parentElement;
    while (current && current !== document.body) {
      const rect = current.getBoundingClientRect();
      const vRect = video.getBoundingClientRect();
      if (rect.width >= vRect.width * 0.9 && rect.height >= vRect.height * 0.9) {
        return current;
      }
      current = current.parentElement;
    }
    return video.parentElement;
  }
}

window.IGVC_OSD = OSDController;
