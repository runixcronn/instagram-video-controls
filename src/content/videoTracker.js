/**
 * VideoTracker - Manages discovery and active state detection of Instagram video elements.
 * Uses MutationObserver and viewport calculations rather than fragile CSS class selectors.
 */
class VideoTracker {
  constructor() {
    this.videos = new Set();
    this.lastHoveredVideo = null;
    this.onVideoAddedCallbacks = [];
    this.onVideoRemovedCallbacks = [];

    this._initObserver();
    this._scanExistingVideos();
  }

  onVideoAdded(callback) {
    this.onVideoAddedCallbacks.push(callback);
    // Notify for any already-found videos
    this.videos.forEach(video => callback(video));
  }

  onVideoRemoved(callback) {
    this.onVideoRemovedCallbacks.push(callback);
  }

  _initObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.tagName === 'VIDEO') {
            this._registerVideo(node);
          } else {
            const innerVideos = node.querySelectorAll?.('video');
            if (innerVideos) {
              innerVideos.forEach((v) => this._registerVideo(v));
            }
          }
        });

        mutation.removedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.tagName === 'VIDEO') {
            this._unregisterVideo(node);
          } else {
            const innerVideos = node.querySelectorAll?.('video');
            if (innerVideos) {
              innerVideos.forEach((v) => this._unregisterVideo(v));
            }
          }
        });
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  }

  _scanExistingVideos() {
    document.querySelectorAll('video').forEach((v) => this._registerVideo(v));
  }

  _registerVideo(video) {
    if (this.videos.has(video)) return;
    this.videos.add(video);

    // Track mouse hover to prioritize video under cursor
    video.addEventListener('mouseenter', () => {
      this.lastHoveredVideo = video;
    });

    const parent = video.parentElement;
    if (parent) {
      parent.addEventListener('mouseenter', () => {
        this.lastHoveredVideo = video;
      });
    }

    this.onVideoAddedCallbacks.forEach((cb) => {
      try {
        cb(video);
      } catch (err) {
        console.error('[IGVC VideoTracker] Error in callback:', err);
      }
    });
  }

  _unregisterVideo(video) {
    if (!this.videos.has(video)) return;
    this.videos.delete(video);
    if (this.lastHoveredVideo === video) {
      this.lastHoveredVideo = null;
    }

    this.onVideoRemovedCallbacks.forEach((cb) => {
      try {
        cb(video);
      } catch (err) {
        console.error('[IGVC VideoTracker] Error in callback:', err);
      }
    });
  }

  /**
   * Determine the most relevant video on the screen.
   */
  getActiveVideo() {
    // Clean up detached videos
    this.videos.forEach((v) => {
      if (!document.contains(v)) {
        this.videos.delete(v);
      }
    });

    if (this.videos.size === 0) {
      this._scanExistingVideos();
      if (this.videos.size === 0) return null;
    }

    const videoList = Array.from(this.videos);

    // 1. If user hovered a valid video in the viewport, use it
    if (this.lastHoveredVideo && document.contains(this.lastHoveredVideo)) {
      const r = this.lastHoveredVideo.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) {
        return this.lastHoveredVideo;
      }
    }

    // 2. Check for currently playing videos
    const playingVideos = videoList.filter((v) => !v.paused && v.readyState > 0);
    if (playingVideos.length === 1) {
      return playingVideos[0];
    } else if (playingVideos.length > 1) {
      // Multiple playing: pick the one closest to screen center
      return this._getClosestToCenter(playingVideos);
    }

    // 3. Fallback: Find visible video closest to the center of viewport
    const visibleVideos = videoList.filter((v) => {
      const r = v.getBoundingClientRect();
      return (
        r.width > 50 &&
        r.height > 50 &&
        r.bottom > 50 &&
        r.top < window.innerHeight - 50
      );
    });

    if (visibleVideos.length > 0) {
      return this._getClosestToCenter(visibleVideos);
    }

    return videoList[0] || null;
  }

  _getClosestToCenter(elements) {
    const centerY = window.innerHeight / 2;
    let closestEl = null;
    let minDiff = Infinity;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const elCenterY = rect.top + rect.height / 2;
      const diff = Math.abs(elCenterY - centerY);
      if (diff < minDiff) {
        minDiff = diff;
        closestEl = el;
      }
    }

    return closestEl;
  }
}

window.IGVC_VideoTracker = VideoTracker;
