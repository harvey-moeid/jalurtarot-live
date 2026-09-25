# PROJECT_CONTEXT.md — JalurTarot Free
> Last updated: 2026-09-25 (rev 8 — "Ramalan Live") | Status: Production ready (deploy manual dibutuhkan)

---

## ★ Rev 8 — Perubahan Besar: Ramalan Live (tanpa AI)

Repo ini diubah dari "Oracle tarot berbasis LLM" menjadi **Ramalan Live** —
100% offline/statis, tanpa AI/LLM sama sekali, dikhususkan untuk siaran
**TikTok Live**. Ringkasan perubahan:

- ❌ **AI/LLM dihapus total** — tidak ada lagi panggilan ke OpenRouter. Semua
  interpretasi dihasilkan dari data statis di repo (`lib/interpret.ts`,
  `lib/enrichedMeanings.ts`, `lib/cards.ts`).
- ❌ **Sistem kredit dihapus** — ramalan sekarang gratis & tanpa batas.
- ❌ **Halaman Oracle chat (`/agent`) dihapus** — butuh percakapan AI yang
  tidak relevan lagi tanpa LLM.
- ✂️ **Spread dibatasi** — halaman `/reading` sekarang hanya menawarkan
  **1 Kartu** dan **3 Kartu** (spread lain masih ada di `lib/spreads.ts`,
  tapi tidak ditampilkan di UI).
- ✅ **Data upload baru dipakai**: `arti-tarot-78-rider-waite.md` (makna
  3 aspek — Hubungan/Karir/Nasib — untuk 78 kartu) di-parse menjadi
  `src/lib/liveAspectMeanings.ts`, dipakai khusus untuk teks ramalan live
  yang singkat & padat.
- ✅ **Fitur baru: Ramalan Live** — terhubung ke TikTok Live lewat bot
  Node.js terpisah (folder `tiktok-listener/`, jalan di Termux/VPS,
  library `tiktok-live-connector`). Saat gift target masuk, bot memanggil
  Worker → kartu ditarik → tampil otomatis di overlay OBS.

---

## 🌐 URL Production

| URL | Keterangan |
|-----|-----------|
| `https://jalurtarotfree.muidsoft.com` | **Domain utama (Production)** |
| `https://jalurtarotfree.workers.dev` | Cloudflare default URL |

---

## 🏗️ Stack & Platform

| Layer | Teknologi |
|-------|-----------|
| Runtime | Cloudflare Workers (Edge, serverless) |
| Framework | Hono v4.13+ |
| Language | TypeScript |
| Static Assets | Cloudflare Static Assets (`./public`) |
| KV Storage | Cloudflare KV (`RATE_LIMIT_KV`) — juga dipakai simpan state Ramalan Live |
| Interpretasi | 100% statis/lokal — **tidak ada AI/LLM** |
| Bot TikTok Live | Node.js terpisah (`tiktok-listener/`), `tiktok-live-connector` |
| Build | `wrangler deploy` |
| Logging | Cloudflare Observability (logs enabled, traces off) |

---

## 📁 Struktur Folder

