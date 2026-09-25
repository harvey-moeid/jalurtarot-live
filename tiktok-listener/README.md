# Bot TikTok Live — Ramalan Live Jalur Tarot

Script Node.js terpisah yang mendengarkan live TikTok kamu, dan setiap ada
gift target masuk, memanggil Worker (`/api/live/trigger`) supaya kartu
ditarik & tampil di overlay OBS (`/live`).

Ini **tidak** jalan di Cloudflare Worker — harus dijalankan di tempat lain
yang bisa nyala terus selama live, misalnya HP kamu sendiri lewat Termux.

## Setup di Termux (HP Android)

1. Install Termux dari F-Droid (bukan Play Store, sudah lama tidak diupdate di sana).
2. Buka Termux, lalu:
   ```bash
   pkg update && pkg upgrade
   pkg install nodejs git
   ```
3. Pindahkan/clone folder `tiktok-listener/` ini ke HP (misal via `termux-setup-storage`
   lalu copy dari folder Download, atau `git clone` kalau repo-nya di GitHub).
4. Masuk ke foldernya:
   ```bash
   cd tiktok-listener
   npm install
   cp .env.example .env
   nano .env   # isi TIKTOK_USERNAME, WORKER_URL, LIVE_SECRET, TARGET_GIFT_NAME, dst
   ```
5. **Penting:** `LIVE_SECRET` di `.env` ini harus **sama persis** dengan yang
   kamu set di Worker lewat:
   ```bash
   wrangler secret put LIVE_SECRET
   ```
6. Jalankan:
   ```bash
   npm start
   ```
7. Biar tidak mati saat layar HP dikunci / mati layar:
   ```bash
   termux-wake-lock
   ```
   (jalankan sebelum `npm start`, atau di sesi Termux terpisah). Kalau mau bot
   tetap hidup walau app Termux ditutup, pakai `tmux` atau `pm2`:
   ```bash
   pkg install tmux
   tmux new -s tarot
   npm start
   # tekan Ctrl+B lalu D untuk detach (bot tetap jalan di background)
   # buka lagi dengan: tmux attach -t tarot
   ```

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
