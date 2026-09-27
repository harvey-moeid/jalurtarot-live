# Termux Listener - Jalur Tarot

## Update listener
Jalankan di Termux (hentikan listener lama dengan Ctrl+C atau `tmux kill-session -t tarot` lebih dulu):

```sh
cd ~/jalurtarot-live
git pull origin master
cd tiktok-listener
npm install
```

Jika folder clone berbeda, masuk ke folder repo yang sudah ada, lalu jalankan `git pull origin master`.

## Environment
Buka konfigurasi:
```sh
nano .env
```
Pastikan variabel ini terisi:
```env
TIKTOK_USERNAME=jalurtarot
WORKER_URL=https://livejalur.muidsoft.com
LIVE_SECRET=SECRET_YANG_SAMA_DENGAN_CLOUDFLARE
EULER_API_KEY=API_KEY_EULER_STREAM
```
Jangan kirim atau commit nilai rahasia. `EULER_API_KEY` adalah key dari dashboard Euler Stream yang memiliki akses WebSocket. `SIGN_API_KEY` lama tetap diterima sebagai alias, tetapi disarankan pindahkan nilainya ke `EULER_API_KEY`.

Pengaturan opsional: `TARGET_GIFT_NAME=*`, `MIN_GIFT_VALUE=1`, `THREE_CARD_MIN_VALUE=5`, `LIKE_MILESTONE=1000`.

## Jalankan
```sh
termux-wake-lock
npm start
```
Berhasil tersambung bila log menampilkan `CONNECTED: WebSocket Euler terbuka`. Saat event room masuk, akan ada `ROOM CONNECTED`. Kode tutup 4404 berarti akun tidak live/tidak ditemukan; 4401 berarti autentikasi key; 4403 berarti izin akun/key. Pastikan akun TikTok sedang LIVE dan username tepat.

Untuk tmux:
```sh
tmux new -s tarot
cd ~/jalurtarot-live/tiktok-listener
npm start
```
Detach: Ctrl+B lalu D. Masuk lagi: `tmux attach -t tarot`. Jangan jalankan listener yang sama di Termux dan Render bersamaan.
