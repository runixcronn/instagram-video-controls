# Instagram Video Controls (Reels & Feed) 🎬

Instagram'ın web sürümündeki eksik video oynatıcı denetimlerini tamamlayan, modern ve hafif bir Chrome Eklentisi (Manifest V3).

Hem **Reels videoları** hem de **Feed (gönderi) videoları** üzerinde tam kontrol sağlar.

---

## ✨ Özellikler

* ⏩ **İleri / Geri Sarma (Seek):**
  * `←` / `→` : 5 saniye atlama (Popup ayarlarından değiştirilebilir).
  * `J` / `L` : 10 saniye hızlı atlama (YouTube standardı).
* ⏯️ **Oynat / Duraklat (Play / Pause):**
  * `Space` veya `K` tuşuyla anında oynat / duraklat (sayfa aşağı kaymaz).
* ⚡ **Oynatma Hızı (Speed Control):**
  * `<` / `>` tuşları veya scrubber üzerindeki hız butonuyla 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x hız ayarı.
* 🎚️ **Görsel Sarma Çubuğu (Scrubber Bar):**
  * Video üzerine fareyle gelindiğinde veya duraklatıldığında beliren şık, yarı saydam (glassmorphism) ilerleme çubuğu.
  * Tıklayarak veya sürükleyerek istediğiniz saniyeye atlayabilme.
  * Geçen süre ve toplam süre sayacı (`00:15 / 00:59`).
* 🔔 **On-Screen Display (OSD HUD):**
  * Kısayol tuşuna basıldığında video üzerinde YouTube benzeri zarif `+5s`, `-5s`, `Duraklatıldı`, `1.5x` bildirim rozeti.
* 🛡️ **Akıllı Giriş Kalkanı (Typing Shield):**
  * Yorum yazarken, arama yaparken veya DM gönderirken kısayol tuşları otomatik olarak devre dışı kalır.
* ⚙️ **Ayarlar Menüsü (Popup):**
  * Atlama sürelerini, varsayılan oynatma hızını ve bildirimleri özelleştirme.

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
| :--- | :--- |
| `←` / `→` | 5 saniye geri / ileri sarma |
| `J` / `L` | 10 saniye geri / ileri sarma |
| `Boşluk (Space)` / `K` | Oynat / Duraklat |
| `M` | Sesi aç / kapat |
| `<` / `>` | Oynatma hızını azalt / artır |
| `F` | Tam ekran moduna geç / çık |

---

## 🚀 Kurulum (Chrome / Edge / Brave)

1. Tarayıcınızın adres çubuğuna `chrome://extensions` yazıp Enter'a basın.
2. Sağ üst köşedeki **"Geliştirici modu" (Developer mode)** anahtarını açın.
3. Sol üstteki **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıklayın.
4. Bu proje klasörünü (`c:\Users\USER\Desktop\projem\instagram-video-controls`) seçin.
5. `https://www.instagram.com` adresini açın (açıksa sayfayı bir kez yenileyin).
6. Bir Reel veya video gönderisi açıp ok tuşlarıyla sarmayı deneyin!

---

## 📁 Proje Yapısı

```
instagram-video-controls/
├── manifest.json              # Chrome Manifest V3 konfigürasyonu
├── icons/                     # Eklenti logoları (16x16, 48x48, 128x128)
├── src/
│   ├── background/
│   │   └── service-worker.js  # Varsayılan ayarlar ve depolama
│   ├── content/
│   │   ├── videoTracker.js    # Resilient DOM video gözlemcisi
│   │   ├── osd.js             # On-Screen Display HUD rozeti
│   │   ├── keyboard.js        # Klavye kısayolları ve input kalkanı
│   │   ├── uiOverlay.js       # Scrubber bar, sürükle-bırak ve süre sayacı
│   │   ├── content.js         # Ana giriş noktası ve modül koordinatörü
│   │   └── styles.css         # Glassmorphism ve modern UI stilleri
│   └── popup/
│       ├── popup.html         # Ayar menüsü arayüzü
│       ├── popup.css          # Koyu tema popup stilleri
│       └── popup.js           # chrome.storage.sync yönetimi
└── .memory/                   # Hierarchical Agent Memory (HAM) kayıtları
    ├── decisions.md           # Mimari kararlar
    ├── patterns.md            # DOM ve kod kalıpları
    ├── roadmap.md             # Yol haritası
    └── inbox.md               # Gelecek özellik havuzu
```
