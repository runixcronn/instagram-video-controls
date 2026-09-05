# Content Scripts Context

Handles all DOM interaction on Instagram web pages.

## Files
- `videoTracker.js` : Tracks `<video>` elements with `MutationObserver`, selects active video in viewport.
- `osd.js` : Displays lightweight HUD badges (`+5s`, `-5s`, speed, play/pause) over the active video.
- `keyboard.js` : Global keyboard shortcuts listener with typing shield.
- `uiOverlay.js` : Custom sleek scrubber bar with time display, drag scrubbing, and speed toggle.
- `content.js` : Bootstraps observers, listens for storage changes, and coordinates modules.
- `styles.css` : Glassmorphism, animations, and non-intrusive Instagram-friendly styles.

## Critical Rules
1. Never query hashed class names (e.g., `._a9-z`). Query semantic tags (`video`) and structural containers (`article`, `[role="dialog"]`).
2. Always verify `document.activeElement` before acting on keyboard shortcuts.
3. Isolate overlay mouse events with `e.stopPropagation()` to prevent Instagram click traps (like, pause, sound toggle).
