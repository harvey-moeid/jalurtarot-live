# Deploy JalurTarot Live - Panduan Lengkap

Stack saat ini (rev 8+): **Cloudflare Workers** + **KV** + **Static Assets**.
Tidak ada LLM/AI, tidak ada API key eksternal, tidak ada sistem kredit -
semua interpretasi 100% statis dari data di repo. Fitur utama: Ramalan Live
untuk siaran TikTok Live (lihat `PROJECT_CONTEXT.md` untuk detail arsitektur).

> Panduan ini ditulis ulang di rev 9. Versi sebelumnya masih menjelaskan
> arsitektur lama berbasis OpenRouter/LLM dan sistem kredit yang sudah
> dihapus total di rev 8 - jangan pakai screenshot/salinan lama dari
> dokumen ini.

---

## Prasyarat

| Tool | Versi minimum | Install |
|------|---------------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled dengan Node |
| Wrangler CLI | 4.x | `npm i -g wrangler` |
| Akun Cloudflare | Free tier cukup | https://cloudflare.com |

Tidak perlu API key eksternal apa pun untuk situs utama (Worker). API key
hanya relevan kalau kamu memakai `SIGN_API_KEY` opsional untuk listener
TikTok (lihat bagian Bot TikTok Live di bawah).

---

## 1. Clone & Install

```bash
git clone https://github.com/harvey-moeid/jalurtarot-live.git
cd jalurtarot-live
npm install
```

---

## 2. Login ke Cloudflare

```bash
wrangler login
```

Browser akan terbuka, login akun Cloudflare, authorize Wrangler.

Verifikasi:

```bash
wrangler whoami
```

---

## 3. KV Namespace

KV dipakai untuk: state Ramalan Live (`live:current`), banner aktif, dan
IP blacklist. (Bukan untuk sistem kredit - fitur itu sudah dihapus, kode
legacy-nya masih ada tapi tidak dipakai.)

Namespace produksi sudah dibuat dan tercatat di `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "2545355c3b6e4012a1bddf0c66c181a0"
preview_id = "2545355c3b6e4012a1bddf0c66c181a0"
```

Kalau kamu fork repo ini untuk instance baru (bukan lanjutin instance yang
sudah ada), buat namespace sendiri:

```bash
wrangler kv namespace create "RATE_LIMIT_KV"
```

Output akan menampilkan `id` baru - salin ke `wrangler.toml`, ganti
`binding`, `id`, dan `preview_id` sesuai output tersebut.

---

## 4. Set Secrets

**Jangan taruh secret di `wrangler.toml`** - file itu ter-commit ke Git.

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put LIVE_SECRET
```

- `ADMIN_PASSWORD` - password untuk masuk ke `/admin`. **Wajib di-set**
  sebelum production; kalau kosong, kode fallback ke password default
  `changeme` yang tertulis di source (`src/routes/admin.ts`) - siapa pun
  yang tahu itu bisa masuk admin panel.
- `LIVE_SECRET` - token yang harus dikirim bot `tiktok-listener/` di
  header `X-Live-Secret` setiap memanggil `POST /api/live/trigger`. Isi
  bebas, buat acak, contoh: `openssl rand -hex 24`. Wajib sama persis
  dengan `LIVE_SECRET` di `.env` / environment variable listener.

Verifikasi:

```bash
wrangler secret list
# Harus muncul: ADMIN_PASSWORD, LIVE_SECRET
```

Alternatif lewat Cloudflare Dashboard: Workers & Pages -> pilih worker ->
Settings -> Variables and Secrets -> Add -> Type: Secret.

> Catatan CI/CD: workflow `.github/workflows/ci.yml` deploy pakai
> `wrangler deploy --keep-vars`, supaya secret yang di-set lewat cara di
> atas tidak ikut terhapus tiap kali auto-deploy jalan.

---

## 5. Development Lokal

```bash
npm run dev
# Worker berjalan di http://localhost:8787
```

Secrets tidak otomatis tersedia di lokal. Buat file `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars, isi ADMIN_PASSWORD dan LIVE_SECRET
```

`.dev.vars` sudah masuk `.gitignore` - tidak akan ter-commit.

---

## 6. Deploy ke Production

Manual:

```bash
npm run deploy
```

Otomatis: setiap push ke branch `master` yang lolos `tsc --noEmit` akan
ter-deploy otomatis lewat GitHub Actions (`.github/workflows/ci.yml`),
asalkan secret `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` sudah
di-set di GitHub repo Settings -> Secrets and variables -> Actions.

Output sukses (manual):

```
Successfully deployed to Cloudflare Workers
https://jalurtarot-live.YOUR-SUBDOMAIN.workers.dev
```

---

## 7. Custom Domain (Opsional)

**Via Dashboard:** Workers & Pages -> pilih worker -> Settings -> Triggers
-> Add Custom Domain.

**Via wrangler.toml:**

```toml
[[routes]]
pattern = "namadomainmu.com/*"
zone_name = "namadomainmu.com"
```

Domain production saat ini: `https://livejalur.muidsoft.com` (lihat
`PROJECT_CONTEXT.md`).

