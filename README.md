# JalurTarot Live 🔮

Aplikasi baca tarot berbasis web untuk siaran **TikTok Live** — 100% statis, tanpa AI/LLM, tanpa biaya per-ramalan.

Saat penonton mengirim gift target, **tiktok-live-konektor** mengirim event ke Worker → kartu ditarik otomatis → tampil di overlay OBS. API key konektor tetap server-side dan tidak ditanam di JavaScript publik.

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
| TikTok Realtime | API bersama dari repo `tiktok-live-konektor` (REST + webhook) |
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
TikTok LIVE @jalurtarot
        ↓
tiktok-live-konektor (Render)
        ├─ REST /api/v1/status, /stats, /events
        └─ webhook gift realtime
                ↓
Cloudflare Worker jalurtarot-live
        ↓  filter gift + dedupe + pilih spread
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

Di dashboard `tiktok-live-konektor`, tambahkan webhook event `gift` ke:

```text
https://DOMAIN-JALURTAROT/api/live/connector-webhook?secret=WEBHOOK_SECRET
```

Webhook adalah jalur realtime yang disarankan. Bila belum dipasang, overlay memiliki fallback sync gift dari REST API. Folder `tiktok-listener/` dipertahankan hanya sebagai legacy fallback dan bukan lagi dependency utama.

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
# Secret Cloudflare
ADMIN_PASSWORD
TIKTOK_CONNECTOR_API_KEY
TIKTOK_CONNECTOR_WEBHOOK_SECRET

# Legacy fallback saja
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

Ketiga endpoint GET memanggil `tiktok-live-konektor` dari Worker dengan bearer API key, jadi credential tidak pernah dikirim ke browser.

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
- Service `tiktok-live-konektor` harus dalam status Connected saat live. Autostart tidak diwajibkan; START/STOP tetap dikontrol dari dashboard konektor.
- `live:current` hanya menyimpan 1 draw terakhir — dua gift yang masuk hampir bersamaan hanya menampilkan yang paling baru.
- Overlay polling tiap ~2 detik — ada delay ±2 detik antara trigger dan tampil di layar.
- Bundle size — `cards.ts` + `enrichedMeanings.ts` + `liveAspectMeanings.ts` cukup besar, pantau jika mendekati limit 1MB Workers free tier.
- `routes/agent.ts` dan `lib/config.ts` (legacy dari versi Oracle berbasis AI) masih ada di kode tapi tidak lagi terhubung ke fitur aktif — aman diabaikan.

---

## Lisensi

Private / internal project — tidak ada lisensi open-source publik saat ini.
