# PROJECT_CONTEXT.md â JalurTarot Free
> Last updated: 2026-09-26 (rev 9 â "Ramalan Live + Render listener") | Status: Production ready (deploy manual dibutuhkan)

---

## â Rev 8 â Perubahan Besar: Ramalan Live (tanpa AI)

Repo ini diubah dari "Oracle tarot berbasis LLM" menjadi **Ramalan Live** â
100% offline/statis, tanpa AI/LLM sama sekali, dikhususkan untuk siaran
**TikTok Live**. Ringkasan perubahan:

- â **AI/LLM dihapus total** â tidak ada lagi panggilan ke OpenRouter. Semua
  interpretasi dihasilkan dari data statis di repo (`lib/interpret.ts`,
  `lib/enrichedMeanings.ts`, `lib/cards.ts`).
- â **Sistem kredit dihapus** â ramalan sekarang gratis & tanpa batas.
- â **Halaman Oracle chat (`/agent`) dihapus** â butuh percakapan AI yang
  tidak relevan lagi tanpa LLM.
- âŀï¸ **Spread dibatasi** â halaman `/reading` sekarang hanya menawarkan
  **1 Kartu** dan **3 Kartu** (spread lain masih ada di `lib/spreads.ts`,
  tapi tidak ditampilkan di UI).
- â **Data upload baru dipakai**: `arti-tarot-78-rider-waite.md` (makna
  3 aspek â Hubungan/Karir/Nasib â untuk 78 kartu) di-parse menjadi
  `src/lib/liveAspectMeanings.ts`, dipakai khusus untuk teks ramalan live
  yang singkat & padat.
- â **Fitur baru: Ramalan Live** â terhubung ke TikTok Live lewat bot
  Node.js terpisah (folder `tiktok-listener/`, jalan di Termux/VPS,
  library `tiktok-live-connector`). Saat gift target masuk, bot memanggil
  Worker â kartu ditarik â tampil otomatis di overlay OBS.

## Rev 9 — Opsi deploy listener: Termux atau Render.com

- Bot `tiktok-listener/` sekarang bisa dijalankan di **Render.com**
  (Background Worker, always-on, auto-restart) sebagai alternatif Termux,
  tidak perlu HP/laptop tetap menyala saat live.
- File baru: `tiktok-listener/render.yaml` (Render Blueprint, deploy
  beberapa klik) dan `tiktok-listener/RENDER-SETUP.md` (panduan detail).
- `tiktok-listener/README.md` direstruktur jadi tabel pilihan platform
  (Termux / Render.com / VPS sendiri) dengan link ke panduan masing-masing.
- Catatan: Background Worker Render **berbayar** (plan Starter, ~$7/bulan
  per service) — tidak ada di plan Free. Jalankan hanya satu listener
  aktif per akun TikTok (jangan Termux + Render bersamaan), karena dedupe
  gift di kode cuma berlaku per-proses.

---

## ð URL Production

| URL | Keterangan |
|-----|-----------|
| `https://jalurtarotfree.muidsoft.com` | **Domain utama (Production)** |
| `https://jalurtarotfree.workers.dev` | Cloudflare default URL |

---

## ðïŃ Stack & Platform

| Layer | Teknologi |
|-------|-----------|
| Runtime | Cloudflare Workers (Edge, serverless) |
| Framework | Hono v4.13+ |
| Language | TypeScript |
| Static Assets | Cloudflare Static Assets (`./public`) |
| KV Storage | Cloudflare KV (`RATE_LIMIT_KV`) â juga dipakai simpan state Ramalan Live |
| Interpretasi | 100% statis/lokal â **tidak ada AI/LLM** |
| Bot TikTok Live | Node.js terpisah (`tiktok-listener/`), `tiktok-live-connector` — jalan di Termux (gratis) atau Render.com (Background Worker, berbayar) |
| Build | `wrangler deploy` |
| Logging | Cloudflare Observability (logs enabled, traces off) |

---

## ð Struktur Folder