```
jalurtarotfree/
├── src/
│   ├── index.ts                  ← Entry point (route /live baru, /agent dihapus)
│   ├── routes/
│   │   ├── api.ts                ← /api/* (interpret statis, config, claim-daily stub) ★ REWRITE rev8 — AI dihapus
│   │   ├── live.ts               ← ★ BARU rev8 — /api/live/trigger, /api/live/state, liveOverlayPage()
│   │   ├── admin.ts              ← /admin/* (auth, health[legacy], credits[legacy], banner, blacklist, ★ live[BARU])
│   │   ├── home.ts               ← GET /
│   │   ├── daily.ts              ← GET /daily
│   │   ├── reading.ts            ← GET /reading — ★ hanya single & three-card (rev8)
│   │   ├── library.ts            ← GET /library
│   │   ├── history.ts            ← GET /history
│   │   └── support.ts            ← GET /support
│   │   (agent.ts masih ada di disk tapi TIDAK didaftarkan di index.ts lagi)
│   └── lib/
│       ├── types.ts              ← TypeScript interfaces
│       ├── cards.ts              ← 78 kartu RWS
│       ├── spreads.ts            ← 6 spread definitions (hanya 2 dipakai di UI)
│       ├── interpret.ts          ← Static engine (tone-aware: spiritual/praktis/puitis)
│       ├── enrichedMeanings.ts   ← Enriched card meanings (dipakai reading biasa)
│       ├── liveAspectMeanings.ts ← ★ BARU rev8 — makna Hubungan/Karir/Nasib dari arti-tarot-78-rider-waite.md
│       ├── live.ts               ← ★ BARU rev8 — generateLiveDraw(), saveLiveDraw(), getLiveDraw()
│       ├── daily.ts              ← Daily card (djb2 hash deterministik)
│       ├── draw.ts               ← Fisher-Yates shuffle
│       ├── layout.ts             ← HTML shell + CSS design system (panel kredit Oracle sudah dihapus rev8)
│       ├── markdown.ts           ← markdownToHtml()
│       ├── icons.ts              ← SVG icons
│       └── config.ts             ← LLM config helper (legacy, dipertahankan agar /admin/health tetap jalan)
├── tiktok-listener/               ← ★ BARU rev8 — bot Node.js terpisah, TIDAK di-deploy ke Worker
│   ├── index.js                  ← Listener gift TikTok → POST /api/live/trigger
│   ├── package.json              ← ESM, dependency: tiktok-live-connector, dotenv
│   ├── .env.example
│   └── README.md                 ← Panduan setup Termux/VPS
├── public/
│   ├── cards/major/              ← 22 JPG
│   ├── cards/minor/              ← 56 JPG (cups/wands/swords/pentacles)
│   ├── icons/                    ← icon-192.png, icon-512.png
│   ├── manifest.json             ← PWA
│   ├── og-image.jpg
│   └── qris-jalurtarot.webp
├── wrangler.toml
├── package.json
└── tsconfig.json
```

---

## 🗄️ Storage — KV Keys

| Data | Storage | TTL | Key Pattern |
|------|---------|-----|-------------|
| **Draw Ramalan Live terkini** | **KV** | **6 jam** | **`live:current`** ★ BARU rev8 |
| IP Blacklist | KV | permanen | `blacklist:{IP}` |
| Banner aktif | KV | 30 hari | `banner:active` |
| Credit state per IP *(legacy, tidak dipakai lagi)* | KV | 7 hari rolling | `credit:{IP}` |
| LLM Config *(legacy, tidak dipakai lagi)* | KV | permanen | `config:llm` |
| Riwayat Ramalan | localStorage | — | `jalurtarot-readings-v1` (max 50) |
| Catatan harian | localStorage | — | `jalurtarot-daily-note-{dateKey}` |

### Schema KV `live:current` (lihat `LiveDraw` di `lib/live.ts`)
```json
{
  "id": "1735000000000-ab12cd",
  "createdAt": 1735000000000,
  "spreadId": "single",
  "spreadNameCn": "Kartu Tunggal",
  "username": "@penonton",
  "giftName": "Rose",
  "giftCount": 3,
  "cards": [ { "id": "major-00", "name": "The Fool", "nameCn": "...", "image": "/cards/...", "isReversed": false, "positionNameCn": "...", "keywords": ["..."], "aspect": { "hubungan": "...", "karir": "...", "nasib": "..." } } ],
  "summary": "✦ Ramalan untuk @penonton\n\n**...**"
}
```

---

## 🛣️ Routes

```
GET  /                    → homePage()
GET  /daily               → dailyPage()
GET  /reading             → readingPage()          ★ hanya single & three-card (rev8)
GET  /library             → libraryPage()
GET  /history             → historyPage()
GET  /support             → supportPage()
GET  /live                → liveOverlayPage()       ★ BARU rev8 — overlay OBS (transparan, polling)

GET  /api/daily-card      → dailyCardData(?date=YYYY-MM-DD)
POST /api/interpret       → interpretasi statis (SSE stream, format dipertahankan) ★ REWRITE rev8 — tanpa AI
GET  /api/config          → status statis (staticMode: true)
GET  /api/daily-bonus     → stub (selalu unlimited, rev8)
POST /api/claim-daily     → stub (selalu unlimited, rev8)
GET  /api/banner          → banner aktif dari KV (publik, untuk frontend)

# ★ BARU rev8 — Ramalan Live
POST /api/live/trigger    → auth: header X-Live-Secret. Body {spreadId, username, giftName?, giftCount?}
                             → tarik kartu, simpan ke KV live:current. Dipanggil bot tiktok-listener/.
GET  /api/live/state      → { draw: LiveDraw | null }. Di-poll halaman /live tiap ~2 detik.

# Admin Panel (auth: cookie admin_token, Path=/)
GET  /admin               → dashboard stats
GET  /admin/login         → login form
POST /admin/login         → auth + set cookie (base64url token)
POST /admin/logout        → clear cookie
GET  /admin/live          → ★ BARU rev8 — panel kontrol Live: link overlay, status LIVE_SECRET, tombol test draw manual
POST /admin/live/test-draw → ★ BARU rev8 — trigger draw manual (auth cookie admin, bukan LIVE_SECRET)
GET  /admin/credits       → legacy, tidak lagi dipakai fitur aktif manapun
GET  /admin/health        → legacy, LLM sudah nonaktif — halaman ini kosong/informatif saja
GET  /admin/banner        → banner manager
POST /admin/banner/set    → simpan banner ke KV
POST /admin/banner/deactivate → hapus banner dari KV
GET  /admin/blacklist     → IP blacklist manager
POST /admin/blacklist/add → blacklist IP
POST /admin/blacklist/remove → unblock IP
```