---

## 8. Integrasi TikTok Live

Jalur utama saat ini menggunakan service `tiktok-live-konektor` melalui REST API + webhook. Konfigurasikan `TIKTOK_CONNECTOR_API_KEY` dan `TIKTOK_CONNECTOR_WEBHOOK_SECRET` sebagai Cloudflare secrets (lihat `README.md`). Listener di folder `tiktok-listener/` tetap tersedia sebagai fallback terpisah jika dibutuhkan.

### Listener fallback (tiktok-listener)

Worker di atas TIDAK bisa mendengarkan gift TikTok secara langsung
(Cloudflare Workers tidak mendukung koneksi Node.js persisten). Untuk itu
ada bot Node.js terpisah di folder `tiktok-listener/`, yang bisa dijalankan
di salah satu dari:

- **Termux (HP Android)** - gratis, lihat `tiktok-listener/TERMUX-SETUP.md`
- **Render.com** - cloud, always-on, berbayar (plan Starter), lihat
  `tiktok-listener/RENDER-SETUP.md`
- **VPS sendiri** - jalankan dengan `pm2`/`systemd`

Ringkas:

```bash
cd tiktok-listener
npm install
cp .env.example .env   # isi TIKTOK_USERNAME, WORKER_URL, LIVE_SECRET (sama dengan Worker), TARGET_GIFT_NAME
npm start
```

Detail lengkap ada di `tiktok-listener/README.md`.

---

## Environment Variables - Referensi Lengkap

| Nama | Tipe | Deskripsi |
|------|------|-----------|
| `ADMIN_PASSWORD` | secret | Password `/admin`. Wajib di-set, jangan biarkan fallback `changeme`. |
| `LIVE_SECRET` | secret | Token auth untuk `POST /api/live/trigger`, dipakai bot `tiktok-listener/`. |
| `RATE_LIMIT_KV` | binding | KV Namespace - state live, banner, blacklist. |

Tidak ada environment variable publik (`[vars]`) yang wajib diisi - lihat
catatan di `wrangler.toml`.

---

## Troubleshooting

### "KV namespace not found"
Cek `id` di `wrangler.toml` harus sesuai dengan `wrangler kv namespace list`.

### Admin panel bisa dimasuki pakai password "changeme"
`ADMIN_PASSWORD` belum di-set sebagai secret. Jalankan
`wrangler secret put ADMIN_PASSWORD` lalu deploy ulang.

### `/api/live/trigger` selalu balas 401
Cek `LIVE_SECRET` di Worker (`wrangler secret list`) sama persis dengan
yang ada di `.env` / environment variable bot `tiktok-listener/`.

### `/api/live/trigger` balas 500 "LIVE_SECRET belum di-set"
Secret `LIVE_SECRET` belum ada di Worker production. Jalankan
`wrangler secret put LIVE_SECRET`.

### Overlay `/live` tidak pernah muncul saat live
1. Cek listener menampilkan log `CONNECTED` dan `DRAW OK`.
2. Buka `/admin/live`, coba tombol "Tarik Kartu Sekarang" untuk tes tanpa
   TikTok - kalau overlay tetap tidak muncul, masalah ada di Worker/overlay,
   bukan di listener.
3. Pastikan `/live` dibuka sebagai Browser Source di OBS dengan latar
   transparan diaktifkan.

### Build error TypeScript
```bash
npm run build
```
Pastikan semua type error resolved sebelum deploy. CI (`ci.yml`) juga akan
menolak deploy kalau `tsc --noEmit` gagal.

### Worker size limit
Cloudflare Workers free tier: maksimal 1 MB script. Kalau `cards.ts` +
`enrichedMeanings.ts` + `liveAspectMeanings.ts` mendekati batas ini,
pertimbangkan serve sebagian data dari KV atau R2.

---

## Struktur File Penting

Lihat bagian "Struktur Folder" di `PROJECT_CONTEXT.md` untuk detail
lengkap tiap file. Ringkasnya:

```
jalurtarot-live/
  src/
    index.ts        - entry point, routing utama
    routes/          - api.ts, live.ts, admin.ts, home.ts, daily.ts,
                       reading.ts, library.ts, history.ts, support.ts
    lib/             - cards.ts, spreads.ts, interpret.ts,
                       enrichedMeanings.ts, liveAspectMeanings.ts,
                       live.ts, daily.ts, draw.ts, layout.ts,
                       markdown.ts, icons.ts, types.ts, config.ts
  tiktok-listener/   - bot Node.js terpisah (lihat README.md di folder ini)
  public/            - gambar kartu, icon PWA, manifest
  .dev.vars.example  - template env untuk dev lokal
  .gitignore
  wrangler.toml
  package.json
  tsconfig.json
```

---

## Deploy Ulang Setelah Update Kode

```bash
git pull origin master
npm run deploy
```

Atau cukup push ke `master` dan biarkan GitHub Actions men-deploy otomatis.
KV dan Secrets tidak perlu di-setup ulang - sudah persisten di Cloudflare.
