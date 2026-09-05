# Project Roadmap

## Phase 1: Foundation & MVP Core (Completed ✅)
- [x] Setup Manifest V3 configuration (`manifest.json`) and minimal icons.
- [x] Implement `MutationObserver` engine to reliably catch `<video>` elements in Feed and Reels (`src/content/videoTracker.js`).
- [x] Implement Active Video Detector (viewport center & playback state).
- [x] Implement Keyboard Shortcuts Controller (`←`/`→` 5s seek, `J`/`L` 10s seek, `Space`/`K` play-pause, `M` mute/unmute) (`src/content/keyboard.js`).
- [x] Implement Typing Context Shield (prevent shortcut triggers in comment/search inputs).
- [x] Build Minimalist On-Screen Display (OSD badge showing `+5s`, `-5s`, `Paused`, `Playing`) (`src/content/osd.js`).

## Phase 2: Visual Scrubber Overlay & Speed Control (Completed ✅)
- [x] Inject custom interactive Scrubber Bar directly over Feed and Reels videos (`src/content/uiOverlay.js`).
- [x] Add real-time timestamp display (`00:14 / 00:59`).
- [x] Smooth scrubbing (mouse drag & click jump) with full event isolation.
- [x] Playback Speed Selector (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x) via shortcuts (`<` / `>`) and overlay button.

## Phase 3: Popup Settings & Customization (Completed ✅)
- [x] Popup interface (`src/popup/popup.html`, `src/popup/popup.css`, `src/popup/popup.js`).
- [x] Customizable seek jump step (3s, 5s, 10s, 15s).
- [x] Toggle individual shortcuts and features (Scrubber, OSD, Remember Volume).
- [x] Persistent volume memory across video navigation via `chrome.storage.sync`.

## Phase 4: Polish, Testing & Store Preparation (Next Up ⏳)
- [ ] User testing on real Instagram videos (both feed posts and reels).
- [ ] Edge cases: Carousel posts with multiple videos, Stories, fullscreen mode.
- [ ] Chrome Web Store packaging zip and store listing preparation.
