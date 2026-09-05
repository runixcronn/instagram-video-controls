// Background Service Worker for Instagram Video Controls (MV3)

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

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    const existing = await chrome.storage.sync.get(null);
    const toSet = {};
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (existing[key] === undefined) {
        toSet[key] = value;
      }
    }
    if (Object.keys(toSet).length > 0) {
      await chrome.storage.sync.set(toSet);
    }
  } catch (err) {
    console.error('[IG-Controls-SW] Failed to init defaults:', err);
  }
});
