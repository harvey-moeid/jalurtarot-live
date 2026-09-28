# JalurTarot Live

Aplikasi baca tarot berbasis web untuk siaran **TikTok Live** - 100% statis, tanpa AI/LLM, tanpa biaya per-ramalan.

Saat penonton mengirim gift atau like mencapai milestone, bot Node.js memicu Worker -> kartu ditarik otomatis -> tampil di overlay OBS.

**Production:** [livejalur.muidsoft.com](https://livejalur.muidsoft.com/)

> Jaga file dokumentasi ini tetap ASCII (tanpa emoji, tanda pisah panjang, atau
> karakter box-drawing) supaya tidak rusak lagi. Lihat `PROJECT_CONTEXT.md`.

---

## Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | Cloudflare Workers |
| Framework | Hono v4 |
| Language | TypeScript |
| Storage | Cloudflare KV (`RATE_LIMIT_KV`) |
| Static Assets | Cloudflare Static Assets (`./public`) |
| Bot TikTok | Node.js terpisah (`tiktok-listener/`), Euler Stream managed WebSocket (`@eulerstream/euler-websocket-sdk`, `ws`, `dotenv`) |
| Hosting bot | Termux (HP), Render.com (Background Worker), atau VPS |
| Build/Deploy | Wrangler CLI 4.x |
| CI/CD | GitHub Actions |

---

## Fitur

- **Ramalan Live** - overlay OBS layar penuh yang tampil otomatis saat gift masuk atau like mencapai milestone
- **78 kartu Rider-Waite** lengkap dengan gambar
- **3 aspek ramalan** per kartu: Hubungan / Karir / Nasib
- **Kartu Harian** deterministik (sama untuk semua orang di hari yang sama, hash djb2)
- **Reading manual** (`/reading`) - 1 kartu atau 3 kartu, dengan tone selector
- **Tone selector** - spiritual / praktis / puitis
- **Admin Panel** (`/admin`) - dashboard, kontrol Ramalan Live, nyalakan/stop listener di Render, banner, IP blacklist, test draw manual
- **PWA** - bisa diinstall di HP (manifest + icons)
- **Fisher-Yates shuffle** - pengundian kartu uniform, bukan `Math.random()` naif
- Semua ramalan gratis, tanpa limit, tanpa AI/LLM eksternal

---

## Struktur

```
jalurtarot-live/
  src/
    index.ts                   - Entry point & routing
    middleware/
      adminAuth.ts             - Auth & sesi admin, rate limit login
    routes/
      home.ts                  - GET /
      daily.ts                 - GET /daily
      reading.ts               - GET /reading (single & three-card)
      library.ts               - GET /library
      history.ts               - GET /history
      support.ts               - GET /support
      live.ts                  - GET /live, /api/live/*
      admin.ts                 - /admin/*
      api.ts                   - /api/interpret, /api/config, dst
      agent.ts                 - legacy, tidak terdaftar di index.ts
    lib/
      types.ts                 - TypeScript interfaces
      cards.ts                 - 78 kartu Rider-Waite-Smith
      spreads.ts               - 6 definisi spread (hanya 2 dipakai di UI)
      interpret.ts             - Static interpretation engine (tone-aware)
      enrichedMeanings.ts      - Makna kartu untuk /reading & /daily
      liveAspectMeanings.ts    - Makna Hubungan/Karir/Nasib untuk Ramalan Live
      live.ts                  - generateLiveDraw(), saveLiveDraw(), getLiveDraw()
      daily.ts                 - Kartu harian (djb2 hash deterministik)
      draw.ts                  - Fisher-Yates shuffle
      layout.ts                - HTML shell + CSS design system
      markdown.ts              - markdownToHtml()
      icons.ts                 - SVG icons
      config.ts                - Legacy LLM config helper (tidak dipakai fitur aktif)
  tiktok-listener/             - Bot Node.js (jalan terpisah di Termux/Render/VPS)
    index.js                   - Listener Euler WebSocket: gift/like -> POST /api/live/trigger
    logic.js, queue.js         - Parsing event gift & antrean draw
    render.yaml                - Render Blueprint (Background Worker)
    test/                      - Test logic.js dan queue.js
  public/                      - Gambar kartu (78 JPG), icons, manifest & service worker PWA
  test/                        - Test regresi Worker
  .github/workflows/ci.yml     - Type check + test + deploy otomatis
  wrangler.toml
  tsconfig.json
```

---

## Cara Kerja Ramalan Live

```
Penonton kirim gift / like di TikTok Live
        |
        v
Euler Stream (managed WebSocket, pihak ketiga)
        |  WebcastGiftMessage / WebcastLikeMessage
        v
tiktok-listener/index.js (Node.js: Termux / Render / VPS)
        |  POST /api/live/trigger  [header: X-Live-Secret]
        v
Cloudflare Worker
        |  tarik kartu -> simpan ke KV live:current (TTL 6 jam)
        v
GET /api/live/state  (di-poll overlay tiap ~1 detik)
        |
        v
/live -> overlay HTML layar penuh -> OBS Browser Source / perangkat
```

Bot berjalan **terpisah** dari Worker karena koneksi WebSocket ke Euler Stream harus persisten - tidak kompatibel dengan model request/response Cloudflare Workers. TikTok tidak menyediakan API resmi untuk event live/gift, jadi bot memakai layanan pihak ketiga (Euler Stream) dan hanya memanggil Worker lewat HTTP biasa.

**Pemicu di listener:**

- **Gift** - jika `TARGET_GIFT_NAME` diisi (bukan kosong / `*`), hanya gift dengan nama itu yang diproses. Total koin (nilai koin per gift x jumlah) harus >= `MIN_GIFT_VALUE`. Kalau total koin >= `THREE_CARD_MIN_VALUE`, ditarik 3 kartu (Masa Lalu/Kini/Masa Depan); selain itu memakai `DEFAULT_SPREAD` (default 1 kartu). Gift streak hanya diproses pada update terakhir.
- **Like milestone** - setiap `LIKE_MILESTONE` like (default 40) memicu 1 draw dengan label "N Like". Event like pertama tiap koneksi hanya jadi baseline, supaya reconnect tidak memicu draw palsu.
- Semua draw (gift maupun like) lewat satu antrean supaya tidak saling menimpa saat masuk bersamaan.

Detail lengkap ada di `tiktok-listener/README.md`.

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
      "nameCn": "...",
      "image": "/cards/...",
      "isReversed": false,
      "positionNameCn": "...",
      "keywords": ["..."],
      "aspect": { "hubungan": "...", "karir": "...", "nasib": "..." }
    }
  ],
  "summary": "Ramalan untuk @penonton\n\n**...**"
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

