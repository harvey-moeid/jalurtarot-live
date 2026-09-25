# Deploy JalurTarot — Panduan Lengkap

Stack: **Cloudflare Workers** + **KV** + **Static Assets** + **OpenRouter API**

---

## Prasyarat

| Tool | Versi minimum | Install |
|------|---------------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled dengan Node |
| Wrangler CLI | 4.x | `npm i -g wrangler` |
| Akun Cloudflare | Free tier cukup | https://cloudflare.com |
| OpenRouter API Key | — | https://openrouter.ai |

---

## 1. Clone & Install

```bash
git clone https://github.com/harvey-moeid/jalurtarotfree.git
cd jalurtarotfree
npm install
```

---

## 2. Login ke Cloudflare

```bash
wrangler login
```

Browser akan terbuka → login akun Cloudflare → authorize Wrangler.

Verifikasi:

```bash
wrangler whoami
```

---

## 3. Buat KV Namespace

KV menyimpan credit state user (10 kredit / 7 hari per IP). Kartu harian **bebas kredit**.

```bash
wrangler kv namespace create "RATE_LIMIT_KV"
```

Output:

```
✅ Successfully created KV namespace RATE_LIMIT_KV
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Salin `id`, update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "ID_DARI_OUTPUT_DI_ATAS"
preview_id = "ID_DARI_OUTPUT_DI_ATAS"
```

> `preview_id` dipakai saat `wrangler dev`. Boleh pakai id yang sama, atau buat terpisah dengan `wrangler kv namespace create "RATE_LIMIT_KV_DEV"`.

---

## 4. Set API Key via Cloudflare Secrets

**Jangan taruh API key di `wrangler.toml`** — akan ter-commit ke Git.

```bash
wrangler secret put OPENROUTER_API_KEY
```

Tempel API key dari https://openrouter.ai/keys → Enter.

Verifikasi:

```bash
wrangler secret list
# Harus muncul: OPENROUTER_API_KEY
```

Alternatif lewat **Cloudflare Dashboard**: Workers & Pages → pilih worker → **Settings** → **Variables and Secrets** → Add → Type: Secret → Name: `OPENROUTER_API_KEY` → Value: key kamu → Save.

---

## 5. Pilih Model LLM (Opsional)

Edit `FALLBACK_LLM_MODEL` di `wrangler.toml`. Default sudah terisi.

### Model Gratis (tanpa biaya token)

> ⚠️ Model gratis bisa dihapus sewaktu-waktu dari OpenRouter. Selalu cek https://openrouter.ai/models (filter: Free).

| Model ID | Ukuran | Keterangan |
|----------|--------|------------|
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 550B | Terbaik untuk teks panjang, paling kapabel |
| `google/gemma-4-31b-it:free` | 31B | Dari Google, stabil, vision support |
| `openrouter/free` | auto | Auto-pilih model gratis yang tersedia — paling aman dari perubahan |

### Model Berbayar (direkomendasikan untuk production)

| Model ID | Harga (per 1M token) | Keterangan |
|----------|----------------------|------------|
| `google/gemini-2.0-flash-001` | ~$0.10 / $0.40 | **Default** — cepat, murah, bagus |
| `google/gemini-2.5-flash-preview` | ~$0.15 / $0.60 | Upgrade dari default, reasoning lebih baik |
| `anthropic/claude-3-5-haiku` | $1 / $5 | Interpretasi paling humanize dan dalam |
| `openai/gpt-4o-mini` | $0.15 / $0.60 | Alternatif solid |

```toml
# wrangler.toml
FALLBACK_LLM_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"
# atau
FALLBACK_LLM_MODEL = "openrouter/free"
# atau
FALLBACK_LLM_MODEL = "google/gemini-2.5-flash-preview"
```

### Matikan LLM (mode static saja)

```toml
ENABLE_FALLBACK_LLM = "false"
```

---

## 6. Verifikasi wrangler.toml Final

```toml
name = "jalurtarotfree"
main = "src/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./public"
binding = "ASSETS"
not_found_handling = "none"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "ID_KV_PRODUCTION_KAMU"
preview_id = "ID_KV_PREVIEW_KAMU"

[vars]
ENABLE_FALLBACK_LLM = "true"
FALLBACK_LLM_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# OPENROUTER_API_KEY di Cloudflare Secrets — jangan taruh di sini
```

---

## 7. Development Lokal

```bash
npm run dev
# Worker berjalan di http://localhost:8787
```

Secrets tidak otomatis tersedia di lokal. Buat file `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars, isi dengan API key kamu
```

Isi `.dev.vars`:

```
OPENROUTER_API_KEY=sk-or-v1-KEYMU_DI_SINI
```

> `.dev.vars` sudah masuk `.gitignore` — tidak akan ter-commit.

---

## 8. Deploy ke Production

```bash
npm run deploy
```

Output sukses:

```
✅ Successfully deployed to Cloudflare Workers
🌍 https://jalurtarotfree.YOUR-SUBDOMAIN.workers.dev
```

---

## 9. Custom Domain (Opsional)

**Via Dashboard:** Workers & Pages → pilih worker → Settings → Triggers → Add Custom Domain.

