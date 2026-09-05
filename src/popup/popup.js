/**
 * Popup Logic - Manages user preferences and syncs with chrome.storage.sync
 */
document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    seekStep: document.getElementById('seekStep'),
    seekStepLarge: document.getElementById('seekStepLarge'),
    defaultSpeed: document.getElementById('defaultSpeed'),
    overlayPosition: document.getElementById('overlayPosition'),
    showScrubber: document.getElementById('showScrubber'),
    showOsd: document.getElementById('showOsd'),
    rememberVolume: document.getElementById('rememberVolume')
  };

  // Load saved preferences
  try {
    const data = await chrome.storage.sync.get(null);

    if (data.seekStep !== undefined) {
      elements.seekStep.value = data.seekStep;
    }
    if (data.seekStepLarge !== undefined) {
      elements.seekStepLarge.value = data.seekStepLarge;
    }
    if (data.defaultSpeed !== undefined) {
      elements.defaultSpeed.value = data.defaultSpeed;
    }
    if (data.overlayPosition !== undefined) {
      elements.overlayPosition.value = data.overlayPosition;
    }
    if (data.showScrubber !== undefined) {
      elements.showScrubber.checked = data.showScrubber;
    }
    if (data.showOsd !== undefined) {
      elements.showOsd.checked = data.showOsd;
    }
    if (data.rememberVolume !== undefined) {
      elements.rememberVolume.checked = data.rememberVolume;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }

  // Handle changes
  const saveSetting = async (key, value) => {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
    }
  };

  elements.seekStep.addEventListener('change', (e) => {
    saveSetting('seekStep', parseInt(e.target.value, 10));
  });

  elements.seekStepLarge.addEventListener('change', (e) => {
    saveSetting('seekStepLarge', parseInt(e.target.value, 10));
  });

  elements.defaultSpeed.addEventListener('change', (e) => {
    saveSetting('defaultSpeed', parseFloat(e.target.value));
  });

  elements.overlayPosition.addEventListener('change', (e) => {
    saveSetting('overlayPosition', e.target.value);
  });

  elements.showScrubber.addEventListener('change', (e) => {
    saveSetting('showScrubber', e.target.checked);
  });

  elements.showOsd.addEventListener('change', (e) => {
    saveSetting('showOsd', e.target.checked);
  });

  elements.rememberVolume.addEventListener('change', (e) => {
    saveSetting('rememberVolume', e.target.checked);
  });
});
