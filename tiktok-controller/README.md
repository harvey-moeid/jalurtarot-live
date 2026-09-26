# Render Live Controller

Controller ini dijalankan sebagai Render Cron Job dan mengecek status LIVE TikTok secara periodik.

Alur:

Render Cron setiap 1 menit -> cek TikTok -> LIVE: resume listener -> OFFLINE: suspend listener.

Environment:
- TIKTOK_USERNAME
- RENDER_API_KEY (secret)
- LISTENER_SERVICE_NAME
- CHECK_TIMEOUT_MS (opsional)

Render API key jangan dimasukkan ke GitHub. Masukkan sebagai Environment Variable pada Cron Job.

Ada jeda maksimal sekitar satu interval cron dari perubahan status LIVE sampai listener berubah status.
