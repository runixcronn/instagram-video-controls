/**
 * VideoTracker - Manages discovery and active state detection of Instagram video elements.
 * Uses MutationObserver and viewport calculations rather than fragile CSS class selectors.
 */
class VideoTracker {
  constructor() {
    this.videos = new Set();
    this.lastInteractedVideo = null;
    this.videoParents = new WeakMap();
    this.videoContexts = new WeakMap();
    this.videoBindings = new WeakMap();
    this.onVideoAddedCallbacks = [];
    this.onVideoRemovedCallbacks = [];

    this._initObserver();
    this._scanExistingVideos();
  }

  onVideoAdded(callback) {
    this.onVideoAddedCallbacks.push(callback);
    // Notify for any already-found videos
    this.videos.forEach((video) => callback(video));
  }

  onVideoRemoved(callback) {
    this.onVideoRemovedCallbacks.push(callback);
  }

  _initObserver() {
    const observer = new MutationObserver((mutations) => {
      const removedVideos = new Set();

      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          this._videosFromNode(node).forEach((video) =>
            this._registerVideo(video),
          );
        });

        mutation.removedNodes.forEach((node) => {
          this._videosFromNode(node).forEach((video) =>
            removedVideos.add(video),
          );
        });
      }

      removedVideos.forEach((video) => {
        if (document.contains(video)) {
          this._registerVideo(video);
        } else {
          this._unregisterVideo(video);
        }
      });
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  _videosFromNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    if (node.tagName === "VIDEO") return [node];
    return Array.from(node.querySelectorAll?.("video") || []);
  }

  _scanExistingVideos() {
    document.querySelectorAll("video").forEach((v) => this._registerVideo(v));
  }

  _registerVideo(video) {
    if (!video || !document.contains(video)) return;

    const parent = video.parentElement;
    const context = this._getVideoContext(video);
    if (this.videos.has(video)) {
      const contextChanged =
        this.videoParents.get(video) !== parent ||
        this.videoContexts.get(video) !== context;
      this.videoParents.set(video, parent);
      this.videoContexts.set(video, context);
      this._bindParent(video, parent);

      if (video.closest('[role="dialog"]')) {
        this.lastInteractedVideo = video;
      }
      if (contextChanged) this._notifyVideoAdded(video);
      return;
    }

    this.videos.add(video);
    this.videoParents.set(video, parent);
    this.videoContexts.set(video, context);
    const activate = () => this.setActiveVideo(video);
    this.videoBindings.set(video, { activate, parent: null });

    // Track mouse hover to prioritize video under cursor
    video.addEventListener("mouseenter", activate);
    video.addEventListener("pointerdown", activate);
    video.addEventListener("focusin", activate);
    video.addEventListener("play", activate);
    this._bindParent(video, parent);

    if (video.closest('[role="dialog"]')) {
      this.lastInteractedVideo = video;
    }
    this._notifyVideoAdded(video);
  }

  _getVideoContext(video) {
    return (
      video.closest('[role="dialog"]') ||
      video.closest("article") ||
      video.closest("a[href]") ||
      video.parentElement
    );
  }

  _bindParent(video, parent) {
    const binding = this.videoBindings.get(video);
    if (!binding || binding.parent === parent) return;

    if (binding.parent) {
      binding.parent.removeEventListener("mouseenter", binding.activate);
      binding.parent.removeEventListener("pointerdown", binding.activate);
      binding.parent.removeEventListener("focusin", binding.activate);
    }

    binding.parent = parent;
    if (parent) {
      parent.addEventListener("mouseenter", binding.activate);
      parent.addEventListener("pointerdown", binding.activate);
      parent.addEventListener("focusin", binding.activate);
    }
  }

  _notifyVideoAdded(video) {
    this.onVideoAddedCallbacks.forEach((cb) => {
      try {
        cb(video);
      } catch (err) {
        console.error("[IGVC VideoTracker] Error in callback:", err);
      }
    });
  }

  setActiveVideo(video) {
    if (!video || !document.contains(video)) return;
    if (!this.videos.has(video)) this._registerVideo(video);
    this.lastInteractedVideo = video;
  }

  _unregisterVideo(video) {
    if (!this.videos.has(video)) return;

    const binding = this.videoBindings.get(video);
    if (binding) {
      video.removeEventListener("mouseenter", binding.activate);
      video.removeEventListener("pointerdown", binding.activate);
      video.removeEventListener("focusin", binding.activate);
      video.removeEventListener("play", binding.activate);
      if (binding.parent) {
        binding.parent.removeEventListener("mouseenter", binding.activate);
        binding.parent.removeEventListener("pointerdown", binding.activate);
        binding.parent.removeEventListener("focusin", binding.activate);
      }
    }

    this.videos.delete(video);
    this.videoParents.delete(video);
    this.videoContexts.delete(video);
    this.videoBindings.delete(video);
    if (this.lastInteractedVideo === video) {
      this.lastInteractedVideo = null;
    }

    this.onVideoRemovedCallbacks.forEach((cb) => {
      try {
        cb(video);
      } catch (err) {
        console.error("[IGVC VideoTracker] Error in callback:", err);
      }
    });
  }

  /**
   * Determine the most relevant video on the screen.
   */
  getActiveVideo() {
    // Clean up detached videos
    Array.from(this.videos).forEach((video) => {
      if (!document.contains(video)) this._unregisterVideo(video);
    });

    if (this.videos.size === 0) {
      this._scanExistingVideos();
      if (this.videos.size === 0) return null;
    }

    const dialog = this._getTopVisibleDialog();
    if (dialog) {
      const dialogVideos = Array.from(dialog.querySelectorAll("video")).filter(
        (video) => this._isVisibleVideo(video),
      );
      dialogVideos.forEach((video) => this._registerVideo(video));

      if (
        this.lastInteractedVideo &&
        dialog.contains(this.lastInteractedVideo) &&
        this._isVisibleVideo(this.lastInteractedVideo)
      ) {
        return this.lastInteractedVideo;
      }

      return this._selectPreferredVideo(dialogVideos);
    }

    const videoList = Array.from(this.videos);

    // 1. If user hovered a valid video in the viewport, use it
    if (
      this.lastInteractedVideo &&
      this._isVisibleVideo(this.lastInteractedVideo)
    ) {
      return this.lastInteractedVideo;
    }

    // 2. Check for currently playing videos
    const playingVideos = videoList.filter(
      (video) =>
        !video.paused && video.readyState > 0 && this._isVisibleVideo(video),
    );
    if (playingVideos.length === 1) {
      return playingVideos[0];
    } else if (playingVideos.length > 1) {
      // Multiple playing: pick the one closest to screen center
      return this._getClosestToCenter(playingVideos);
    }

    // 3. Fallback: Find visible video closest to the center of viewport
    const visibleVideos = videoList.filter((video) =>
      this._isVisibleVideo(video),
    );

    if (visibleVideos.length > 0) {
      return this._getClosestToCenter(visibleVideos);
    }

    return videoList[0] || null;
  }

  _getTopVisibleDialog() {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    for (let index = dialogs.length - 1; index >= 0; index -= 1) {
      if (this._isVisibleElement(dialogs[index])) return dialogs[index];
    }
    return null;
  }

  _selectPreferredVideo(videos) {
    if (videos.length === 0) return null;
    const playingVideos = videos.filter(
      (video) => !video.paused && video.readyState > 0,
    );
    return this._getClosestToCenter(
      playingVideos.length > 0 ? playingVideos : videos,
    );
  }

  _isVisibleVideo(video) {
    if (!video || !document.contains(video)) return false;
    const rect = video.getBoundingClientRect();
    return (
      rect.width > 50 && rect.height > 50 && this._isVisibleElement(video, rect)
    );
  }

  _isVisibleElement(element, rect = element.getBoundingClientRect()) {
    const style = window.getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number.parseFloat(style.opacity || "1") > 0 &&
      element.getAttribute("aria-hidden") !== "true" &&
      rect.right > 0 &&
      rect.left < window.innerWidth &&
      rect.bottom > 0 &&
      rect.top < window.innerHeight
    );
  }

  _getClosestToCenter(elements) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    let closestEl = null;
    let minDiff = Infinity;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const diff = Math.hypot(
        rect.left + rect.width / 2 - centerX,
        rect.top + rect.height / 2 - centerY,
      );
      if (diff < minDiff) {
        minDiff = diff;
        closestEl = el;
      }
    }

    return closestEl;
  }
}

window.IGVC_VideoTracker = VideoTracker;
