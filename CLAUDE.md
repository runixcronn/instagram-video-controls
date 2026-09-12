# Instagram Video Controls - Project Context

Chrome Extension (Manifest V3) adding intuitive playback controls (seek, speed, volume, OSD) to Instagram feed posts and Reels videos.

## Core Tech Stack
- **Manifest Version**: Manifest V3
- **Languages**: Vanilla JavaScript (ES6+), HTML5, Modern CSS (Glassmorphism)
- **Zero External Dependencies**: Lightweight, fast, high privacy

## Architecture & Context Routing
→ content: src/content/CLAUDE.md
→ background: src/background/CLAUDE.md
→ popup: src/popup/CLAUDE.md

## Memory & Documentation
- `.memory/decisions.md` : artık `../ikinci-beyin/wiki/decisions/instagram-video-controls/`'a yönlendiren bir not — yeni ADR'ler doğrudan oraya yazılır
- `.memory/patterns.md` : Resilient DOM selection, Video Observer & Event Isolation patterns
- `.memory/roadmap.md` : Phased implementation progress
- `.memory/inbox.md` : Potential features & exploratory items

## İkinci Beyin (Wiki)
`../ikinci-beyin` bu makinedeki kişisel vikimdir (bkz. `../ikinci-beyin/CLAUDE.md`).
Yeni bir mimari karar alındığında, yeniden kullanılabilir bir kod snippet'i ortaya
çıktığında ya da dokümante edilmeye değer bir çıkarım oluştuğunda:
`../ikinci-beyin/CLAUDE.md`'deki ingest akışını uygula, ilgili wiki sayfasını
(`wiki/decisions/instagram-video-controls/`, `wiki/snippets/`, `wiki/concepts/`)
oluştur/güncelle, `index.md` ve `log.md`'yi güncelle. Her küçük değişiklikte değil,
gerçekten kayda değer olduğunda yap.
