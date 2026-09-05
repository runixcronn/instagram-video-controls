# Design & Code Patterns

## Pattern 1: Resilient DOM Selectors (Antifragile against Instagram Obfuscation)
- **Problem:** Instagram updates frequently change hashed CSS classes (e.g. `.x1lliihq`, `._a9-z`).
- **Solution:** Never query obfuscated class names. Target semantic tags and structural containers:
  - `video` tag directly.
  - `video.closest('article')` for Feed posts.
  - `video.closest('div[role="dialog"]')` for Modal/Explore popups.
  - URL route checks: `window.location.pathname.startsWith('/reels/')`.

## Pattern 2: Viewport-Based Active Video Tracker
- **Problem:** Multiple `<video>` tags exist in DOM simultaneously during feed and reels virtualization.
- **Solution:** Combine `MutationObserver` (to discover and hook newly inserted `<video>` elements) with viewport intersection tracking (`video.getBoundingClientRect()` and `!video.paused` state) to identify the currently watched video.

## Pattern 3: Typing Context Shield (Keyboard Isolation)
- **Problem:** Hotkeys like J/L/Arrow keys or Spacebar should not seek or pause while user is typing a comment or search query.
- **Solution:** Check `document.activeElement`:
  - `tagName === 'INPUT' || tagName === 'TEXTAREA' || isContentEditable || getAttribute('role') === 'textbox'`.
  - If true, completely bypass keyboard handler.

## Pattern 4: Click & Drag Event Trapping
- **Problem:** Scrubbing the seek bar triggers Instagram's tap-to-pause or like gestures.
- **Solution:** On all scrubber and overlay control elements, bind `mousedown`, `click`, `dblclick`, and `touchstart` with `e.stopPropagation()`.
