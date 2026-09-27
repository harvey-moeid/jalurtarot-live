# Render Setup - Jalur Tarot TikTok Listener

Listener ini berjalan sebagai Render Background Worker dan memakai Euler Stream managed WebSocket SDK (bukan scraping Room ID dari TikTok melalui connector lama).

## Deploy / update
1. Hubungkan repo `harvey-moeid/jalurtarot-live` di Render.
2. Buat atau pastikan service bertipe **Background Worker**.
3. Root Directory: `tiktok-listener`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Gunakan plan always-on berbayar yang tersedia di dashboard Render; Background Worker tidak berjalan di Free tier.
7. Isi Environment Variables:
   - `TIKTOK_USERNAME` = `jalurtarot`
   - `WORKER_URL` = `https://livejalur.muidsoft.com`
   - `LIVE_SECRET` = sama persis dengan secret Worker
   - `EULER_API_KEY` = API key Euler Stream yang punya akses WebSocket
   - `TARGET_GIFT_NAME` = `*` untuk semua gift
   - `MIN_GIFT_VALUE` = `1`
   - `THREE_CARD_MIN_VALUE` = `5`
   - `LIKE_MILESTONE` = `1000`

Setelah update dari GitHub, tunggu deploy selesai lalu periksa Logs. Jangan menjalankan service Render dan Termux bersamaan untuk akun yang sama.

## Log diagnostik
- `CONNECTED: WebSocket Euler terbuka`: handshake berhasil; cek log `ROOM CONNECTED` atau pesan event untuk memastikan room live sudah aktif.
- Close `4401`: key/autentikasi tidak valid.
- Close `4403`: key/account tidak punya izin.
- Close `4404`: akun sedang offline atau username tidak ditemukan.
- `WORKER ERROR 401`: LIVE_SECRET tidak cocok dengan secret Cloudflare Worker.

Jika koneksi berhasil tetapi event gift tidak membuat draw, lakukan tes saat akun benar-benar LIVE dan periksa log event serta bentuk data gift; nilai koin tergantung metadata yang dikirim provider.
