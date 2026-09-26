# Bot TikTok Live — Ramalan Live Jalur Tarot

Pada Model B, listener ini berjalan sebagai Render Background Worker yang hanya dinyalakan ketika akun TikTok sedang LIVE.

Alur:
Render Cron Controller -> cek TikTok -> LIVE: resume listener -> OFFLINE: suspend listener.

Service Render:
1. jalurtarot-tiktok-listener = Background Worker.
2. jalurtarot-tiktok-controller = Cron Job.

Environment listener:
TIKTOK_USERNAME, WORKER_URL, LIVE_SECRET, TARGET_GIFT_NAME, MIN_GIFT_VALUE, THREE_CARD_MIN_VALUE, DEFAULT_SPREAD, LIKE_MILESTONE, SIGN_API_KEY.

Environment controller:
TIKTOK_USERNAME, RENDER_API_KEY, LISTENER_SERVICE_NAME, CHECK_TIMEOUT_MS.

RENDER_API_KEY adalah secret dan tidak boleh dimasukkan ke repository.

Tidak perlu menjalankan listener Termux bersamaan dengan Render.

Jeda maksimal perubahan status kira-kira satu interval cron, yaitu sekitar 1 menit.
