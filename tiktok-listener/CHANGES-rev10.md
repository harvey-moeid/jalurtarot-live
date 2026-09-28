# Perubahan rev10 - perbaikan listener & overlay

Branch: `fix/listener-rev10`

## tiktok-listener/index.js

| # | Perubahan | Alasan |
|---|-----------|--------|
| 4 | Gift streakable (`giftType` 1) hanya diproses pada update terakhir (`repeatEnd` true/1) | Tiap update streak punya `msgId` baru dan `repeatCount` kumulatif, jadi satu streak memicu banyak draw |
| 5 | `giftCoins()` mengembalikan `null` bila field koin tidak ada; gift yang dibuang kini di-log (`GIFT DIABAIKAN`) | Gift dengan field koin tak terbaca sebelumnya dianggap 0 koin lalu dibuang tanpa jejak |
| 6 | Event like pertama tiap koneksi hanya jadi baseline (`LIKE BASELINE`), bukan pemicu draw | Setelah reconnect / join di tengah live, milestone lama langsung memicu draw palsu |
| 8 | Hapus import `ClientCloseCode` yang tidak dipakai | Kebersihan kode |

Catatan: nama field `giftType` / `repeatEnd` belum diverifikasi terhadap skema Euler v2.
Jalankan dengan `DEBUG_EVENTS=1` saat ada gift streak dan cocokkan field pada log `EVENT RAW`.
Jika field tidak ada, `isStreakInProgress()` mengembalikan `false` (perilaku lama).

## src/routes/live.ts

| # | Perubahan | Alasan |
|---|-----------|--------|
| 3 | `GET /api/live/state` hanya mengembalikan draw berumur <= 45 detik (jam server) | KV menyimpan draw 6 jam; overlay yang dibuka / di-refresh menampilkan draw lama |
| 8 | Perbandingan `X-Live-Secret` memakai `safeEqual()` | Tidak short-circuit, mengurangi risiko timing attack |

`LIVE_STATE_MAX_AGE_MS` (45 detik) harus disamakan dengan `HIDE_AFTER_MS` di overlay.

## src/lib/live.ts

| # | Perubahan | Alasan |
|---|-----------|--------|
| 7 | File ditulis ulang hanya dengan karakter ASCII (tanda pisah, titik tengah diganti `-`) | Teks tiga kartu tampil sebagai mojibake bagi penonton |
| 8 | Spasi sisa di dalam `**...**` untuk kartu tegak dihapus | Kosmetik |

## Tidak diubah (sesuai keputusan)

- `LIKE_MILESTONE` diatur lewat env.
- Overlay tetap layar penuh (mendukung landscape).
