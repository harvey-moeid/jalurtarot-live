# Bot TikTok Live — Ramalan Live Jalur Tarot

Script Node.js terpisah yang mendengarkan live TikTok kamu, dan setiap ada
gift target masuk, memanggil Worker (`/api/live/trigger`) supaya kartu
ditarik & tampil di overlay OBS (`/live`).

Ini **tidak** jalan di Cloudflare Worker — listener butuh koneksi Node.js
yang nyala terus selama live. Pilih salah satu tempat menjalankannya:

| Opsi | Cocok untuk | Biaya | Panduan |
|------|-------------|-------|---------|
| **Termux (HP Android)** | Live dari HP sendiri, sesekali | Gratis | [TERMUX-SETUP.md](./TERMUX-SETUP.md) |
| **Render.com (cloud)** | Live rutin, mau bot auto-restart tanpa jaga HP | Plan Starter – mulai ~$7/bulan (Background Worker tidak ada di Free) | [RENDER-SETUP.md](./RENDER-SETUP.md) |
| **VPS/server sendiri** | Sudah punya VPS | Tergantung VPS | Lihat bagian di bawah |

> **Penting:** jalankan hanya **satu** listener dalam satu waktu untuk
> akun TikTok yang sama (jangan Termux dan Render sekaligus). Dedupe gift
> di kode ini hanya berlaku per-proses (in-memory), jadi dua listener yang
> jalan bersamaan bisa memicu draw kartu dobel untuk gift yang sama.

## Setup di Termux (HP Android) — gratis

Ringkas:

```bash
pkg update && pkg upgrade
pkg install nodejs git tmux
git clone https://github.com/harvey-moeid/jalurtarot-live.git
cd jalurtarot-live/tiktok-listener
npm install
cp .env.example .env
nano .env   # isi TIKTOK_USERNAME, WORKER_URL, LIVE_SECRET, TARGET_GIFT_NAME, dst
termux-wake-lock
tmux new -s tarot
npm start
# Ctrl+B lalu D untuk detach (bot tetap jalan di background)
```

Panduan lengkap (troubleshooting, checklist, dll): [TERMUX-SETUP.md](./TERMUX-SETUP.md).

## Setup di Render.com — cloud, always-on

Listener jalan sebagai **Background Worker** di Render, tidak perlu HP
atau laptop nyala. Repo ini sudah menyertakan `render.yaml` (Render
Blueprint) supaya deploy tinggal beberapa klik.

Ringkas:

1. Buka [dashboard.render.com](https://dashboard.render.com) -> **New** -> **Blueprint** -> pilih repo `jalurtarot-live`.
2. Isi `TIKTOK_USERNAME`, `WORKER_URL`, `LIVE_SECRET`, `TARGET_GIFT_NAME`.
3. Klik **Apply**. Render build & jalankan otomatis (plan Starter, bukan Free — background worker berbayar).

Panduan lengkap (termasuk cara deploy manual tanpa Blueprint, troubleshooting, checklist): [RENDER-SETUP.md](./RENDER-SETUP.md).

## Setup di VPS/server (alternatif)

Sama saja — install Node.js 18+, `npm install`, isi `.env`, lalu jalankan
`npm start` di dalam `pm2` atau `systemd` supaya auto-restart kalau crash.

## Cara kerja trigger gift

- Bot ini dengar SEMUA gift yang masuk ke live kamu, tapi cuma memanggil
  Worker kalau nama gift-nya cocok dengan `TARGET_GIFT_NAME` (tidak
  case-sensitive) dan jumlahnya (dalam satu combo) >= `MIN_GIFT_COUNT`.
- Kalau kamu isi `THREE_CARD_THRESHOLD`, gift combo yang jumlahnya >= angka
  itu otomatis menarik **3 kartu** (Masa Lalu/Kini/Masa Depan), sisanya
  cuma **1 kartu**.
- Nama gift TikTok harus persis seperti yang tampil di app (contoh: "Rose",
  "GG", "Mawar" — tergantung region). Cek nama gift asli lewat TikTok Studio
  atau lihat log bot ini saat ada gift lain masuk (nama gift lain juga akan
  muncul di console meski tidak trigger, jadi kamu bisa cocokkan ejaannya).

## Catatan

- Library `tiktok-live-connector` adalah proyek reverse-engineering pihak
  ketiga (bukan API resmi TikTok), jadi bisa saja berhenti bekerja kalau
  TikTok mengubah sistem internalnya. Kalau bot gagal konek terus-menerus,
  cek versi terbaru: `npm outdated` / `npm update`.
- Untuk uji coba tanpa live TikTok beneran, buka `/admin/live` di Worker kamu
  — ada tombol "Tarik Kartu Sekarang" buat simulasi manual.
- Kalau sering kena rate limit koneksi gratis (di Termux maupun Render),
  isi `SIGN_API_KEY` dari https://www.eulerstream.com/ di `.env` / Environment Variables.