Opsional, hanya bila ingin mengontrol listener Render dari `/admin/live`:

```bash
wrangler secret put RENDER_API_KEY
# opsional: RENDER_LISTENER_SERVICE_ID atau RENDER_LISTENER_SERVICE_NAME
# (default nama service: jalurtarot-tiktok-listener)
```

Untuk dev lokal, buat file `.dev.vars` (lihat `.dev.vars.example`):

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars, isi ADMIN_PASSWORD dan LIVE_SECRET
```

### 3. Jalankan lokal / Deploy Worker

```bash
npm run dev            # wrangler dev, jalan di http://localhost:8787
npm run build          # tsc --noEmit (type check)
npm test               # test regresi Worker
npm run deploy         # wrangler deploy
wrangler tail          # pantau logs production
```

### 4. Jalankan bot TikTok (Termux / Render / VPS)

```bash
cd tiktok-listener
npm install
cp .env.example .env
# edit .env - isi TIKTOK_USERNAME, WORKER_URL, LIVE_SECRET (sama dengan di Worker),
# EULER_API_KEY, lalu atur TARGET_GIFT_NAME, MIN_GIFT_VALUE, THREE_CARD_MIN_VALUE,
# LIKE_MILESTONE, dst.
npm start
```

Variabel listener:

| Variabel | Default | Keterangan |
|----------|---------|-----------|
| `TIKTOK_USERNAME` | - (wajib) | Akun TikTok target |
| `WORKER_URL` | - (wajib) | Mis. `https://livejalur.muidsoft.com` |
| `LIVE_SECRET` | - (wajib) | Harus sama dengan secret di Worker |
| `EULER_API_KEY` | kosong | API key Euler Stream (`SIGN_API_KEY` masih diterima sebagai alias) |
| `TARGET_GIFT_NAME` | semua gift | Nama gift pemicu; kosong atau `*` = semua |
| `MIN_GIFT_VALUE` | `1` | Total koin minimum agar gift memicu draw |
| `THREE_CARD_MIN_VALUE` | `5` | Total koin minimum untuk spread 3 kartu |
| `DEFAULT_SPREAD` | `single` | `single` atau `three-card` |
| `LIKE_MILESTONE` | `40` | Setiap N like memicu draw; kosong = nonaktif |
| `DEBUG_EVENTS` | nonaktif | `1` = log semua event mentah |

Panduan lengkap: `tiktok-listener/TERMUX-SETUP.md` (Termux) dan `tiktok-listener/RENDER-SETUP.md` (Render.com). Jalankan hanya satu listener aktif per akun TikTok (jangan Termux dan Render bersamaan).

### 5. Setup OBS

Tambahkan **Browser Source** di OBS, arahkan ke:
```
https://livejalur.muidsoft.com/live
```
Overlay berupa halaman layar penuh (portrait maupun landscape) dengan latar gelap, bukan latar transparan. Resolusi yang umum dipakai: 1920x1080.

Untuk uji coba tanpa live TikTok beneran, buka `/admin/live` - ada tombol test draw manual.

---

## CI / CD

| Event | Yang terjadi |
|-------|-------------|
| Push ke branch apa pun / Pull Request | Type check (`tsc --noEmit`), test regresi Worker (`npm test`), test logika listener (`node --test`) |
| Push ke `master` | Type check lolos -> deploy ke Cloudflare Workers (`wrangler deploy --minify --keep-vars`) |

