# CHANGES rev11 - overlay live tidak menampilkan event

(Catatan: file ini ASCII saja, sesuai aturan PROJECT_CONTEXT.md.)

## Gejala
Saat live, event gift/like masuk tetapi overlay /live tidak menampilkan apa-apa.

## Perubahan

1. src/routes/live.ts - overlay
   - Hanya satu loop polling. Sebelumnya handler visibilitychange memanggil poll()
     lagi tanpa membatalkan loop lama, sehingga jumlah loop bertambah setiap layar
     dikunci/dibuka dan kuota request Worker / baca KV bisa habis.
   - Polling dijeda (cek tiap 3 detik) saat tab tersembunyi.
   - fetch state diberi timeout 8 detik.

2. src/routes/live.ts - LIVE_STATE_MAX_AGE_MS: 45000 -> 120000
   - KV eventually consistent; draw dari satu lokasi Cloudflare bisa baru terbaca
     di lokasi lain setelah 60 detik atau lebih. Batas 45 detik membuang draw yang
     terlambat itu.
   - PERHATIAN: ini MENGGANTIKAN catatan Known Limitations no. 9 di PROJECT_CONTEXT.md
     yang meminta LIVE_STATE_MAX_AGE_MS disamakan dengan HIDE_AFTER_MS. Sekarang
     nilainya sengaja berbeda: LIVE_STATE_MAX_AGE_MS (120 dtk) >= HIDE_AFTER_MS (45 dtk).
   - Efek samping: overlay yang di-refresh dalam 120 detik setelah draw akan
     menampilkan draw itu lagi (maksimal 45 detik).

3. tiktok-listener/index.js - LIKE_MILESTONE
   - Tidak di-set = default 1000 (sebelumnya NaN, fitur mati diam-diam).
   - Di-set kosong = nonaktif. Nilai tidak valid = error saat start.

## Sengaja tidak diubah
- logic.js isStreakInProgress tetap ketat (repeatEnd === 0/false). Ubah ke !repeatEnd
  hanya setelah DEBUG_EVENTS=1 membuktikan Euler selalu mengirim field repeatEnd.

## Deploy
- CI (.github/workflows/ci.yml) men-deploy Worker otomatis saat push ke master
  (bila secret CLOUDFLARE_API_TOKEN dan CLOUDFLARE_ACCOUNT_ID terisi).
  Pastikan job Deploy hijau di tab Actions setelah merge.
- Listener (Render / Termux) harus di-restart / di-redeploy manual.

## Belum dikerjakan
- Durable Object untuk state live (konsistensi kuat, tanpa keterlambatan KV).
- Test otomatis untuk overlay dan index.js (test yang ada hanya mencakup logic.js,
  queue.js, dan regresi keamanan).
