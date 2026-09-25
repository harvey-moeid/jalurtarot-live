# Termux Listener - Jalur Tarot Live

Panduan menjalankan TikTok Live Listener Jalur Tarot di Android menggunakan Termux.

## 1. Install

```bash
pkg update && pkg upgrade -y
pkg install nodejs git tmux -y
node -v
npm -v
git --version
tmux -V
```

## 2. Clone repository

```bash
cd ~
git clone https://github.com/harvey-moeid/jalurtarot-live.git
cd jalurtarot-live/tiktok-listener
```

Jika sudah pernah clone:

```bash
cd ~/jalurtarot-live
git pull
cd tiktok-listener
```

## 3. Install dependency

```bash
npm install
```

## 4. Buat konfigurasi

```bash
cp .env.example .env
nano .env
```

Contoh:

```env
TIKTOK_USERNAME=USERNAME_TIKTOK_KAMU
WORKER_URL=https://livejalur.muidsoft.com
LIVE_SECRET=ISI_SECRET_YANG_SAMA_DENGAN_WORKER
TARGET_GIFT_NAME=Rose
MIN_GIFT_COUNT=1
DEFAULT_SPREAD=single
THREE_CARD_THRESHOLD=5
SIGN_API_KEY=
```

### Keterangan
- `TIKTOK_USERNAME`: username TikTok tanpa `@`.
- `WORKER_URL`: URL Worker, tanpa `/api/live/trigger`.
- `LIVE_SECRET`: harus sama dengan secret `LIVE_SECRET` pada Worker.
- `TARGET_GIFT_NAME`: nama gift yang menjadi pemicu.
- `MIN_GIFT_COUNT`: jumlah minimum gift.
- `DEFAULT_SPREAD`: `single` atau `three-card`.
- `THREE_CARD_THRESHOLD`: opsional; jumlah gift yang otomatis memakai `three-card`.
- `SIGN_API_KEY`: opsional.

Jangan commit file `.env` atau membagikan `LIVE_SECRET`.

## 5. Aktifkan wake lock

```bash
termux-wake-lock
```

Selain itu, matikan pembatasan battery/background untuk Termux pada pengaturan Android jika perangkat membatasi proses background.

## 6. Test pertama

```bash
npm start
```

Jika berhasil, akan terlihat:

```text
Jalur Tarot - Bot TikTok Live
  Akun target    : @username
  Worker         : https://livejalur.muidsoft.com
  Gift pemicu    : "Rose" (min 1x)
  Spread default : single
CONNECTED: @username (roomId: ...)
```

Jika akun belum live atau koneksi gagal, listener akan mencoba reconnect otomatis.

Stop dengan `Ctrl+C`.

## 7. Jalankan dengan tmux

```bash
tmux new -s tarot
cd ~/jalurtarot-live/tiktok-listener
npm start
```

Detach tanpa menghentikan listener:

```text
Ctrl+B
D
```

Lihat session:

```bash
tmux ls
```

Masuk kembali:

```bash
tmux attach -t tarot
```

Stop session:

```bash
tmux kill-session -t tarot
```

## 8. Arti log

```text
CONNECTED:       berhasil terhubung ke TikTok Live
GIFT:            gift cocok dan akan diproses
DRAW OK:         Worker berhasil membuat draw
DUPLICATE:       event gift duplikat diabaikan
DISCONNECTED:    koneksi TikTok terputus
RECONNECT:       listener menjadwalkan koneksi ulang
CONNECT FAILED:  percobaan koneksi gagal
WORKER ERROR:    Worker menolak atau tidak merespons
```

## 9. Test Worker dan overlay

Buka halaman admin:

`https://livejalur.muidsoft.com/admin/live`

Kemudian overlay:

`https://livejalur.muidsoft.com/live`

Test admin menguji Worker dan overlay. Untuk menguji listener secara penuh, akun TikTok harus live dan mengirim gift yang sesuai dengan `TARGET_GIFT_NAME`.

## 10. Troubleshooting

### Worker 401
Periksa `LIVE_SECRET` pada `.env`. Nilainya harus sama dengan secret Worker.

### Gift tidak memicu draw
Periksa `TARGET_GIFT_NAME` dan `MIN_GIFT_COUNT`.

### Listener terus reconnect
Pastikan username benar dan akun sedang live. Periksa koneksi internet Termux.

### Worker timeout
Periksa internet HP dan status Worker. Listener memiliki timeout request 10 detik.

### Listener mati saat layar mati
Jalankan:

```bash
termux-wake-lock
```

Periksa juga optimasi baterai Android untuk Termux.

## 11. Update listener

```bash
cd ~/jalurtarot-live
git pull
cd tiktok-listener
npm install
```

Jika listener sedang berjalan di tmux, hentikan proses dengan `Ctrl+C`, lalu jalankan kembali `npm start`.

## 12. Checklist sebelum live

- [ ] TikTok sudah live.
- [ ] Listener menampilkan `CONNECTED`.
- [ ] `WORKER_URL` benar.
- [ ] `LIVE_SECRET` benar.
- [ ] `TARGET_GIFT_NAME` benar.
- [ ] `MIN_GIFT_COUNT` benar.
- [ ] Overlay `/live` sudah dibuka di OBS.
- [ ] Test gift berhasil.
- [ ] Tidak ada `WORKER ERROR`.
- [ ] Tidak ada `CONNECT FAILED` terus-menerus.
- [ ] `termux-wake-lock` sudah aktif.

## 13. Perintah cepat

```bash
cd ~/jalurtarot-live
git pull
cd tiktok-listener
npm install
termux-wake-lock
tmux new -s tarot
npm start
```

Detach:

```text
Ctrl+B
D
```

Listener akan tetap berjalan di session tmux dan akan mencoba reconnect ketika koneksi TikTok terputus.