---

## 🔴 Ramalan Live — Arsitektur

```
TikTok Live (penonton kirim gift)
        │  gift event
        ▼
tiktok-listener/index.js  (Node.js, jalan di Termux/VPS)
        │  POST /api/live/trigger  (header X-Live-Secret)
        ▼
Cloudflare Worker — routes/live.ts
        │  tarik kartu (lib/live.ts) → simpan ke KV live:current
        ▼
GET /api/live/state  (di-poll halaman /live tiap ~2 detik)
        ▼
/live — overlay HTML transparan, dibuka sebagai OBS Browser Source.
Render kartu + ringkasan ramalan otomatis saat ada draw baru,
sembunyi lagi setelah ~45 detik.
```

**Kenapa bot terpisah dari Worker?** TikTok tidak punya API resmi untuk
membaca event live/gift. Library reverse-engineering yang umum dipakai
(`tiktok-live-connector`) butuh koneksi Node.js yang persisten — tidak
kompatibel dengan runtime Cloudflare Workers. Jadi bot ini jalan di luar
Worker (HP via Termux atau VPS), dan cuma memanggil Worker lewat HTTP biasa.

**Keamanan trigger:** `POST /api/live/trigger` wajib header
`X-Live-Secret` yang cocok dengan secret `LIVE_SECRET` di Worker
(`wrangler secret put LIVE_SECRET`). Tanpa ini, siapa pun bisa spam
endpoint tersebut.

---

## 🎭 Tone System (masih berlaku, static mode)

Tiga gaya interpretasi untuk `/reading` & `/daily` (bukan untuk ramalan live,
yang selalu pakai gaya singkat dari `liveAspectMeanings.ts`):

| Tone | Karakter |
|------|---------|
| `spiritual` | Arketipe Jungian, simbolisme dalam, refleksi batin |
| `praktis` | Tindakan konkret, keputusan nyata, langkah terukur |
| `puitis` | Bahasa metaforis, paradoks, imaji yang tajam |

---

## 🎨 Design System

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

**Nav:** Side nav desktop (56px) | Bottom nav mobile (72px, fixed) — 4 item (Home/Harian/Ramalan/Kartu), badge kredit Oracle sudah dihapus rev8

---

## ✅ Status Fitur

| Fitur | Status |
|-------|--------|
| 78 kartu RWS + gambar | ✅ |
| Interpretasi statis (tone-aware) | ✅ |
| **Ramalan Live (1/3 kartu, trigger gift TikTok, overlay OBS)** | ✅ rev8 |
| **liveAspectMeanings dari data upload (Hubungan/Karir/Nasib)** | ✅ rev8 |
| Kartu harian (deterministik) | ✅ |
| Tone selector (spiritual/praktis/puitis) | ✅ |
| History Ramalan (localStorage) | ✅ |
| PWA (manifest + icons) | ✅ |
| Mobile responsive | ✅ |
| Fisher-Yates shuffle (uniform) | ✅ |
| Admin Panel (`/admin`) + panel Live (`/admin/live`) | ✅ |
| IP Blacklist (KV-based) | ✅ |
| Banner KV (publik) | ✅ |
| ~~AI/LLM via OpenRouter~~ | ❌ dihapus rev8 |
| ~~Sistem kredit~~ | ❌ dihapus rev8 (semua ramalan gratis) |
| ~~Oracle multi-turn chat (`/agent`)~~ | ❌ dihapus rev8 |
| ~~Spread selain single/three-card di UI~~ | ❌ disembunyikan rev8 (kode masih ada di `spreads.ts`) |

---

## ⚙️ Environment Variables