```
jalurtarotfree/
âĂĂ src/
â   âĂĂ index.ts                  â Entry point (route /live baru, /agent dihapus)
â   âĂĂ routes/
â   â   âĂĂ api.ts                â /api/* (interpret statis, config, claim-daily stub) â REWRITE rev8 â AI dihapus
â   â   âĂĂ live.ts               â â BARU rev8 â /api/live/trigger, /api/live/state, liveOverlayPage()
â   â   âĂĂ admin.ts              â /admin/* (auth, health[legacy], credits[legacy], banner, blacklist, â live[BARU])
â   â   âĂĂ home.ts               â GET /
â   â   âĂĂ daily.ts              â GET /daily
â   â   âĂĂ reading.ts            â GET /reading â â hanya single & three-card (rev8)
â   â   âĂĂ library.ts            â GET /library
â   â   âĂĂ history.ts            â GET /history
â   â   âĂĂ support.ts            â GET /support
â   â   (agent.ts masih ada di disk tapi TIDAK didaftarkan di index.ts lagi)
â   âĂĂ lib/
â       âĂĂ types.ts              â TypeScript interfaces
â       âĂĂ cards.ts              â 78 kartu RWS
â       âĂĂ spreads.ts            â 6 spread definitions (hanya 2 dipakai di UI)
â       âĂĂ interpret.ts          â Static engine (tone-aware: spiritual/praktis/puitis)
â       âĂĂ enrichedMeanings.ts   â Enriched card meanings (dipakai reading biasa)
â       âĂĂ liveAspectMeanings.ts â â BARU rev8 â makna Hubungan/Karir/Nasib dari arti-tarot-78-rider-waite.md
â       âĂĂ live.ts               â â BARU rev8 â generateLiveDraw(), saveLiveDraw(), getLiveDraw()
â       âĂĂ daily.ts              â Daily card (djb2 hash deterministik)
â       âĂĂ draw.ts               â Fisher-Yates shuffle
â       âĂĂ layout.ts             â HTML shell + CSS design system (panel kredit Oracle sudah dihapus rev8)
â       âĂĂ markdown.ts           â markdownToHtml()
â       âĂĂ icons.ts              â SVG icons
â       âĂĂ config.ts             â LLM config helper (legacy, dipertahankan agar /admin/health tetap jalan)
âĂĂ tiktok-listener/               â â BARU rev8 â bot Node.js terpisah, TIDAK di-deploy ke Worker
â   âĂĂ index.js                  â Listener gift TikTok â POST /api/live/trigger
â   âĂĂ package.json              â ESM, dependency: tiktok-live-connector, dotenv
â   âĂĂ .env.example
â   âĂĂ render.yaml               â BARU rev9 â Render Blueprint (Background Worker)
â   âĂĂ README.md                 â Panduan setup, pilih Termux / Render.com / VPS
â   âĂĂ TERMUX-SETUP.md           â panduan detail Termux
â   âĂĂ RENDER-SETUP.md           â BARU rev9 â panduan detail Render.com
âĂĂ public/
â   âĂĂ cards/major/              â 22 JPG
â   âĂĂ cards/minor/              â 56 JPG (cups/wands/swords/pentacles)
â   âĂĂ icons/                    â icon-192.png, icon-512.png
â   âĂĂ manifest.json             â PWA
â   âĂĂ og-image.jpg
â   âĂĂ qris-jalurtarot.webp
âĂĂ wrangler.toml
âĂĂ package.json
âĂĂ tsconfig.json
```

---

## ðïŃ Storage â KV Keys

| Data | Storage | TTL | Key Pattern |
|------|---------|-----|-------------|
| **Draw Ramalan Live terkini** | **KV** | **6 jam** | **`live:current`** â BARU rev8 |
| IP Blacklist | KV | permanen | `blacklist:{IP}` |
| Banner aktif | KV | 30 hari | `banner:active` |
| Credit state per IP *(legacy, tidak dipakai lagi)* | KV | 7 hari rolling | `credit:{IP}` |
| LLM Config *(legacy, tidak dipakai lagi)* | KV | permanen | `config:llm` |
| Riwayat Ramalan | localStorage | â | `jalurtarot-readings-v1` (max 50) |
| Catatan harian | localStorage | â | `jalurtarot-daily-note-{dateKey}` |

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
  "summary": "â¦ Ramalan untuk @penonton\n\n**...**"
}
```

---

## ð£ïŃ Routes

```
GET  /                    â homePage()
GET  /daily               â dailyPage()
GET  /reading             â readingPage()          â hanya single & three-card (rev8)
GET  /library             â libraryPage()
GET  /history             â historyPage()
GET  /support             â supportPage()
GET  /live                â liveOverlayPage()       â BARU rev8 â overlay OBS (transparan, polling)

GET  /api/daily-card      â dailyCardData(?date=YYYY-MM-DD)
POST /api/interpret       â interpretasi statis (SSE stream, format dipertahankan) â REWRITE rev8 â tanpa AI
GET  /api/config          â status statis (staticMode: true)
GET  /api/daily-bonus     â stub (selalu unlimited, rev8)
POST /api/claim-daily     â stub (selalu unlimited, rev8)
GET  /api/banner          â banner aktif dari KV (publik, untuk frontend)

# â BARU rev8 â Ramalan Live
POST /api/live/trigger    â auth: header X-Live-Secret. Body {spreadId, username, giftName?, giftCount?}
                             â tarik kartu, simpan ke KV live:current. Dipanggil bot tiktok-listener/.