**Via wrangler.toml:**

```toml
[[routes]]
pattern = "jalurtarot.com/*"
zone_name = "jalurtarot.com"
```

---

## 10. Upload Card Images ke R2 (Jika Pakai CDN)

Jika gambar kartu disimpan di Cloudflare R2 (bukan di `/public/cards/`):

```bash
wrangler r2 bucket create jalurtarot-assets
wrangler r2 object put jalurtarot-assets/cards/ --file ./public/cards/ --recursive
```

Pastikan R2 bucket punya custom domain `assets.jalurtarot.com` untuk akses publik.

---

## Environment Variables — Referensi Lengkap

| Nama | Tipe | Deskripsi | Default |
|------|------|-----------|---------|
| `ENABLE_FALLBACK_LLM` | var | `"true"` aktifkan LLM, `"false"` pakai static | `"true"` |
| `FALLBACK_LLM_MODEL` | var | Model ID OpenRouter | `"google/gemini-2.0-flash-001"` |
| `OPENROUTER_BASE_URL` | var | Base URL OpenRouter | `"https://openrouter.ai/api/v1"` |
| `OPENROUTER_API_KEY` | **secret** | API key — **wajib di Secrets** | — |
| `RATE_LIMIT_KV` | binding | KV Namespace credit system | — |

---

## Credit System

- **10 kredit per 7 hari** per IP — rolling window (bukan reset tengah malam)
- Kredit dikonsumsi **setelah** LLM berhasil merespons — LLM gagal tidak potong kredit
- **Kartu harian bebas kredit** (`/daily` tidak makan kuota)
- `pick-spread` (pemilihan susunan otomatis) tidak makan kredit
- Data tersimpan di KV: key `credit:{IP}` → JSON `{ used, resetAt }`

**Reset kredit user tertentu (manual):**

```bash
wrangler kv key delete --namespace-id=ID_KV_KAMU "credit:1.2.3.4"
```

**Lihat semua key credit:**

```bash
wrangler kv key list --namespace-id=ID_KV_KAMU --prefix="credit:"
```

---

## Troubleshooting

### "KV namespace not found"
Cek `id` di `wrangler.toml` harus sesuai dengan `wrangler kv namespace list`.

### "OpenRouter 401 Unauthorized"
Secret belum terset atau expired. Jalankan ulang `wrangler secret put OPENROUTER_API_KEY`.

### Model gratis error / tidak merespons
Model gratis OpenRouter sering berubah ketersediaannya. Ganti ke `openrouter/free` untuk auto-fallback, atau pakai model berbayar.

### Interpretasi tidak muncul (spinning terus)
Buka DevTools → Network → cek response `/api/interpret`. Kemungkinan: API key salah, model dihapus dari OpenRouter, atau kredit habis.

### Build error TypeScript
```bash
npm run build
```
Pastikan semua type error resolved sebelum deploy.

### Worker size limit
Cloudflare Workers free tier: maks 1 MB script. Kalau `cards.ts` terlalu besar, pertimbangkan serve data kartu dari KV atau R2.

### iOS Safari — input tertutup keyboard
Sudah di-fix dengan `100dvh` (dynamic viewport height). Pastikan deploy versi terbaru.

---

## Struktur File Penting

```
jalurtarotfree/
├── src/
│   ├── index.ts              # Entry point, routing utama
│   ├── routes/
│   │   ├── api.ts            # /api/interpret, /api/pick-spread, /api/config
│   │   ├── agent.ts          # Halaman Oracle (chat multi-turn)
│   │   ├── daily.ts          # Kartu harian (bebas kredit)
│   │   ├── reading.ts        # Sesi ramalan manual (5 phase)
│   │   ├── library.ts        # Perpustakaan 78 kartu
│   │   ├── history.ts        # Riwayat sesi Oracle & Ramalan
│   │   └── home.ts           # Halaman beranda
│   └── lib/
│       ├── cards.ts          # Data 78 kartu Rider-Waite-Smith
│       ├── spreads.ts        # 6 spread definitions
│       ├── interpret.ts      # Static interpretation engine (fallback)
│       ├── daily.ts          # Daily card — deterministic djb2 hash
│       ├── layout.ts         # HTML shell + CSS design system global
│       ├── markdown.ts       # Shared markdown → HTML converter
│       ├── draw.ts           # Card draw utilities (Fisher-Yates)
│       └── types.ts          # TypeScript interfaces
├── public/
│   ├── cards/                # 78 gambar kartu (.webp)
│   ├── icons/                # PWA icons (192px, 512px, svg)
│   ├── manifest.json         # PWA manifest
│   └── og-image.jpg          # OG image untuk link sharing
├── .dev.vars.example         # Template env untuk dev lokal
├── .gitignore                # node_modules, .dev.vars, .wrangler, dist
├── wrangler.toml             # Konfigurasi Cloudflare Workers
├── package.json
└── tsconfig.json
```

---

## Deploy Ulang Setelah Update Kode

```bash
git pull origin master
npm run deploy
```

KV, Secrets, dan custom domain tidak perlu setup ulang — sudah persisten di Cloudflare.
