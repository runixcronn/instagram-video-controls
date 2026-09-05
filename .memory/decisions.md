# Architecture Decision Records (ADRs)

## ADR-001: Manifest V3 over V2
- **Status:** Approved
- **Context:** Chrome Web Store strictly enforces Manifest V3.
- **Decision:** Use Manifest V3 with Service Worker (`background.js`) for extension lifecycle and commands, and Content Scripts for DOM video interaction.
- **Consequence:** Background worker is ephemeral; state must persist in `chrome.storage.sync` or `chrome.storage.local`.

## ADR-002: Custom Overlay Controller vs Native `video.controls = true`
- **Status:** Approved
- **Context:** Setting `video.controls = true` breaks on Instagram due to transparent click-trap overlays (`div` layers for tap-to-pause and double-tap-like). Native controls also clash with Instagram's sleek UI.
- **Decision:** Inject a custom, lightweight, glassmorphic overlay controller at the top layer (`z-index: 2147483647 !important;`) with `event.stopPropagation()` to completely insulate seeking from Instagram's click events.
- **Consequence:** We maintain full control over styling, sizing, tooltips, and time formatting.

## ADR-003: Pure Vanilla JS (No Framework / Zero Dependencies)
- **Status:** Approved
- **Context:** Extensions must be ultra-fast, lightweight, and secure without bundler bloat or performance hits on Instagram's already heavy SPA.
- **Decision:** Build modular Vanilla JS modules loaded via content scripts and standard CSS.

## ADR-004: Anti-Collision Overlay Positioning & Sound Button Safe Zone
- **Status:** Approved
- **Context:** Instagram renders captions, author usernames, and sound/mute buttons in the bottom 70-80px of Reels/vertical videos. Placing custom controls at `bottom: 12px` and right-aligned buttons caused direct collisions with captions and Instagram's native speaker button.
- **Decision:**
  1. Default overlay position elevated to `bottom: 80px` (`above-caption`) for Reels/vertical videos, sitting cleanly above all text.
  2. Provide instant 1-click toggle button (`⇅`) and popup setting to flip between `above-caption`, `top` (top: 14px), and `bottom`.
  3. Group speed and playback controls on the left/center; keep the bottom-right corner completely empty so it never touches Instagram's speaker button.

## ADR-005: Streamline to Compact Control Pill (Remove Problematic Scrubber Line)
- **Status:** Approved
- **Context:** Draggable scrubbers on Instagram's web player suffer from React synthetic event capture and continuous seeking decoder buffer issues. Users prefer clean, reliable jump buttons and keyboard shortcuts over a buggy dragging bar.
- **Decision:** Completely remove the scrubber track and slider line. Streamline the UI into an ultra-compact, sleek floating pill containing:
  - Jump buttons: `[-5s]` and `[+5s]` (instant, reliable seek)
  - `[Play/Pause]` toggle
  - `[⚡ Speed]` toggle button (0.5x to 2.0x)
  - `[00:07 / 00:19]` live timestamp display
  - `[⇅]` 1-click position switcher
  - Full keyboard shortcuts (`←`/`→`, `J`/`L`, `Space`, `<`/`>`, `M`, `F`) and OSD HUD badges.
- **Consequence:** 100% stable, zero drag bugs, takes up almost no space on the video, and never conflicts with Instagram gestures.
