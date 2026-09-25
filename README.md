# JalurTarot Live 🔮

Aplikasi baca tarot berbasis web untuk siaran **TikTok Live** — 100% statis, tanpa AI/LLM, tanpa biaya per-ramalan.

Saat penonton mengirim gift target, bot Node.js memicu Worker → kartu ditarik otomatis → tampil di overlay OBS.

🔗 **Production:** [jalurtarotfree.muidsoft.com](https://jalurtarotfree.muidsoft.com)

---

## Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | Cloudflare Workers |
| Framework | Hono v4 |
| Language | TypeScript |
| Storage | Cloudflare KV (`RATE_LIMIT_KV`) |
| Static Assets | Cloudflare Static Assets (`./public`) |
| Bot TikTok | Node.js terpisah (`tiktok-listener/`), via `tiktok-live-connector` |
| Build/Deploy | Wrangler CLI 4.x |
| CI/CD | GitHub Actions |

---

## Fitur

- **Ramalan Live** — overlay OBS yang tampil otomatis saat gift masuk di TikTok Live
- **78 kartu Rider-Waite** lengkap dengan gambar
- **3 aspek ramalan** per kartu: Hubungan / Karir / Nasib
- **Kartu Harian** deterministik (sama untuk semua orang di hari yang sama, hash djb2)
- **Reading manual** (`/reading`) — 1 kartu atau 3 kartu, dengan tone selector
- **Tone selector** — spiritual / praktis / puitis
- **Admin Panel** (`/admin`) — dashboard, kontrol Ramalan Live, banner, IP blacklist, test draw manual
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
├── tiktok-listener/          ← Bot Node.js (jalan terpisah di Termux/VPS)
├── public/                   ← Gambar kartu (78 JPG), icons, manifest PWA
├── .github/workflows/ci.yml  ← Type check + deploy otomatis
├── wrangler.toml
└── tsconfig.json
```

---

## Cara Kerja Ramalan Live

```
Penonton kirim gift di TikTok Live
        ↓
tiktok-listener/ (Node.js, Termux/VPS)
        ↓  POST /api/live/trigger  [header: X-Live-Secret]
Cloudflare Worker
        ↓  tarik kartu → simpan ke KV live:current (TTL 6 jam)
GET /api/live/state  (di-poll tiap ~2 detik)
        ↓
/live — overlay HTML transparan → OBS Browser Source
```

Bot berjalan **terpisah** dari Worker karena `tiktok-live-connector` butuh koneksi Node.js yang persisten — tidak kompatibel dengan Cloudflare Workers runtime. TikTok tidak menyediakan API resmi untuk event live/gift, jadi bot ini memakai library reverse-engineering pihak ketiga dan hanya memanggil Worker lewat HTTP biasa.

Bot mendengar semua gift yang masuk, tapi hanya trigger draw kalau nama gift cocok dengan `TARGET_GIFT_NAME` dan jumlahnya ≥ `MIN_GIFT_COUNT`. Kalau jumlah gift ≥ `THREE_CARD_THRESHOLD`, otomatis menarik 3 kartu (Masa Lalu/Kini/Masa Depan); selain itu 1 kartu saja. Detail lengkap ada di `tiktok-listener/README.md`.

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

### 4. Jalankan bot TikTok (Termux/VPS)

```bash
cd tiktok-listener
npm install
cp .env.example .env
# edit .env — isi TIKTOK_USERNAME, WORKER_URL, LIVE_SECRET (sama dengan di Worker),
# TARGET_GIFT_NAME, MIN_GIFT_COUNT, THREE_CARD_THRESHOLD, dst.
npm start
```

Di Termux, jaga bot tetap hidup dengan `termux-wake-lock` + `tmux`/`pm2`. Lihat `tiktok-listener/README.md` untuk panduan setup Termux/VPS lengkap.

### 5. Setup OBS

Tambahkan **Browser Source** di OBS, arahkan ke:
```
https://jalurtarotfree.muidsoft.com/live
```
Background transparan, resolusi 1920×1080.

Untuk uji coba tanpa live TikTok beneran, buka `/admin/live` — ada tombol test draw manual.

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
# Cloudflare Secrets (wrangler secret put ...)
ADMIN_PASSWORD    # wajib — password untuk /admin
LIVE_SECRET       # wajib untuk fitur live — harus sama dengan di tiktok-listener/.env

# KV Namespace (sudah terkonfigurasi di wrangler.toml)
RATE_LIMIT_KV: id = "217d91b266db4ded99680b61b5b0183c"
```

Tidak ada variabel publik (`[vars]`) yang wajib — Ramalan Live 100% offline/statis, tanpa AI/LLM, tanpa API key eksternal.

---

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
GET  /admin/live        Kontrol Ramalan Live + test draw manual
POST /admin/live/test-draw  Trigger draw manual (auth cookie admin)
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

**Nav:** Side nav desktop (56px) | Bottom nav mobile (72px, fixed) — 4 item: Home / Harian / Ramalan / Kartu

---

## Known Limitations

- `tiktok-live-connector` adalah reverse-engineering pihak ketiga — bisa berhenti bekerja jika TikTok mengubah sistem internalnya.
- Bot TikTok harus tetap nyala manual selama live (gunakan `termux-wake-lock` + `tmux` di Termux, atau `pm2` di VPS).
- `live:current` hanya menyimpan 1 draw terakhir — dua gift yang masuk hampir bersamaan hanya menampilkan yang paling baru.
- Overlay polling tiap ~2 detik — ada delay ±2 detik antara trigger dan tampil di layar.
- Bundle size — `cards.ts` + `enrichedMeanings.ts` + `liveAspectMeanings.ts` cukup besar, pantau jika mendekati limit 1MB Workers free tier.
- `routes/agent.ts` dan `lib/config.ts` (legacy dari versi Oracle berbasis AI) masih ada di kode tapi tidak lagi terhubung ke fitur aktif — aman diabaikan.

---

## Lisensi

Private / internal project — tidak ada lisensi open-source publik saat ini.
