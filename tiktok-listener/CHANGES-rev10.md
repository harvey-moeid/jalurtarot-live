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
| - | `autoScroll()` menggulir teks ramalan bila lebih panjang dari kotaknya | Teks tiga kartu tidak muat di layar pendek; mulai setelah kartu terbuka + jeda baca 3 detik dan selesai sebelum overlay disembunyikan |
| - | Aturan `.gift[hidden]{display:none}` | `.gift{display:flex}` mengalahkan atribut `hidden`, sehingga pil kosong tampil saat draw tanpa gift |
| - | `backdrop-filter: blur(18px)` dihapus dari `#stage` | Latar sudah hampir opaque (efek nyaris tak terlihat) tetapi berat di HP, dan mengganggu animasi 3D |

### Animasi overlay

Semua animasi memakai `transform` / `opacity` saja (ringan di HP).

| Animasi | Cara kerja |
|---------|-----------|
| **Layar idle** | Elemen `#idle` (bintang berkelip, tiga kartu tertutup melayang, teks ajakan berdenyut). Tampil otomatis kapan pun `#stage` tidak aktif lewat CSS `#stage.show ~ #idle{display:none}`, jadi juga menggantikan layar hitam saat menunggu dan setelah 45 detik. Teks: "Kirim gift untuk mendapat ramalan" (tidak menyebut jumlah koin karena ambang diatur lewat env listener). |
| **Kocok kartu** | Kelas `.shuffling` pada `.cards-row` selama ~1,8 detik: tiap kartu bergeser ke tengah, bertukar sisi, lalu kembali (`--dx`, `--rot` dihitung per kartu). Murni tampilan; hasil draw sudah ditentukan Worker. |
| **Flip kartu** | Tiap kartu punya punggung (`.back`) dan depan (`.front`). `.flip` awalnya `rotateY(180deg)`, kelas `.open` memutarnya ke 0. Kartu dibuka bergantian tiap 750 ms mulai detik ke-1,9. Kartu terbalik tetap diputar 180 derajat di gambarnya (`.reversed`). |
| **Pengungkapan bertahap** | Nama/posisi kartu (`.meta`) muncul setelah kartunya terbuka; teks ramalan (`.summary.in`) muncul setelah kartu terakhir terbuka, supaya hasil tidak bocor sebelum flip. |
| **Reduced motion** | Dengan `prefers-reduced-motion`, kocok dan flip dilewati; kartu dan teks langsung tampil. |

Urutan waktu untuk tiga kartu: kocok 0,35-1,75 dtk, kartu dibuka pada 1,9 / 2,65 / 3,4 dtk, teks ramalan muncul ~4,3 dtk, gulir teks (bila perlu) mulai ~7,3 dtk. Konstanta ada di awal skrip overlay (`SHUFFLE_MS`, `FLIP_START_MS`, `FLIP_GAP_MS`, `FLIP_DUR_MS`).

### Layout HP dimiringkan

- Kartu di kolom kiri, kicker / nama penonton / gift / teks ramalan di kolom kanan (CSS grid).
- Tinggi gambar kartu = `min(56% tinggi layar, 24% lebar layar)`: pada layar sempit tiga kartu tidak memakan kolom teks.
- Layar idle pada mode ini memakai susunan baris (kartu kiri, teks kanan).
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

## Belum dikerjakan (usulan)

Aura emas / debu emas, teks ramalan per aspek, bar hitung mundur, animasi masuk nama & gift, antrean draw, suara, perintah chat, riwayat draw, kontrol admin.
