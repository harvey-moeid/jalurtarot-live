# JalurTarot Live 🔮

Aplikasi baca tarot berbasis web untuk siaran **TikTok Live** — 100% statis, tanpa AI/LLM, tanpa biaya per-ramalan.

Saat penonton mengirim gift target, **tiktok-live-konektor** mengirim event ke Worker → kartu ditarik otomatis → tampil di overlay OBS. API key konektor tetap server-side dan tidak ditanam di JavaScript publik.

🔗 **Production:** [livejalur.muidsoft.com](https://livejalur.muidsoft.com)

---

> **Arsitektur aktif (Oktober 2026):** `tiktok-live-konektor` adalah satu-satunya sumber event TikTok. Cloudflare Worker menerima webhook gift/like, memproses setelan melalui KV, dan melayani `/live` serta `/live2`. `tiktok-listener/render.yaml` dihapus karena Blueprint listener lama tidak dipakai. Menghapus file tidak menghentikan service Render yang sudah dibuat; service lama harus dihentikan/dihapus terpisah di dashboard Render. Jangan menghapus service `tiktok-live-konektor`.

## Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | Cloudflare Workers |
| Framework | Hono v4 |
| Language | TypeScript |
| Storage | Cloudflare KV (`RATE_LIMIT_KV`) |
| Static Assets | Cloudflare Static Assets (`./public`) |
| TikTok Realtime | API bersama dari repo `tiktok-live-konektor` (REST + webhook) |
| Build/Deploy | Wrangler CLI 4.x |
| CI/CD | GitHub Actions |

---

## Fitur

- **Ramalan Live** — overlay OBS otomatis saat gift atau milestone like TikTok LIVE terpenuhi
- **78 kartu Rider-Waite** lengkap dengan gambar
- **3 aspek ramalan** per kartu: Hubungan / Karir / Nasib
- **Kartu Harian** deterministik (sama untuk semua orang di hari yang sama, hash djb2)
- **Reading manual** (`/reading`) — 1 kartu atau 3 kartu, dengan tone selector
- **Tone selector** — spiritual / praktis / puitis
- **Admin Panel** (`/admin/live`) — status konektor, konfigurasi gift dan like, banner situs, test draw manual (tanpa halaman blacklist LLM lama)
- **PWA** — bisa diinstall di HP (manifest + icons)
- **Fisher-Yates shuffle** — pengundian kartu uniform, bukan `Math.random()` naif
- Semua ramalan gratis, tanpa limit, tanpa AI/LLM eksternal

---

## Struktur

```
├── src/
│   ├── index.ts              ← Entry point & routing
│   ├── routes/
│   │   ├── home.ts           ← GET /
│   │   ├── daily.ts          ← GET /daily
│   │   ├── reading.ts        ← GET /reading (single & three-card)
│   │   ├── library.ts        ← GET /library
│   │   ├── history.ts        ← GET /history
│   │   ├── support.ts        ← GET /support
│   │   ├── live.ts           ← GET /live, /api/live/*
│   │   ├── admin.ts          ← /admin/*
│   │   ├── api.ts            ← /api/interpret, /api/config, dst
│   │   └── agent.ts          ← legacy, tidak terdaftar di index.ts
│   └── lib/
│       ├── types.ts              ← TypeScript interfaces
│       ├── cards.ts               ← 78 kartu Rider-Waite-Smith
│       ├── spreads.ts             ← 6 definisi spread (hanya 2 dipakai di UI)
│       ├── interpret.ts           ← Static interpretation engine (tone-aware)
│       ├── enrichedMeanings.ts    ← Makna kartu untuk /reading & /daily
│       ├── liveAspectMeanings.ts  ← Makna Hubungan/Karir/Nasib untuk Ramalan Live
│       ├── live.ts                ← generateLiveDraw(), saveLiveDraw(), getLiveDraw()
│       ├── daily.ts               ← Kartu harian (djb2 hash deterministik)
│       ├── draw.ts                ← Fisher-Yates shuffle
│       ├── layout.ts              ← HTML shell + CSS design system
│       ├── markdown.ts            ← markdownToHtml()
│       ├── icons.ts               ← SVG icons
│       └── config.ts              ← Legacy LLM config helper (untuk /admin/health)
├── tiktok-listener/          ← Arsip kode listener lama (tidak dijalankan/deploy)
├── public/                   ← Gambar kartu (78 JPG), icons, manifest PWA
├── .github/workflows/ci.yml  ← Type check + deploy otomatis
├── wrangler.toml
└── tsconfig.json
```

---

## Cara Kerja Ramalan Live

```
TikTok LIVE @jalurtarot
        ↓
tiktok-live-konektor (Render)
        ├─ REST /api/v1/status, /stats, /events
        └─ webhook gift + like realtime
                ↓
Cloudflare Worker jalurtarot-live
        ↓  pengaturan KV, filter gift/like + dedupe + pilih spread
tarik kartu → simpan KV live:current
        ↓
GET /api/live/state
        ↓
/live — overlay HTML transparan → OBS Browser Source
```

### Skema data `live:current` (KV)

```json
{
  "id": "1735000000000-ab12cd",
  "createdAt": 1735000000000,
  "spreadId": "single",
  "spreadNameCn": "Kartu Tunggal",
  "username": "@penonton",
  "giftName": "Rose",
  "giftCount": 3,
  "cards": [
    {
      "id": "major-00",
      "name": "The Fool",
      "image": "/cards/...",
      "isReversed": false,
      "keywords": ["..."],
      "aspect": { "hubungan": "...", "karir": "...", "nasib": "..." }
    }
  ],
  "summary": "… Ramalan untuk @penonton\n\n**...**"
}
```

---

## Setup & Deploy

### 1. Clone & install

```bash
git clone https://github.com/harvey-moeid/jalurtarot-live.git
cd jalurtarot-live
npm install
```

### 2. Setup secrets

```bash
wrangler secret put ADMIN_PASSWORD   # password untuk /admin
wrangler secret put LIVE_SECRET      # token untuk bot TikTok (buat acak, mis. openssl rand -hex 24)
```

Untuk dev lokal, buat file `.dev.vars` (lihat `.dev.vars.example`):

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars, isi ADMIN_PASSWORD dan LIVE_SECRET
```

### 3. Jalankan lokal / Deploy Worker

```bash
npm run dev            # wrangler dev, jalan di http://localhost:8787
npm run build           # tsc --noEmit (type check)
npm run deploy          # wrangler deploy
wrangler tail           # pantau logs production
```

### 4. Sambungkan tiktok-live-konektor

Set secret Worker:

```bash
wrangler secret put TIKTOK_CONNECTOR_API_KEY
wrangler secret put TIKTOK_CONNECTOR_WEBHOOK_SECRET
```

`TIKTOK_CONNECTOR_API_KEY` harus sama dengan `API_KEY` pada service `tiktok-live-konektor`.

Di dashboard `tiktok-live-konektor`, daftarkan webhook event **`gift` dan `like`** ke:

```text
https://DOMAIN-JALURTAROT/api/live/connector-webhook?secret=WEBHOOK_SECRET
```

Webhook adalah jalur realtime utama. Overlay memiliki fallback polling event gift dan like dari REST API service **yang sama**, `tiktok-live-konektor` (best-effort, tidak menjamin semua event). `tiktok-listener/` hanya arsip historis, jangan deploy atau hidupkan listener kedua.

### Pengaturan gift dan like tanpa redeploy

Buka `/admin/live` setelah login. Pengaturan disimpan di Cloudflare KV dengan key
`live:automation:settings:v1`; ketika belum ada data, default mengikuti `wrangler.toml`
untuk gift (aktif, semua gift, minimal 1 koin, 3 kartu mulai 5 koin) dan like aktif
setiap 40 like (1 kartu). Perubahan tidak mengubah variabel `wrangler.toml` dan
mungkin membutuhkan waktu singkat untuk propagasi antar lokasi Cloudflare.

- Gift: toggle aktif/nonaktif, nama gift atau `*`, ambang nilai koin, ambang
  tiga kartu, dan pilihan spread default.
- Like: toggle aktif/nonaktif, setiap N like pada satu room, dan 1/3 kartu.
  Preferensi counter memakai `totalLikeCount` jika tersedia; selain itu, menjumlah
  `likeCount` dari event yang masuk. Event dengan ID sama dicegah diproses ulang
  secara best-effort; lonjakan melewati beberapa milestone memicu maksimal satu draw
  per event. KV **tidak menyediakan increment atomik**; untuk live sangat ramai,
  gunakan Durable Objects agar tidak terjadi race penghitungan.
- Pada konektor Render, webhook harus dikonfigurasi untuk kedua event `gift` dan `like`.
  REST polling tersedia sebagai fallback, bukan pengganti webhook yang andal.
- API feed `/api/live/connector/{status,stats,events}` hanya dapat diakses
  dengan sesi login admin; jangan mengirim `TIKTOK_CONNECTOR_API_KEY` ke browser.
- Untuk kompatibilitas, `/admin` mengarah ke `/admin/live`. Halaman blacklist
  dihapus karena tidak pernah dipakai untuk menolak request publik maupun ramalan statis;
  Banner dipertahankan karena `/api/banner` dibaca oleh homepage.


### Karakter utama LIVE 2 (9 Oktober 2026)

- Default memakai ilustrasi karakter bergaya 3D hasil desain khusus Jalur Tarot, disimpan sebagai WebP transparan `public/models/jalur-tarot-host.webp`. Fokus pada wajah, ekspresi, aksesori bulan, dan kartu tarot seperti mockup yang disetujui.
- Tampilan host memiliki idle floating/tilt serta respons halus ketika gift/like memicu pembacaan; `prefers-reduced-motion` dihormati. Ini animasi ilustrasi 2.5D, **bukan rig 3D/lip-sync**.
- Model GLB asli tidak dihapus dan hanya diaktifkan dengan `/live2?character=glb&debug=1` untuk diagnosis. Mode default menghindari masalah tekstur putih/WebGL di OBS dan ponsel.
- LIVE 1, API state, pengaturan gift/like, dan webhook tetap tidak berubah. Untuk uji visual buka `/live2?demo=1&background=1`, refresh OBS Browser Source setelah deploy.

### LIVE 2 — overlay portrait 3D bergerak

URL OBS Browser Source baru (LIVE 1 tetap di `/live`):

- **Production setelah merge + deploy:** `https://livejalur.muidsoft.com/live2`
- **Preview tanpa TikTok:** `https://livejalur.muidsoft.com/live2?demo=1&background=1`
- **Background opaque (opsional):** `/live2?background=1`; default transparan untuk OBS.
- **Aktifkan voice bahasa Indonesia (opsional):** `/live2?voice=1`. Suara menggunakan `speechSynthesis` di browser dan **tidak dijamin** tersedia/terputar otomatis di semua OBS Browser Source; gunakan opsi enable audio dan cek perangkat OBS. Bubble teks tetap tampil bila suara tidak tersedia.

Pengaturan OBS yang disarankan: **width 1080, height 1920** (9:16), browser source refresh on scene activation bila diperlukan, dan browser source audio dikontrol OBS bila memakai `voice=1`.

LIVE 2 menggunakan endpoint **GET /api/live/state** dan konfigurasi gift/like yang **sama** dengan LIVE 1. Tiap draw terbaru memunculkan 1–3 kartu aktual, user, dan ringkasan dari data `aspect.nasib` selama 45 detik. Karakter bernama **Jalur Tarot** (sebelumnya Luna Tarot) kini dimuat dari **model GLB lokal** (`public/models/jalur-tarot.glb`) melalui **Three.js + GLTFLoader** yang disimpan lokal (`public/vendor/`); tidak menggunakan CDN runtime. Model bergaya stylized/chibi 3D, **bukan** karakter realistis hasil sculpt/rig Blender. Mata berkedip, kepala dan tangan bergerak, mulut bereaksi ketika teks dibacakan, dan bagian depan kartu yang dipegang memuat gambar kartu hasil draw. Renderer dibatasi ~30 FPS, memiliki fallback ketika WebGL/model gagal, serta mematuhi reduce motion.

### LIVE 2 — layout portrait yang diperbarui

Tampilan /live2 disusun dalam **empat zona terpisah**: judul di atas, karakter Luna + bubble di tengah atas, hasil 1–3 kartu di tengah bawah, dan ticker + ajakan gift di paling bawah. Bubble menampilkan cuplikan singkat agar tidak menutupi wajah; interpretasi lebih panjang tetap ditampilkan pada panel kartu. Nama penonton panjang dan judul kartu terpotong secara visual agar tidak mendorong elemen keluar layar.

- Target utama OBS **1080 × 1920**, dengan penyesuaian untuk browser portrait HP, viewport pendek, dan preview landscape.
- Kartu tidak lagi berbagi area dengan notifikasi viewer; panel hasil memakai grid yang menyediakan tinggi tersendiri untuk interpretasi.
- Efek animasi dipertahankan, tetapi dinonaktifkan untuk pengguna dengan preferensi reduced motion. Fallback tanpa WebGL tetap tersedia.
- Mode default **transparan** untuk OBS; gunakan `?background=1` saat membuka overlay langsung di browser.
- Jalankan `npm test` untuk regression test yang memastikan batas area host/bubble, kartu, ticker, dan responsivitas tidak tertimpa lagi.
- Data gift/like, polling dan webhook tetap menggunakan backend yang sama dengan LIVE 1.

Keamanan: tidak perlu API key di browser, tidak ada parameter trigger publik baru, nama user dan pesan dipasang melalui `textContent`, dan path gambar kartu dibatasi ke `/cards/*.jpg`. Gunakan tombol test draw pada `/admin/live` untuk menguji dengan hasil aktual.

#### Pemeliharaan LIVE 2

- Script `public/live2.js` menangani event tarot dan renderer; `public/live2.css` mengatur layout portrait untuk layar browser dan OBS.
- Aset Three.js **r146** dan `GLTFLoader` dibundel sebagai file statis yang dipin versi, dengan lisensi `public/vendor/THREE-LICENSE.txt`. Browser memuatnya dari origin situs sendiri, sesuai CSP.
- Model 3D baru **opsional**: unggah file `public/models/jalur-tarot-custom.glb` ke branch PR ini (GitHub → Add file → Upload files), kemudian commit. `public/live2.js` otomatis memilihnya dan melakukan auto-scaling/centering berdasarkan bounding box; tidak perlu nama node tertentu.
- Untuk unggahan GLB unrigged/static, gerakan host memakai idle body motion dan kartu tarot terpisah di depan badan, dengan gambar kartu terbaru terpasang otomatis. Gerakan bibir atau tangan mengikuti tulang hanya tersedia jika aset punya node rig yang sesuai.
- Bila file custom belum ada, rusak, atau gagal dimuat, browser otomatis memakai model lama `public/models/jalur-tarot.glb`. Tidak ada perubahan pada webhook, pengaturan gift/like, atau overlay LIVE 1.
- Rekomendasi aset: gunakan GLB hasil optimasi (2–5 MB) agar OBS/mobile lebih ringan; model asli hasil scan 28 MB bisa menyebabkan initial loading lambat. Asset baru belum aktif sampai GLB diunggah ke path tersebut.
- Pengujian termasuk validasi struktur GLB. Demo `/live2?demo=1&background=1` tidak mengirim event TikTok dan tidak mengubah KV.
- Jika font, WebGL, atau gambar tarot bermasalah, sistem menampilkan fallback; gift dan webhook di Worker tidak diubah oleh pembaruan tampilan.
- Setelah PR di-merge ke `master` dan CI deploy berhasil, refresh source Browser OBS untuk mengambil aset baru.
- Loader pemulihan: jika GLTFLoader utama gagal mengurai model GLB baru, browser mencoba ulang memakai decoder mesh glTF 2.0 sederhana yang membaca geometry dan tekstur warna langsung. Model lama hanya dipakai jika kedua cara gagal. Decoder sederhana mendukung mesh standar non-Draco, atribut posisi/normal/UV serta tekstur baseColor tersemat (tidak menangani semua varian glTF). Error asli dan error pemulihan tetap terbaca di `?debug=1`.
- Jika setelah unggah `public/models/jalur-tarot-custom.glb` karakter LIVE 2 masih lama, buka `/live2?demo=1&background=1&debug=1`. Label 3D `CUSTOM` menunjukkan GLB berhasil, `LOADING` saat mengunduh, `FALLBACK` saat gagal sehingga memakai karakter bawaan, dan `UNAVAILABLE` ketika WebGL/library tidak tersedia. Lihat peringatan console untuk penyebab teknis. Label ini **hanya** tampil dengan `debug=1`.
- Asset LIVE 2 menggunakan cache-busting (`?v=...`) di JS/CSS/model GLB dan route `/live2` mengirim `Cache-Control: no-store` agar upload model tidak tertahan 404 atau script lama pada browser/OBS.

### 5. Setup OBS

Tambahkan **Browser Source** di OBS, arahkan ke:
```
https://livejalur.muidsoft.com/live
```
Background transparan, resolusi 1920×1080.

Untuk uji coba tanpa live TikTok beneran, buka `/admin/live` — ada tombol test draw manual dan pengaturan gift/like.

---

## CI / CD

| Event | Yang terjadi |
|-------|-------------|
| Push ke branch apa pun / Pull Request | TypeScript type check (`tsc --noEmit`), Node.js 22 |
| Push ke `master` | Type check → deploy ke Cloudflare Workers (`wrangler deploy --minify`), jika lulus |

### Secrets yang diperlukan di GitHub

Buka **Settings → Secrets and variables → Actions**, tambahkan:

| Secret | Isi |
|--------|-----|
| `CLOUDFLARE_API_TOKEN` | API Token CF dengan permission `Workers Scripts: Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID dari Cloudflare dashboard |

Dependency di-update otomatis lewat `.github/dependabot.yml`.

---

## Environment Variables

```toml
# Secret Cloudflare
ADMIN_PASSWORD
TIKTOK_CONNECTOR_API_KEY
TIKTOK_CONNECTOR_WEBHOOK_SECRET

# Legacy trigger dinonaktifkan secara operasional; tidak dibutuhkan untuk integrasi connector.
LIVE_SECRET

# Vars di wrangler.toml
TIKTOK_CONNECTOR_URL = "https://tiktok-live-konektor.onrender.com"
LIVE_TARGET_GIFT_NAME = "*"
LIVE_MIN_GIFT_VALUE = "1"
LIVE_THREE_CARD_MIN_VALUE = "5"
LIVE_DEFAULT_SPREAD = "single"

# KV
RATE_LIMIT_KV
```

### API consumer yang tersedia

```text
GET  /api/live/connector/status
GET  /api/live/connector/stats
GET  /api/live/connector/events?type=chat,like,gift&limit=50
POST /api/live/connector-webhook?secret=...
```

Ketiga endpoint GET memanggil `tiktok-live-konektor` dari Worker dengan bearer API key dan membutuhkan sesi admin. Credential tidak pernah dikirim ke browser.

## Storage — KV Keys

| Data | TTL | Key Pattern |
|------|-----|-------------|
| Draw Ramalan Live terkini | 6 jam | `live:current` |
| IP Blacklist | permanen | `blacklist:{IP}` |
| Banner aktif | 30 hari | `banner:active` |
| Riwayat Ramalan (browser) | — | `localStorage: jalurtarot-readings-v1` (max 50) |
| Catatan harian (browser) | — | `localStorage: jalurtarot-daily-note-{dateKey}` |

---

## Routes

```
GET  /                  Halaman utama
GET  /daily             Kartu harian
GET  /reading           Baca tarot (1 atau 3 kartu)
GET  /library           Referensi 78 kartu
GET  /history           Riwayat ramalan (localStorage)
GET  /support           Halaman support / QRIS
GET  /live              Overlay OBS (transparan, auto-polling)

POST /api/live/trigger  Endpoint kompatibilitas lama (deprecated, jangan digunakan)
GET  /api/live/state    Status draw terkini (di-poll oleh /live)
POST /api/interpret     Interpretasi statis (SSE)
GET  /api/daily-card    Data kartu harian
GET  /api/config        Status statis
GET  /api/banner        Banner aktif dari KV (publik)

GET  /admin             Redirect ke /admin/live
GET  /admin/login       Login admin
POST /admin/login       Auth + set cookie
POST /admin/logout      Clear cookie
GET  /admin/live        Status TikTok, pengaturan gift/like + test draw manual
POST /admin/live/settings   Simpan pengaturan gift/like (sesi admin, same-origin)
POST /admin/live/test-draw  Trigger draw manual (auth cookie admin)
GET  /admin/banner      Kelola banner
POST /admin/banner/set  Simpan banner ke KV
POST /admin/banner/deactivate  Hapus banner dari KV
```

---

## Tone System

Tiga gaya interpretasi untuk `/reading` & `/daily` (Ramalan Live selalu memakai gaya singkat dari `liveAspectMeanings.ts`):

| Tone | Karakter |
|------|---------|
| `spiritual` | Arketipe Jungian, simbolisme dalam, refleksi batin |
| `praktis` | Tindakan konkret, keputusan nyata, langkah terukur |
| `puitis` | Bahasa metaforis, paradoks, imaji yang tajam |

---

## Design System

**Fonts:** Cinzel Decorative (display), Cinzel (heading), Cormorant Garamond (body), Marcellus (UI)

**Colors:**
```css
--ink-void: #050507    /* background */
--gold: #c8a84b        /* accent utama */
--gold-dim: #7a6128    /* accent redup */
--bone: #ede8de        /* teks utama */
--mist: #5c6e90        /* teks sekunder */
```

**FX:** Film grain, vignette, star canvas, cursor candle glow

**Nav:** Side nav desktop (56px) | Bottom nav mobile (72px, fixed) — 4 item: Home / Harian / Ramalan / Kartu

---

## Known Limitations

- `tiktok-live-connector` adalah reverse-engineering pihak ketiga — bisa berhenti bekerja jika TikTok mengubah sistem internalnya.
- Service `tiktok-live-konektor` harus dalam status Connected saat live. Autostart tidak diwajibkan; START/STOP tetap dikontrol dari dashboard konektor.
- `live:current` hanya menyimpan 1 draw terakhir — event gift/like yang masuk hampir bersamaan hanya menampilkan yang paling baru.
- Milestone like dihitung best-effort menggunakan KV; dalam traffic tinggi, penambahan bersamaan bisa menyebabkan hitungan tidak tepat.
- Overlay polling tiap ~2 detik — ada delay ±2 detik antara trigger dan tampil di layar.
- Bundle size — `cards.ts` + `enrichedMeanings.ts` + `liveAspectMeanings.ts` cukup besar, pantau jika mendekati limit 1MB Workers free tier.
- `routes/agent.ts` dan `lib/config.ts` (legacy dari versi Oracle berbasis AI) masih ada di kode tapi tidak lagi terhubung ke fitur aktif — aman diabaikan.

---

## Lisensi

Private / internal project — tidak ada lisensi open-source publik saat ini.