GET  /api/live/state      â { draw: LiveDraw | null }. Di-poll halaman /live tiap ~2 detik.

# Admin Panel (auth: cookie admin_token, Path=/)
GET  /admin               â dashboard stats
GET  /admin/login         â login form
POST /admin/login         â auth + set cookie (base64url token)
POST /admin/logout        â clear cookie
GET  /admin/live          â â BARU rev8 â panel kontrol Live: link overlay, status LIVE_SECRET, tombol test draw manual
POST /admin/live/test-draw â â BARU rev8 â trigger draw manual (auth cookie admin, bukan LIVE_SECRET)
GET  /admin/credits       â legacy, tidak lagi dipakai fitur aktif manapun
GET  /admin/health        â legacy, LLM sudah nonaktif â halaman ini kosong/informatif saja
GET  /admin/banner        â banner manager
POST /admin/banner/set    â simpan banner ke KV
POST /admin/banner/deactivate â hapus banner dari KV
GET  /admin/blacklist     â IP blacklist manager
POST /admin/blacklist/add â blacklist IP
POST /admin/blacklist/remove â unblock IP
```

---

## ð´ Ramalan Live â Arsitektur

```
TikTok Live (penonton kirim gift)
        â  gift event
        â¼
tiktok-listener/index.js  (Node.js, jalan di Termux / VPS / Render.com)
        â  POST /api/live/trigger  (header X-Live-Secret)
        â¼
Cloudflare Worker â routes/live.ts
        â  tarik kartu (lib/live.ts) â simpan ke KV live:current
        â¼
GET /api/live/state  (di-poll halaman /live tiap ~2 detik)
        â¼
/live â overlay HTML transparan, dibuka sebagai OBS Browser Source.
Render kartu + ringkasan ramalan otomatis saat ada draw baru,
sembunyi lagi setelah ~45 detik.
```

**Kenapa bot terpisah dari Worker?** TikTok tidak punya API resmi untuk
membaca event live/gift. Library reverse-engineering yang umum dipakai
(`tiktok-live-connector`) butuh koneksi Node.js yang persisten â tidak
kompatibel dengan runtime Cloudflare Workers. Jadi bot ini jalan di luar
Worker (HP via Termux, VPS, atau Render.com), dan cuma memanggil Worker lewat HTTP biasa.

**Keamanan trigger:** `POST /api/live/trigger` wajib header
`X-Live-Secret` yang cocok dengan secret `LIVE_SECRET` di Worker
(`wrangler secret put LIVE_SECRET`). Tanpa ini, siapa pun bisa spam
endpoint tersebut.

---

## ð­ Tone System (masih berlaku, static mode)

Tiga gaya interpretasi untuk `/reading` & `/daily` (bukan untuk ramalan live,
yang selalu pakai gaya singkat dari `liveAspectMeanings.ts`):

| Tone | Karakter |
|------|---------|
| `spiritual` | Arketipe Jungian, simbolisme dalam, refleksi batin |
| `praktis` | Tindakan konkret, keputusan nyata, langkah terukur |
| `puitis` | Bahasa metaforis, paradoks, imaji yang tajam |

---

## ð¨ Design System

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

**Nav:** Side nav desktop (56px) | Bottom nav mobile (72px, fixed) â 4 item (Home/Harian/Ramalan/Kartu), badge kredit Oracle sudah dihapus rev8

---

## â Status Fitur

| Fitur | Status |
|-------|--------|
| 78 kartu RWS + gambar | â |
| Interpretasi statis (tone-aware) | â |
| **Ramalan Live (1/3 kartu, trigger gift TikTok, overlay OBS)** | â rev8 |
| **liveAspectMeanings dari data upload (Hubungan/Karir/Nasib)** | â rev8 |
| Kartu harian (deterministik) | â |
| Tone selector (spiritual/praktis/puitis) | â |
| History Ramalan (localStorage) | â |
| PWA (manifest + icons) | â |
| Mobile responsive | â |
| Fisher-Yates shuffle (uniform) | â |
| Admin Panel (`/admin`) + panel Live (`/admin/live`) | â |
| IP Blacklist (KV-based) | â |
| Banner KV (publik) | â |
| ~~AI/LLM via OpenRouter~~ | â dihapus rev8 |
| ~~Sistem kredit~~ | â dihapus rev8 (semua ramalan gratis) |
| ~~Oracle multi-turn chat (`/agent`)~~ | â dihapus rev8 |
| ~~Spread selain single/three-card di UI~~ | â disembunyikan rev8 (kode masih ada di `spreads.ts`) |

---

## âĹï¸ Environment Variables

```toml
# wrangler.toml [vars] â tidak ada var publik yang wajib lagi (rev8)

