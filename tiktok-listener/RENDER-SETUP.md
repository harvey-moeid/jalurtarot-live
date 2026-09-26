# Render.com Setup - Jalur Tarot Live Listener

Panduan menjalankan TikTok Live Listener Jalur Tarot di Render.com, sebagai
alternatif Termux. Cocok kalau kamu live rutin dan tidak mau bot berhenti
gara-gara HP dikunci/ditutup - Render menjalankan listener di cloud 24/7
dan otomatis restart kalau crash.

**Soal biaya:** Background Worker di Render TIDAK ada di plan Free (per
2026, Free hanya untuk Web Service/Static Site/Cron Job, dan Web Service
free tier sleep setelah ~15 menit idle - tidak cocok untuk koneksi
persisten seperti listener ini). Kamu butuh plan **Starter** (mulai
sekitar $7/bulan/service) supaya listener always-on. Kalau mau gratis,
pakai [TERMUX-SETUP.md](./TERMUX-SETUP.md) saja.

**Jangan jalankan listener ini di dua tempat sekaligus** untuk akun TikTok
yang sama (misal Termux + Render bersamaan). Dedupe gift di kode ini
hanya berlaku per-proses (in-memory), jadi dua listener yang berjalan
bersamaan bisa memicu draw kartu dobel untuk gift yang sama.

## 1. Prasyarat

- Akun [Render](https://render.com) (bisa daftar pakai akun GitHub).
- Repo `jalurtarot-live` ini sudah ada di GitHub kamu (sudah).
- `LIVE_SECRET` sudah di-set di Worker: `wrangler secret put LIVE_SECRET`.
- Kartu pembayaran terdaftar di Render (dibutuhkan untuk plan Starter,
  background worker tidak gratis - lihat catatan biaya di atas).

## 2. Cara A - Deploy pakai Blueprint (paling cepat)

Repo ini sudah menyertakan `tiktok-listener/render.yaml`.

1. Buka [dashboard.render.com](https://dashboard.render.com) -> **New** ->
   **Blueprint**.
2. Connect akun GitHub kamu kalau belum, lalu pilih repo `jalurtarot-live`.
3. Render akan membaca `render.yaml` dan menampilkan service bernama
   `jalurtarot-tiktok-listener` (tipe **Background Worker**, root dir
   `tiktok-listener`).
4. Isi environment variable yang diminta (yang ditandai perlu diisi manual):
   - `TIKTOK_USERNAME`
   - `WORKER_URL`
   - `LIVE_SECRET`
   - `TARGET_GIFT_NAME`
5. Klik **Apply**. Render akan build (`npm install`) lalu start
   (`npm start`) otomatis.

## 3. Cara B - Deploy manual tanpa Blueprint

1. Dashboard Render -> **New** -> **Background Worker**.
2. Connect repo `jalurtarot-live`.
3. Isi konfigurasi:
   - **Name**: `jalurtarot-tiktok-listener` (bebas)
   - **Region**: pilih yang terdekat (mis. Singapore)
   - **Root Directory**: `tiktok-listener`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (bukan Free - lihat catatan biaya)
4. Di bagian **Environment Variables**, isi sesuai `.env.example`:

   | Key | Contoh nilai | Wajib |
   |-----|--------------|-------|
   | `TIKTOK_USERNAME` | `namamu` (tanpa @) | Ya |
   | `WORKER_URL` | `https://livejalur.muidsoft.com` | Ya |
   | `LIVE_SECRET` | sama persis dengan secret di Worker | Ya |
   | `TARGET_GIFT_NAME` | `Rose` | Ya |
   | `MIN_GIFT_COUNT` | `1` | Tidak (default 1) |
   | `DEFAULT_SPREAD` | `single` atau `three-card` | Tidak (default single) |
   | `THREE_CARD_THRESHOLD` | `5` | Tidak (opsional) |
   | `SIGN_API_KEY` | dari eulerstream.com | Tidak (opsional) |

5. Klik **Create Background Worker**.

## 4. Cek listener sudah jalan

Buka tab **Logs** di service tersebut di dashboard Render. Kalau berhasil,
akan terlihat baris yang sama seperti di Termux:

```text
Jalur Tarot - Bot TikTok Live
  Akun target    : @username
  Worker         : https://livejalur.muidsoft.com
  Gift pemicu    : "Rose" (min 1x)
  Spread default : single
CONNECTED: @username (roomId: ...)
```

Kalau `CONNECT FAILED` terus-menerus, cek `TIKTOK_USERNAME` dan pastikan
akun sedang live.

## 5. Test Worker dan overlay

Sama seperti Termux:

- Panel admin: `https://livejalur.muidsoft.com/admin/live` (ada tombol
  test draw manual, tidak perlu listener aktif).
- Overlay OBS: `https://livejalur.muidsoft.com/live`.

## 6. Update listener

- **Blueprint / repo terhubung dengan autoDeploy**: cukup `git push` ke
  branch `master`, Render otomatis build & deploy ulang.
- **Manual**: buka service di dashboard -> **Manual Deploy** -> **Deploy
  latest commit**.

## 7. Troubleshooting

### Worker 401
Periksa `LIVE_SECRET` di Environment Variables Render. Nilainya harus
sama persis dengan secret Worker.

### Gift tidak memicu draw
Periksa `TARGET_GIFT_NAME` dan `MIN_GIFT_COUNT` di Environment Variables.

### Listener terus reconnect / CONNECT FAILED
Pastikan `TIKTOK_USERNAME` benar dan akun sedang live. Kalau sering kena
rate limit dari koneksi gratis, isi `SIGN_API_KEY` (daftar di
https://www.eulerstream.com/).

### Service dibuat sebagai Web Service, bukan Background Worker
Kalau salah pilih tipe service saat setup, listener akan idle/sleep
setelah ~15 menit (khusus plan Free) dan koneksi TikTok Live akan putus.
Hapus service tersebut, lalu buat ulang sebagai **Background Worker**
(Cara A atau B di atas).

### Build gagal / salah versi Node
Pastikan **Root Directory** di setting Render adalah `tiktok-listener`
(bukan root repo), supaya Render membaca `tiktok-listener/package.json`.

## 8. Checklist sebelum live

- [ ] TikTok sudah live.
- [ ] Log Render menampilkan `CONNECTED`.
- [ ] Service bertipe **Background Worker**, plan **Starter** (bukan Free/Web Service).
- [ ] `WORKER_URL` benar.
- [ ] `LIVE_SECRET` sama dengan Worker.
- [ ] `TARGET_GIFT_NAME` benar.
- [ ] `MIN_GIFT_COUNT` benar.
- [ ] Overlay `/live` sudah dibuka di OBS.
- [ ] Test gift berhasil (lewat `/admin/live` atau gift asli).
- [ ] Tidak ada listener lain (mis. Termux) yang jalan bersamaan untuk akun yang sama.