CI hanya men-deploy Worker. Listener (Render / Termux) harus di-redeploy atau di-restart manual.

### Secrets yang diperlukan di GitHub

Buka **Settings -> Secrets and variables -> Actions**, tambahkan:

| Secret | Isi |
|--------|-----|
| `CLOUDFLARE_API_TOKEN` | API Token CF dengan permission `Workers Scripts: Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID dari Cloudflare dashboard |

Dependency di-update otomatis lewat `.github/dependabot.yml`.

---

## Environment Variables (Worker)

```toml
# Cloudflare Secrets (wrangler secret put ...)
ADMIN_PASSWORD               # wajib - password untuk /admin
LIVE_SECRET                  # wajib untuk fitur live - harus sama dengan di listener
RENDER_API_KEY               # opsional - kontrol listener Render dari /admin/live
RENDER_LISTENER_SERVICE_ID   # opsional
RENDER_LISTENER_SERVICE_NAME # opsional, default: jalurtarot-tiktok-listener

# KV Namespace (sudah terkonfigurasi di wrangler.toml)
RATE_LIMIT_KV: id = "2545355c3b6e4012a1bddf0c66c181a0"
```

Tidak ada variabel publik (`[vars]`) yang wajib - Ramalan Live 100% offline/statis, tanpa AI/LLM.

---

## Storage - KV Keys

| Data | TTL | Key Pattern |
|------|-----|-------------|
| Draw Ramalan Live terkini | 6 jam (tapi `/api/live/state` hanya menyajikan draw yang cukup baru) | `live:current` |
| IP Blacklist | permanen | `blacklist:{IP}` |
| Banner aktif | 30 hari | `banner:active` |
| Riwayat Ramalan (browser) | - | `localStorage: jalurtarot-readings-v1` (max 50) |
| Catatan harian (browser) | - | `localStorage: jalurtarot-daily-note-{dateKey}` |

---

## Routes

```
GET  /                  Halaman utama
GET  /daily             Kartu harian
GET  /reading           Baca tarot (1 atau 3 kartu)
GET  /library           Referensi 78 kartu
GET  /history           Riwayat ramalan (localStorage)
GET  /support           Halaman support / QRIS
GET  /live              Overlay OBS layar penuh (auto-polling)

POST /api/live/trigger  Trigger draw dari bot TikTok (wajib header X-Live-Secret)
GET  /api/live/state    Status draw terkini (di-poll oleh /live)
POST /api/interpret     Interpretasi statis (SSE)
GET  /api/daily-card    Data kartu harian
GET  /api/config        Status statis
GET  /api/banner        Banner aktif dari KV (publik)

GET  /admin             Dashboard admin
GET  /admin/login       Login admin
POST /admin/login       Auth + set cookie
POST /admin/logout      Clear cookie
GET  /admin/live        Kontrol Ramalan Live + listener Render + test draw manual
POST /admin/live/render/start  Nyalakan listener di Render (resume service)
POST /admin/live/render/stop   Stop listener di Render (suspend service)
POST /admin/live/test-draw     Trigger draw manual (auth cookie admin)
GET  /admin/banner      Kelola banner
POST /admin/banner/set  Simpan banner ke KV
POST /admin/banner/deactivate  Hapus banner dari KV
GET  /admin/blacklist   Kelola IP blacklist
POST /admin/blacklist/add     Blacklist IP
POST /admin/blacklist/remove  Unblock IP
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

**Nav:** Side nav desktop (56px) | Bottom nav mobile (72px, fixed) - 4 item: Home / Harian / Ramalan / Kartu

---

## Known Limitations

- Euler Stream adalah layanan pihak ketiga, bukan API resmi TikTok - ketersediaan, batas koneksi (close code 4429), dan skema event mengikuti Euler dan bisa berubah kapan saja.
- Listener di Termux harus tetap nyala manual selama live (`termux-wake-lock` + `tmux`). Bisa dihindari dengan Render.com (Background Worker always-on), tapi berbayar.
- `live:current` hanya menyimpan 1 draw terakhir - dua draw yang masuk hampir bersamaan hanya menampilkan yang paling baru. Dengan `LIKE_MILESTONE` kecil (mis. 40), draw like bisa sering menggantikan tampilan sebelumnya.
- Overlay memakai polling (bukan WebSocket) - ada delay sekitar 1 detik antara trigger dan tampil di layar.
- Nama field gift streak (`giftType`, `repeatEnd`) dan nilai koin belum terverifikasi penuh ke skema Euler; cek dengan `DEBUG_EVENTS=1` saat ada gift.
- Bundle size - `cards.ts` + `enrichedMeanings.ts` + `liveAspectMeanings.ts` cukup besar, pantau jika mendekati limit 1MB Workers free tier.
- `routes/agent.ts` dan `lib/config.ts` (legacy dari versi Oracle berbasis AI) masih ada di kode tapi tidak lagi terhubung ke fitur aktif - aman diabaikan.

---

## Lisensi

Private / internal project - tidak ada lisensi open-source publik saat ini.
