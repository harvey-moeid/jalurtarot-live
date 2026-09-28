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
| - | Layout khusus HP dimiringkan (`@media(orientation:landscape) and (max-height:520px)`) | Layout lama menumpuk semua elemen ke bawah sehingga di layar pendek (tinggi 320-430px) teks terpotong |
| - | `autoScroll()` menggulir teks ramalan bila lebih panjang dari kotaknya | Teks tiga kartu tidak muat di layar pendek; digulir setelah jeda 3,5 detik dan selesai sebelum overlay disembunyikan |
| - | Aturan `.gift[hidden]{display:none}` | `.gift{display:flex}` mengalahkan atribut `hidden`, sehingga pil kosong tampil saat draw tanpa gift |

### Layout HP dimiringkan

- Kartu di kolom kiri, kicker / nama penonton / gift / teks ramalan di kolom kanan (CSS grid).
- Tinggi gambar kartu = `min(56% tinggi layar, 24% lebar layar)`: pada layar sempit tiga kartu tidak memakan kolom teks.
- Layout portrait dan desktop/landscape besar (tinggi > 520px) tidak berubah.
- Belum diuji di perangkat: cek dengan test draw `single` dan `three-card` pada HP dimiringkan.

`LIVE_STATE_MAX_AGE_MS` (45 detik) harus disamakan dengan `HIDE_AFTER_MS` di overlay.

## src/lib/live.ts

| # | Perubahan | Alasan |
|---|-----------|--------|
| 7 | File ditulis ulang hanya dengan karakter ASCII (tanda pisah, titik tengah diganti `-`) | Teks tiga kartu tampil sebagai mojibake bagi penonton |
| 8 | Spasi sisa di dalam `**...**` untuk kartu tegak dihapus | Kosmetik |

## Tidak diubah (sesuai keputusan)

- `LIKE_MILESTONE` diatur lewat env.
- Overlay tetap layar penuh.
