# Bot TikTok Live - Ramalan Live Jalur Tarot

Listener berjalan sebagai Render Background Worker. Kontrol ON/OFF dilakukan manual dari panel admin; **tidak ada Cron Controller**.

## Alur

```
TikTok LIVE
   |
   v
Render Background Worker: jalurtarot-tiktok-listener
   |
   +-- GIFT / LIKE
   |
   v
POST /api/live/trigger
   |
   v
Cloudflare Worker -> KV -> Overlay OBS
```

## Stabilitas listener

Listener menggunakan:

- `tiktok-live-connector 2.5.0`
- Node.js 20+
- reconnect exponential backoff + jitter (default 5-60 detik)
- recovery saat `DISCONNECTED`
- recovery tambahan melalui health check 30 detik
- `processInitialData: false` agar batch event lama saat awal koneksi tidak diproses sebagai trigger baru
- gift streak hanya diproses saat `repeatEnd=true`
- metadata gift membaca format connector 2.x melalui `giftDetails`, dengan fallback field lama
- request Worker memiliki timeout
- graceful shutdown untuk SIGINT/SIGTERM

> Catatan: TikTok Live Connector adalah library unofficial/reverse-engineered. Stabilitas tetap bergantung pada perubahan protokol TikTok dan layanan signing. Untuk kebutuhan production yang sangat kritis, dokumentasi library menyarankan WebSocket API Euler Stream.

## Environment listener

| Key | Wajib | Keterangan |
|---|---|---|
| `TIKTOK_USERNAME` | Ya | Username TikTok tanpa @ |
| `WORKER_URL` | Ya | URL Cloudflare Worker |
| `LIVE_SECRET` | Ya | Sama dengan secret Worker |
| `TARGET_GIFT_NAME` | Tidak | Nama gift tertentu; kosong/`*` = semua |
| `MIN_GIFT_VALUE` | Tidak | Minimum nilai koin |
| `THREE_CARD_MIN_VALUE` | Tidak | Ambang 3 kartu |
| `DEFAULT_SPREAD` | Tidak | `single` / `three-card` |
| `LIKE_MILESTONE` | Tidak | Milestone like |
| `SIGN_API_KEY` | Tidak | Euler Stream sign API key |
| `RECONNECT_MIN_MS` | Tidak | Default 5000 |
| `RECONNECT_MAX_MS` | Tidak | Default 60000 |
| `WORKER_TIMEOUT_MS` | Tidak | Default 10000 |

## Render

Service harus berupa **Background Worker**, bukan Web Service.

Konfigurasi Blueprint sudah ada di `render.yaml`:

- Name: `jalurtarot-tiktok-listener`
- Runtime: Node
- Region: Singapore
- Plan: Starter
- Root Directory: `tiktok-listener`
- Build: `npm install`
- Start: `npm start`
- Auto Deploy: aktif

**Jangan menjalankan listener Render dan Termux bersamaan** untuk akun TikTok yang sama karena keduanya dapat memproses event yang sama.

## Checklist sebelum live

- [ ] TikTok akun target sedang LIVE.
- [ ] Listener Render berstatus running.
- [ ] Log menunjukkan `CONNECTED`.
- [ ] `WORKER_URL` benar.
- [ ] `LIVE_SECRET` benar.
- [ ] Gift/like test berhasil.
- [ ] Overlay `/live` sudah terbuka di OBS.
- [ ] Tidak ada listener kedua yang aktif.
