/**
 * Content Script Entry Point - Instagram Video Controls
 * Coordinates video tracker, OSD, keyboard shortcuts, and UI overlay.
 */
(async function initInstagramVideoControls() {
  const DEFAULT_SETTINGS = {
    seekStep: 5,
    seekStepLarge: 10,
    showOsd: true,
    showScrubber: true,
    defaultSpeed: 1.0,
    overlayPosition: 'above-caption',
    rememberVolume: true,
    savedVolume: 1.0
  };

  let settings = { ...DEFAULT_SETTINGS };

  // Load user settings from chrome.storage
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      const stored = await chrome.storage.sync.get(null);
      settings = { ...DEFAULT_SETTINGS, ...stored };
    }
  } catch (e) {
    console.warn('[IGVC] Could not access chrome.storage.sync, using defaults.', e);
  }

  // Initialize Modules
  const tracker = new window.IGVC_VideoTracker();
  const osd = new window.IGVC_OSD();
  const keyboard = new window.IGVC_Keyboard(tracker, osd, settings);
  const uiOverlay = new window.IGVC_UIOverlay(tracker, osd, settings);

  // Apply default speed & volume to new videos
  tracker.onVideoAdded((video) => {
    if (settings.defaultSpeed && settings.defaultSpeed !== 1.0) {
      video.playbackRate = settings.defaultSpeed;
    }
    if (settings.rememberVolume && settings.savedVolume !== undefined) {
      video.volume = settings.savedVolume;
    }
  });

  // Track volume changes to remember user's preferred volume
  document.addEventListener(
    'volumechange',
    (e) => {
      if (e.target && e.target.tagName === 'VIDEO' && settings.rememberVolume) {
        const v = e.target;
        if (!v.muted) {
          chrome.storage.sync.set({ savedVolume: v.volume }).catch(() => {});
        }
      }
    },
    true
  );

  // Listen for setting changes from popup
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        const updated = {};
        for (const [k, v] of Object.entries(changes)) {
          updated[k] = v.newValue;
          settings[k] = v.newValue;
        }
        keyboard.updateSettings(updated);
        uiOverlay.updateSettings(updated);
      }
    });
  }

  console.log('%c[IG Video Controls] Active & Ready (Reels + Feed)', 'color: #E1306C; font-weight: bold;');
})();