```toml
# wrangler.toml [vars] — tidak ada var publik yang wajib lagi (rev8)

# Cloudflare Secrets (wrangler secret put ...)
ADMIN_PASSWORD        # wajib untuk admin panel
LIVE_SECRET           # wajib untuk Ramalan Live — harus sama persis dengan
                       # LIVE_SECRET di tiktok-listener/.env

# KV Namespace
RATE_LIMIT_KV: id = "217d91b266db4ded99680b61b5b0183c"
```

---

## 🔧 Aturan Penting — Newline & Regex di JS dalam TS Template Literal

Di dalam TypeScript template literal yang menghasilkan HTML+JS (mis.
`liveOverlayPage()` di `routes/live.ts`):

| Di TS source | Di browser JS | Hasil |
|---|---|---|
| `'\n'` | LF literal | ❌ SyntaxError |
| `'\\n'` | `'\n'` escape valid | ✅ |
| Regex asterisk tanpa escape ganda | backslash hilang, regex invalid | ❌ |
| Backslash-ganda di source untuk tiap SATU backslash di output | escape valid | ✅ |

**Selalu gunakan double-backslash di TS source untuk setiap SATU backslash
yang kamu inginkan muncul di JS browser** (regex maupun string). Kalau
ragu, uji dengan `node -e` atau `esbuild --bundle` lalu cek byte mentahnya
langsung (`python3 -c "..."` baca sebagai `bytes`) — jangan percaya
tampilan terminal/grep begitu saja, karena bisa menampilkan backslash
dobel padahal aslinya tunggal (histori debug nyata di rev8).

---

## 📦 Dependency Map

```
index.ts
  → routes/api.ts      (lib/interpret, lib/types)
  → routes/live.ts     (lib/live[generateLiveDraw, saveLiveDraw, getLiveDraw])
  → routes/admin.ts    (lib/config[legacy], lib/live — export checkBlacklist, getBannerPublic)
  → routes/reading.ts  (lib/layout, lib/spreads[difilter single/three-card], lib/cards, lib/markdown)
  → routes/daily.ts    (lib/layout, lib/daily, lib/markdown)
  → routes/home.ts     (lib/layout)
  → routes/library.ts  (lib/layout, lib/cards)
  → routes/history.ts  (lib/layout, lib/markdown, lib/icons)
  → routes/support.ts  (lib/layout)

lib/interpret.ts         → lib/types, lib/enrichedMeanings
lib/live.ts               → lib/draw, lib/spreads, lib/liveAspectMeanings, lib/types
lib/liveAspectMeanings.ts → (standalone, data statis hasil parse markdown)
lib/daily.ts              → lib/types, lib/cards
lib/draw.ts                → lib/cards, lib/types
lib/config.ts               → (legacy, standalone, hanya dipakai /admin/health)

tiktok-listener/index.js → tiktok-live-connector, dotenv (proyek Node.js terpisah, TIDAK di-bundle ke Worker)
```

---

## 🚀 Deploy

```bash
# Set secrets (sekali saja, atau saat ganti)
wrangler secret put ADMIN_PASSWORD
wrangler secret put LIVE_SECRET

# Deploy Worker ke production
wrangler deploy

# Lihat logs production
wrangler tail

# Bot TikTok listener (terpisah, jalan di Termux/VPS — lihat tiktok-listener/README.md)
cd tiktok-listener
npm install
cp .env.example .env   # isi LIVE_SECRET sama dengan di atas
npm start
```

---

## ⚠️ Known Limitations

1. **`tiktok-live-connector` bukan API resmi** — reverse-engineering pihak
   ketiga, bisa berhenti bekerja kalau TikTok mengubah sistem internalnya.
2. **Bot TikTok listener harus tetap nyala manual** selama live (Termux
   perlu `termux-wake-lock` + `tmux`/`pm2` agar tidak mati saat layar terkunci).
3. **`live:current` cuma menyimpan 1 draw terakhir** — kalau dua gift target
   masuk hampir bersamaan, overlay cuma menampilkan yang paling baru
   (draw sebelumnya langsung tertimpa).
4. **Overlay polling, bukan WebSocket** — delay ±2 detik antara trigger dan
   tampil di layar; cukup untuk kebutuhan live biasa tapi bukan realtime instan.
5. **Bundle size** — `cards.ts` + `enrichedMeanings.ts` + `liveAspectMeanings.ts`
   cukup besar, pantau jika mendekati limit 1MB Workers free tier.
6. Halaman `/admin/credits` & `/admin/health` masih ada di kode (legacy)
   tapi tidak terhubung ke fitur aktif manapun — aman diabaikan atau
   dihapus manual kalau mau beres-beres lebih lanjut.