# Cloudflare Secrets (wrangler secret put ...)
ADMIN_PASSWORD        # wajib untuk admin panel
LIVE_SECRET           # wajib untuk Ramalan Live â harus sama persis dengan
                       # LIVE_SECRET di tiktok-listener/.env

# KV Namespace
RATE_LIMIT_KV: id = "217d91b266db4ded99680b61b5b0183c"
```

---

## ð§ Aturan Penting â Newline & Regex di JS dalam TS Template Literal

Di dalam TypeScript template literal yang menghasilkan HTML+JS (mis.
`liveOverlayPage()` di `routes/live.ts`):

| Di TS source | Di browser JS | Hasil |
|---|---|---|
| `'\n'` | LF literal | â SyntaxError |
| `'\\n'` | `'\n'` escape valid | â |
| Regex asterisk tanpa escape ganda | backslash hilang, regex invalid | â |
| Backslash-ganda di source untuk tiap SATU backslash di output | escape valid | â |

**Selalu gunakan double-backslash di TS source untuk setiap SATU backslash
yang kamu inginkan muncul di JS browser** (regex maupun string). Kalau
ragu, uji dengan `node -e` atau `esbuild --bundle` lalu cek byte mentahnya
langsung (`python3 -c "..."` baca sebagai `bytes`) â jangan percaya
tampilan terminal/grep begitu saja, karena bisa menampilkan backslash
dobel padahal aslinya tunggal (histori debug nyata di rev8).

---

## ð¦ Dependency Map

```
index.ts
  â routes/api.ts      (lib/interpret, lib/types)
  â routes/live.ts     (lib/live[generateLiveDraw, saveLiveDraw, getLiveDraw])
  â routes/admin.ts    (lib/config[legacy], lib/live â export checkBlacklist, getBannerPublic)
  â routes/reading.ts  (lib/layout, lib/spreads[difilter single/three-card], lib/cards, lib/markdown)
  â routes/daily.ts    (lib/layout, lib/daily, lib/markdown)
  â routes/home.ts     (lib/layout)
  â routes/library.ts  (lib/layout, lib/cards)
  â routes/history.ts  (lib/layout, lib/markdown, lib/icons)
  â routes/support.ts  (lib/layout)

lib/interpret.ts         â lib/types, lib/enrichedMeanings
lib/live.ts               â lib/draw, lib/spreads, lib/liveAspectMeanings, lib/types
lib/liveAspectMeanings.ts â (standalone, data statis hasil parse markdown)
lib/daily.ts              â lib/types, lib/cards
lib/draw.ts                â lib/cards, lib/types
lib/config.ts               â (legacy, standalone, hanya dipakai /admin/health)

tiktok-listener/index.js â tiktok-live-connector, dotenv (proyek Node.js terpisah, TIDAK di-bundle ke Worker)
```

---

## ð Deploy

```bash
# Set secrets (sekali saja, atau saat ganti)
wrangler secret put ADMIN_PASSWORD
wrangler secret put LIVE_SECRET

# Deploy Worker ke production
wrangler deploy

# Lihat logs production
wrangler tail

# Bot TikTok listener (terpisah, jalan di Termux / VPS / Render.com —
# lihat tiktok-listener/README.md, RENDER-SETUP.md untuk Render)
cd tiktok-listener
npm install
cp .env.example .env   # isi LIVE_SECRET sama dengan di atas
npm start
```

---

## â ï¸ Known Limitations

1. **`tiktok-live-connector` bukan API resmi** â reverse-engineering pihak
   ketiga, bisa berhenti bekerja kalau TikTok mengubah sistem internalnya.
2. **Bot TikTok listener harus tetap nyala manual** selama live kalau pakai
   Termux (perlu `termux-wake-lock` + `tmux`/`pm2` agar tidak mati saat
   layar terkunci). Bisa dihindari dengan menjalankan listener di
   Render.com (Background Worker, always-on) — lihat
   `tiktok-listener/RENDER-SETUP.md`, tapi berbayar (bukan plan Free).
3. **`live:current` cuma menyimpan 1 draw terakhir** â kalau dua gift target
   masuk hampir bersamaan, overlay cuma menampilkan yang paling baru
   (draw sebelumnya langsung tertimpa).
4. **Overlay polling, bukan WebSocket** â delay Â±2 detik antara trigger dan
   tampil di layar; cukup untuk kebutuhan live biasa tapi bukan realtime instan.
5. **Bundle size** â `cards.ts` + `enrichedMeanings.ts` + `liveAspectMeanings.ts`
   cukup besar, pantau jika mendekati limit 1MB Workers free tier.
6. Halaman `/admin/credits` & `/admin/health` masih ada di kode (legacy)
   tapi tidak terhubung ke fitur aktif manapun â aman diabaikan atau
   dihapus manual kalau mau beres-beres lebih lanjut.
