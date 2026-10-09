# JalurTarot Live 🔮

Aplikasi baca tarot berbasis web untuk siaran **TikTok Live** — 100% statis, tanpa AI/LLM, tanpa biaya per-ramalan.

Saat penonton mengirim gift target, **tiktok-live-konektor** mengirim event ke Worker → kartu ditarik otomatis → tampil di overlay OBS. API key konektor tetap server-side dan tidak ditanam di JavaScript publik.

🔗 **Production:** [livejalur.muidsoft.com](https://livejalur.muidsoft.com)

---

> **Arsitektur aktif (Oktober 2026):** `tiktok-live-konektor` adalah satu-satunya sumber event TikTok. Cloudflare Worker menerima webhook gift/like, memproses setelan melalui KV, dan melayani `/live` serta `/live2`. `tiktok-listener/render.yaml` dihapus karena Blueprint listener lama tidak dipakai. Menghapus file tidak menghentikan service Render yang sudah dibuat; service lama harus dihentikan/dihapus terpisah di dashboard Render. Jangan menghapus service `tiktok-live-konektor`.

## Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | Cloudflare Workers |
| Framework | Hono v4 |
| Language | TypeScript |
| Storage | Cloudflare KV (`RATE_LIMIT_KV`) |
| Static Assets | Cloudflare Static Assets (`./public`) |
| TikTok Realtime | API bersama dari repo `tiktok-live-konektor` (REST + webhook) |
| Build/Deploy | Wrangler CLI 4.x |
| CI/CD | GitHub Actions |

---

## Fitur

- **Ramalan Live** — overlay OBS otomatis saat gift atau milestone like TikTok LIVE terpenuhi
- **78 kartu Rider-Waite** lengkap dengan gambar
- **3 aspek ramalan** per kartu: Hubungan / Karir / Nasib
- **Kartu Harian** deterministik (sama untuk semua orang di hari yang sama, hash djb2)
- **Reading manual** (`/reading`) — 1 kartu atau 3 kartu, dengan tone selector
- **Tone selector** — spiritual / praktis / puitis
- **Admin Panel** (`/admin/live`) — status konektor, konfigurasi gift dan like, banner situs, test draw manual (tanpa halaman blacklist LLM lama)
- **PWA** — bisa diinstall di HP (manifest + icons)
- **Fisher-Yates shuffle** — pengundian kartu uniform, bukan `Math.random()` naif
- Semua ramalan gratis, tanpa limit, tanpa AI/LLM eksternal

---

## Struktur

```
├── src/
│   ├── index.ts              ← Entry point & routing
│   ├── routes/
│   │   ├── home.ts           ← GET /
│   │   ├── daily.ts          ← GET /daily
│   │   ├── reading.ts        ← GET /reading (single & three-card)
│   │   ├── library.ts        ← GET /library
│   │   ├── history.ts        ← GET /history
│   │   ├── support.ts        ← GET /support
│   │   ├── live.ts           ← GET /live, /api/live/*
│   │   ├── admin.ts          ← /admin/*
│   │   ├── api.ts            ← /api/interpret, /api/config, dst
│   │   └── agent.ts          ← legacy, tidak terdaftar di index.ts
│   └── lib/
│       ├── types.ts              ← TypeScript interfaces
│       ├── cards.ts               ← 78 kartu Rider-Waite-Smith
│       ├── spreads.ts             ← 6 definisi spread (hanya 2 dipakai di UI)
│       ├── interpret.ts           ← Static interpretation engine (tone-aware)
│       ├── enrichedMeanings.ts    ← Makna kartu untuk /reading & /daily
│       ├── liveAspectMeanings.ts  ← Makna Hubungan/Karir/Nasib untuk Ramalan Live
│       ├── live.ts                ← generateLiveDraw(), saveLiveDraw(), getLiveDraw()
│       ├── daily.ts               ← Kartu harian (djb2 hash deterministik)
│       ├── draw.ts                ← Fisher-Yates shuffle
│       ├── layout.ts              ← HTML shell + CSS design system
│       ├── markdown.ts            ← markdownToHtml()
│       ├── icons.ts               ← SVG icons
│       └── config.ts              ← Legacy LLM config helper (untuk /admin/health)
├── tiktok-listener/          ← Arsip kode listener lama (tidak dijalankan/deploy)
├── public/                   ← Gambar kartu (78 JPG), icons, manifest PWA
├── .github/workflows/ci.yml  ← Type check + deploy otomatis
├── wrangler.toml
└── tsconfig.json
```

---

## Cara Kerja Ramalan Live

```
TikTok LIVE @jalurtarot
        ↓
tiktok-live-konektor (Render)
        ├─ REST /api/v1/status, /stats, /events
        └─ webhook gift + like realtime
                ↓
Cloudflare Worker jalurtarot-live
        ↓  pengaturan KV, filter gift/like + dedupe + pilih spread
tarik kartu → simpan ke SQLite Durable Object LIVE_QUEUE (antrean persisten)
       ↓  mirror legacy live:current di KV untuk kompatibilitas
        ↓
GET /api/live/state
        ↓
/live — overlay HTML transparan → OBS Browser Source
```

### Skema data `live:current` (KV)

```json
{
  "id": "1735000000000-ab12cd",
  "createdAt": 1735000000000,
  "spreadId": "single",
  "spreadNameCn": "Kartu Tunggal",
  "username": "@penonton",
  "giftName": "Rose",
  "giftCount": 3,
  "cards": [
    {
      "id": "major-00",
      "name": "The Fool",
      "image": "/cards/...",
      "isReversed": false,
      "keywords": ["..."],
      "aspect": { "hubungan": "...", "karir": "...", "nasib": "..." }
    }
  ],
  "summary": "… Ramalan untuk @penonton\n\n**...**"
}
```

---

## Setup & Deploy

### 1. Clone & install

```bash
git clone https://github.com/harvey-moeid/jalurtarot-live.git
cd jalurtarot-live
npm install
```

### 2. Setup secrets

```bash
wrangler secret put ADMIN_PASSWORD   # password untuk /admin
wrangler secret put LIVE_SECRET      # token untuk bot TikTok (buat acak, mis. openssl rand -hex 24)
```

Untuk dev lokal, buat file `.dev.vars` (lihat `.dev.vars.example`):

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars, isi ADMIN_PASSWORD dan LIVE_SECRET
```

### 3. Jalankan lokal / Deploy Worker

```bash
npm run dev            # wrangler dev, jalan di http://localhost:8787
npm run build           # tsc --noEmit (type check)
npm run deploy          # wrangler deploy
wrangler tail           # pantau logs production
```

### 4. Sambungkan tiktok-live-konektor

Set secret Worker:

```bash
wrangler secret put TIKTOK_CONNECTOR_API_KEY
wrangler secret put TIKTOK_CONNECTOR_WEBHOOK_SECRET
```

`TIKTOK_CONNECTOR_API_KEY` harus sama dengan `API_KEY` pada service `tiktok-live-konektor`.

Di dashboard `tiktok-live-konektor`, daftarkan webhook event **`chat`, `gift`, dan `like`** ke:

```text
https://DOMAIN-JALURTAROT/api/live/connector-webhook?secret=WEBHOOK_SECRET
```

Webhook adalah jalur realtime utama. Overlay memiliki fallback polling event chat, gift, dan like dari REST API service **yang sama**, `tiktok-live-konektor` (best-effort, tidak menjamin semua event). `tiktok-listener/` hanya arsip historis, jangan deploy atau hidupkan listener kedua.

### Pengaturan gift dan like tanpa redeploy

Buka `/admin/live` setelah login. Pengaturan disimpan di Cloudflare KV dengan key
`live:automation:settings:v1`; ketika belum ada data, default mengikuti `wrangler.toml`
untuk gift (aktif, semua gift, minimal 1 koin, 3 kartu mulai 5 koin) dan like aktif
setiap 40 like (1 kartu). Perubahan tidak mengubah variabel `wrangler.toml` dan
mungkin membutuhkan waktu singkat untuk propagasi antar lokasi Cloudflare.

- Gift: toggle aktif/nonaktif, nama gift atau `*`, ambang nilai koin, ambang
  tiga kartu, dan pilihan spread default.
- Like: toggle aktif/nonaktif, setiap N like pada satu room, dan 1/3 kartu.
  Preferensi counter memakai `totalLikeCount` jika tersedia; selain itu, menjumlah
  `likeCount` dari event yang masuk. Event dengan ID sama dicegah diproses ulang
  secara best-effort; lonjakan melewati beberapa milestone memicu maksimal satu draw
  per event. Penghitungan like dan deduplikasi gift/like kini dilakukan **secara atomik**
  di Durable Object SQLite (sebelumnya KV tidak menyediakan increment atomik).
- Pada konektor Render, webhook harus dikonfigurasi untuk event `chat`, `gift`, dan `like`.
  REST polling tersedia sebagai fallback, bukan pengganti webhook yang andal.
- API feed `/api/live/connector/{status,stats,events}` hanya dapat diakses
  dengan sesi login admin; jangan mengirim `TIKTOK_CONNECTOR_API_KEY` ke browser.
- Untuk kompatibilitas, `/admin` mengarah ke `/admin/live`. Halaman blacklist
  dihapus karena tidak pernah dipakai untuk menolak request publik maupun ramalan statis;
  Banner dipertahankan karena `/api/banner` dibaca oleh homepage.


### Pembacaan komentar LIVE (9 Oktober 2026)

**Tujuan:** pembaca tarot lebih natural, menjawab topik **cinta / nasib / karier** dari komentar TikTok. Implementasi lokal dan deterministik berdasarkan makna kartu, **bukan panggilan LLM/AI berbayar**.

**Alur:**
1. Penonton menulis komentar seperti `Cinta: apakah hubungan ini bisa membaik?`, `Karir: ada peluang promosi?`, atau `Nasib: bagaimana keberuntungan saya?`.
2. Worker menangkap event `chat` dan menyimpan **topik + komentar** di Cloudflare KV selama maksimal **15 menit**, dipisahkan berdasarkan room dan akun penonton. Komentar **tidak pernah memicu kartu sendiri**.
3. Saat **gift yang valid** diterima (menurut nilai/nama gift di admin), sistem mengambil **komentar terbaru pengirim gift yang belum dibacakan**. Jika tidak ada, sistem tetap menggunakan ramalan umum.
4. Saat **ambang like ROOM** tercapai, satu bacaan dibuka: pilih komentar relevan pengirim like bila ada, atau komentar relevan terbaru di room. Like yang belum melewati ambang **tidak** memicu bacaan.
5. Setelah bacaan berhasil disimpan, komentar terkait ditandai telah dibacakan (best-effort). Aspek interpretasi setiap kartu disesuaikan (`hubungan` untuk cinta, `karir` untuk karier, `nasib` untuk nasib). Seluruh kartu pada spread tiga kartu mengacu ke aspek yang sama.
6. Narasi memakai sambutan yang natural, mengacu pada pertanyaan penonton, menginterpretasikan kartu, dan memberi penutup reflektif; tanpa klaim kepastian mutlak. LIVE 1 menampilkan ringkasan humanis; LIVE 2 menggunakan `narration` pada teks dan **opsional voice** via `/live2?voice=1` (bergantung dukungan browser OBS).
7. LIVE 2 menggabungkan **beberapa kalimat per gelembung** agar narasi lebih nyaman dibaca dengan jumlah halaman lebih sedikit. Tiap bubble dibatasi **maksimal 185 karakter** (tablet/desktop), **164 karakter** (ponsel sedang), atau **148 karakter** (ponsel sempit), terputus pada batas kata dan bila memungkinkan batas kalimat. Area speech bubble diperbesar dengan aturan portrait/landscape tersendiri. Tanpa audio, paragraf berganti otomatis sekitar **4,5–11,5 detik** mengikuti panjang teks. Dengan `?voice=1`, pergantian menunggu TTS browser selesai bila tersedia (fallback timer maksimal 25 detik agar tidak macet saat OBS tidak mengirim callback). Panel bawah tetap menampilkan kartu dan ringkasan. Bacaan ditutup 6 detik setelah narasi selesai dengan batas pengaman **130 detik**. Saat ini event gift/like baru masih dapat **memotong bacaan sebelumnya** karena kedua overlay hanya menerima satu `live:current` dari KV; fitur antrean event **belum diimplementasikan**. **Animasi karakter bukan lip-sync fonem akurat.**

**WAJIB di dashboard `tiktok-live-konektor`:** edit webhook ke `https://livejalur.muidsoft.com/api/live/connector-webhook?secret=...` untuk menerima ketiga tipe **`chat`, `gift`, dan `like`**. Hanya mengaktifkan gift/like tidak cukup untuk personalisasi komentar melalui webhook. REST polling `chat,gift,like` menjadi fallback jika overlay sedang aktif, bukan jaminan delivery. API key/secret tetap disimpan server-side.

**Tes admin:** `/admin/live` → **Coba Manual** → isi Topik Demo dan Komentar Demo → tarik kartu, lalu lihat hasil di LIVE 1 atau LIVE 2. Demo browser `?demo=1` tidak memakai webhook atau memodifikasi KV.

**Catatan produksi:** Antrean pembacaan gift/like menggunakan SQLite Durable Object `LIVE_QUEUE` sebagai sumber data (bukan lagi `live:current` di KV). Setiap gift valid dan milestone like masuk log persisten, dideduplikasi berdasarkan ID event+room+jenis, dan hitungan like diproses atomik. LIVE 1 dan LIVE 2 menggunakan **cursor lokal independen**, tidak ada endpoint publik untuk menandai pembacaan milik OBS lain sebagai selesai. Setiap overlay menyelesaikan pembacaannya sebelum melanjutkan; gift didahulukan namun like mendapat giliran setelah paling banyak tiga gift berturut-turut. Data dibatasi maksimal **2.000 bacaan terbaru / umur 6 jam** untuk menjaga kapasitas; lalu dibersihkan sehingga antrean tidak menjamin penyampaian tanpa batas jika banyak sekali event masuk saat tidak ada overlay aktif. Cursor disimpan di browser/OBS `localStorage`; memuat overlay pada browser baru dimulai dari posisi ujung antrean (tidak memutar kembali kejadian lama). Komentar dan permasalahan memilih topik dari KV masih best-effort; tidak ada klaim voice lip-sync 3D asli.


### Karakter utama LIVE 2 (9 Oktober 2026)

- Default memakai ilustrasi karakter bergaya 3D hasil desain khusus Jalur Tarot, disimpan sebagai SVG transparan `public/models/jalur-tarot-host.svg`. Fokus pada wajah, ekspresi, aksesori bulan, dan kartu tarot seperti mockup yang disetujui.
- Tampilan host memiliki idle floating/tilt serta respons halus ketika gift/like memicu pembacaan; `prefers-reduced-motion` dihormati. Ini animasi ilustrasi 2.5D, **bukan rig 3D/lip-sync**.
- Model GLB asli tidak dihapus dan hanya diaktifkan dengan `/live2?character=glb&debug=1` untuk diagnosis. Mode default menghindari masalah tekstur putih/WebGL di OBS dan ponsel.
- LIVE 1, API state, pengaturan gift/like, dan webhook tetap tidak berubah. Untuk uji visual buka `/live2?demo=1&background=1`, refresh OBS Browser Source setelah deploy.


### LIVE 2 — responsif portrait dan landscape (9 Oktober 2026)

Tata letak otomatis mengikuti rasio Browser Source/viewport, tanpa parameter tambahan:
- **Portrait 9:16** (misalnya OBS **1080 × 1920**): judul di atas; karakter dan speech bubble di area tengah-atas; panel 1–3 kartu dalam baris khusus; CTA di kaki layar. Karakter tidak menutupi panel ramalan.
- **Landscape 16:9** (misalnya OBS **1920 × 1080**): judul di atas; speech bubble + panel hasil di sisi kiri; karakter ilustrasi di sisi kanan; status dan CTA tetap berada di baris footer terpisah.
- **Layar HP pendek / window kecil**: teks dan jarak dipadatkan, ornamen sekunder disembunyikan, batas panel tetap jelas.
- **Mode transparan** untuk OBS tetap default; tambah `?background=1` jika ingin latar penuh, dan `?demo=1` untuk simulasi 3 kartu tanpa TikTok.
- Setelah deploy, **refresh Browser Source** di OBS agar `live2.css?v=20261010-2` dan `live2.js?v=20261010-2` termuat. LIVE 1, webhook, dan aturan gift/like tidak berubah.

### LIVE 2 — overlay portrait 3D bergerak

URL OBS Browser Source baru (LIVE 1 tetap di `/live`):

- **Production setelah merge + deploy:** `https://livejalur.muidsoft.com/live2`
- **Preview tanpa TikTok:** `https://livejalur.muidsoft.com/live2?demo=1&background=1`
- **Background opaque (opsional):** `/live2?background=1`; default transparan untuk OBS.
- **Aktifkan voice bahasa Indonesia (opsional):** `/live2?voice=1`. Suara menggunakan `speechSynthesis` di browser dan **tidak dijamin** tersedia/terputar otomatis di semua OBS Browser Source; gunakan opsi enable audio dan cek perangkat OBS. Bubble teks tetap tampil bila suara tidak tersedia.

Pengaturan OBS yang disarankan: **width 1080, height 1920** (9:16), browser source refresh on scene activation bila diperlukan, dan browser source audio dikontrol OBS bila memakai `voice=1`.

LIVE 2 menggunakan endpoint **GET /api/live/state** dan konfigurasi gift/like yang **sama** dengan LIVE 1. Tiap draw terbaru memunculkan 1–3 kartu aktual, user, dan ringkasan dari data `aspect.nasib` selama 45 detik. Karakter bernama **Jalur Tarot** (sebelumnya Luna Tarot) kini dimuat dari **model GLB lokal** (`public/models/jalur-tarot.glb`) melalui **Three.js + GLTFLoader** yang disimpan lokal (`public/vendor/`); tidak menggunakan CDN runtime. Model bergaya stylized/chibi 3D, **bukan** karakter realistis hasil sculpt/rig Blender. Mata berkedip, kepala dan tangan bergerak, mulut bereaksi ketika teks dibacakan, dan bagian depan kartu yang dipegang memuat gambar kartu hasil draw. Renderer dibatasi ~30 FPS, memiliki fallback ketika WebGL/model gagal, serta mematuhi reduce motion.

### LIVE 2 — layout portrait yang diperbarui

Tampilan /live2 disusun dalam **empat zona terpisah**: judul di atas, karakter Jalur Tarot + bubble di tengah atas, hasil 1–3 kartu di tengah bawah, dan status + ajakan gift di paling bawah. Bubble menampilkan **paragraf 2–3 kalimat per halaman** dalam batas responsif dan panel kartu menyajikan ringkasan. Nama penonton panjang serta judul kartu tetap dipotong secara visual agar tidak menggeser elemen ke luar layar.

- Target utama OBS **1080 × 1920**, dengan penyesuaian untuk browser portrait HP, viewport pendek, dan preview landscape.
- Kartu tidak lagi berbagi area dengan notifikasi viewer; panel hasil memakai grid yang menyediakan tinggi tersendiri untuk interpretasi.
- Efek animasi dipertahankan, tetapi dinonaktifkan untuk pengguna dengan preferensi reduced motion. Fallback tanpa WebGL tetap tersedia.
- Mode default **transparan** untuk OBS; gunakan `?background=1` saat membuka overlay langsung di browser.
- Jalankan `npm test` untuk regression test yang memastikan batas area host/bubble, kartu, ticker, dan responsivitas tidak tertimpa lagi.
- Data gift/like, polling dan webhook tetap menggunakan backend yang sama dengan LIVE 1.

Keamanan: tidak perlu API key di browser, tidak ada parameter trigger publik baru, nama user dan pesan dipasang melalui `textContent`, dan path gambar kartu dibatasi ke `/cards/*.jpg`. Gunakan tombol test draw pada `/admin/live` untuk menguji dengan hasil aktual.

#### Pemeliharaan LIVE 2

- Script `public/live2.js` menangani event tarot dan renderer; `public/live2.css` mengatur layout portrait untuk layar browser dan OBS.
- Aset Three.js **r146** dan `GLTFLoader` dibundel sebagai file statis yang dipin versi, dengan lisensi `public/vendor/THREE-LICENSE.txt`. Browser memuatnya dari origin situs sendiri, sesuai CSP.
- Model 3D baru **opsional**: unggah file `public/models/jalur-tarot-custom.glb` ke branch PR ini (GitHub → Add file → Upload files), kemudian commit. `public/live2.js` otomatis memilihnya dan melakukan auto-scaling/centering berdasarkan bounding box; tidak perlu nama node tertentu.
- Untuk unggahan GLB unrigged/static, gerakan host memakai idle body motion dan kartu tarot terpisah di depan badan, dengan gambar kartu terbaru terpasang otomatis. Gerakan bibir atau tangan mengikuti tulang hanya tersedia jika aset punya node rig yang sesuai.
- Bila file custom belum ada, rusak, atau gagal dimuat, browser otomatis memakai model lama `public/models/jalur-tarot.glb`. Tidak ada perubahan pada webhook, pengaturan gift/like, atau overlay LIVE 1.
- Rekomendasi aset: gunakan GLB hasil optimasi (2–5 MB) agar OBS/mobile lebih ringan; model asli hasil scan 28 MB bisa menyebabkan initial loading lambat. Asset baru belum aktif sampai GLB diunggah ke path tersebut.
- Pengujian termasuk validasi struktur GLB. Demo `/live2?demo=1&background=1` tidak mengirim event TikTok dan tidak mengubah KV.
- Jika font, WebGL, atau gambar tarot bermasalah, sistem menampilkan fallback; gift dan webhook di Worker tidak diubah oleh pembaruan tampilan.
- Setelah PR di-merge ke `master` dan CI deploy berhasil, refresh source Browser OBS untuk mengambil aset baru.
- Loader pemulihan: jika GLTFLoader utama gagal mengurai model GLB baru, browser mencoba ulang memakai decoder mesh glTF 2.0 sederhana yang membaca geometry dan tekstur warna langsung. Model lama hanya dipakai jika kedua cara gagal. Decoder sederhana mendukung mesh standar non-Draco, atribut posisi/normal/UV serta tekstur baseColor tersemat (tidak menangani semua varian glTF). Error asli dan error pemulihan tetap terbaca di `?debug=1`.
- Jika setelah unggah `public/models/jalur-tarot-custom.glb` karakter LIVE 2 masih lama, buka `/live2?demo=1&background=1&debug=1`. Label 3D `CUSTOM` menunjukkan GLB berhasil, `LOADING` saat mengunduh, `FALLBACK` saat gagal sehingga memakai karakter bawaan, dan `UNAVAILABLE` ketika WebGL/library tidak tersedia. Lihat peringatan console untuk penyebab teknis. Label ini **hanya** tampil dengan `debug=1`.
- Asset LIVE 2 menggunakan cache-busting (`?v=...`) di JS/CSS/model GLB dan route `/live2` mengirim `Cache-Control: no-store` agar upload model tidak tertahan 404 atau script lama pada browser/OBS.

### Fullscreen LIVE 1 dan LIVE 2 (Oktober 2026)

Kedua overlay kini memakai kontrol fullscreen bersama (`public/overlay-fullscreen.js` dan `public/overlay-fullscreen.css`) yang mengisi viewport desktop, HP, portrait, atau landscape tanpa mengganti sistem data atau layout asli.

- Buka `https://livejalur.muidsoft.com/live?demo=1&background=1&controls=1` atau `https://livejalur.muidsoft.com/live2?demo=1&background=1&controls=1` untuk uji tombol **Layar Penuh**. Klik untuk masuk; klik lagi atau tekan **Esc** untuk keluar. Shortcut **F** berfungsi saat fokus berada di halaman, bukan kolom input.
- Dalam siaran biasa, tombol hanya muncul saat ada interaksi mouse/sentuh lalu otomatis hilang sehingga tidak mengganggu overlay OBS. Tambahkan `?controls=1` untuk selalu terlihat ketika preview; tambahkan `?controls=0` untuk **tidak menampilkan tombol sama sekali** (direkomendasikan bagi OBS). Parameter lain dapat digabung dengan `&`.
- Fullscreen browser menggunakan Fullscreen API dan **harus dimulai lewat klik/tap**; bukan otomatis saat memuat situs. Browser tertentu, terutama beberapa versi iOS Safari dan iframe tertentu, mungkin tidak mendukungnya; gunakan mode layar penuh bawaan browser bila tersedia.
- **OBS Browser Source berbeda dari fullscreen browser**: ukurannya berasal dari lebar/tinggi Browser Source dan transformasi source di OBS. Untuk menutup seluruh canvas OBS, atur sumber ke **1080 × 1920 (portrait)** atau **1920 × 1080 (landscape)** dan gunakan **Transform → Fit to Screen (Ctrl+F)**. Tombol HTML fullscreen tidak menggantikan pengaturan ini.
- Baik `/live` maupun `/live2` tetap memperbarui posisi berdasarkan aspect ratio dan safe area perangkat. LIVE 1 sekarang menampilkan layar idle premium saat menunggu, lalu hasil bacaannya muncul saat gift/like dan kembali ke idle setelah 45 detik. Untuk penggunaan OBS transparan seperti versi lama, tambahkan `?idle=off` pada URL. LIVE 2 tetap menampilkan host ketika menunggu. Tidak ada perubahan pada gift/like, webhook, polling, ataupun voice.
- Sesudah deploy, refresh cache Browser Source OBS agar skrip dan CSS fullscreen baru termuat.

### 5. Setup OBS

Tambahkan **Browser Source** di OBS, arahkan ke:
```
https://livejalur.muidsoft.com/live
```
LIVE 1 kini otomatis responsif untuk Browser Source OBS **portrait 1080×1920** maupun **landscape 1920×1080**. Saat tidak ada bacaan, tampil layar idle magis berwarna ungu dengan branding Jalur Tarot, tiga punggung kartu, status menunggu, petunjuk komentar, dan instruksi gift/target like. Kartu menggunakan CSS lokal (tanpa gambar/API tambahan) dan gerak ringan yang menghormati `prefers-reduced-motion`. Ketika gift/target like memicu ramalan, idle disembunyikan dan panel hasil bacaan muncul; **45 detik kemudian idle kembali**. Tidak ada perubahan logika webhook, state, gift atau like.

**Pilihan OBS:** URL standar `/live` menampilkan layar idle (tidak hitam/kosong) secara default. Jika layar OBS perlu transparan sebelum dan sesudah bacaan karena ditumpuk di atas video lain, gunakan `/live?idle=off` untuk mengembalikan perilaku versi lama. Opsi `?background=1` tetap berlaku untuk latar ketika hasil ramalan tampil; `?demo=1` mempertahankan contoh bacaan untuk pemeriksaan tampilan.

**Preview LIVE 1 (tidak memanggil webhook, tidak menyimpan draw ke KV):**
- Mode idle: `https://livejalur.muidsoft.com/live` (menunggu ketika tidak ada hasil baru)
- Mode transparan untuk OBS: `https://livejalur.muidsoft.com/live?idle=off`
- 3 kartu topik cinta: `https://livejalur.muidsoft.com/live?demo=1&background=1&topic=cinta`
- 1 kartu topik karier: `https://livejalur.muidsoft.com/live?demo=1&background=1&topic=karir&spread=single`
- 3 kartu topik nasib: `https://livejalur.muidsoft.com/live?demo=1&background=1&topic=nasib`
- Diagnostik polling: `/live?debug=1` (tampil di browser/OBS, jangan untuk siaran biasa).

Kartu dan bacaan dipisah: **portrait** menampilkan kartu di atas dan teks di bawah, sedangkan **landscape** menampilkan kartu di kiri dan teks di kanan. Narasi humanis mengikuti topik komentar, ditampilkan utuh dalam panel yang **dapat digulir manual** dan **bergulir otomatis selama 45 detik** jika melebihi tinggi viewport. Preferensi reduce-motion akan mematikan autoscroll. Input dari komentar, nama, dan gift dirender sebagai teks bukan HTML; kartu memakai aset lokal yang dibatasi ke `/cards/`.

File tampilan LIVE 1 dipisahkan menjadi `public/live1.css` dan `public/live1.js`. `/live` memakai `Cache-Control: no-store` dan query versi untuk meminimalkan cache usang di OBS. Gunakan cache-busting `v=20261010-1` untuk kedua aset pada versi idle premium. Setelah deploy, klik **Refresh cache of current page** pada Browser Source OBS. LIVE 2, webhook TikTok, dan aturan gift/like tetap tidak diubah.

Untuk uji coba tanpa live TikTok beneran, buka `/admin/live` — ada tombol test draw manual dan pengaturan gift/like.

---


### Smart Reading Queue — LIVE 1 & LIVE 2 (SQLite Durable Object)

**Tidak perlu D1.** Dalam `wrangler.toml`, binding `LIVE_QUEUE` dan migration `new_sqlite_classes=["LiveReadingQueue"]` dibuat otomatis saat deployment. Durable Object SQLite tersedia pada Workers Free, tunduk pada batas kuota Cloudflare.

Alur: webhook gift valid/like milestone → SQLite Durable Object (idempotent dan atomik) → `GET /api/live/queue` → LIVE 1 selama **45 detik** / LIVE 2 hingga narasi selesai (maks. **130 detik**) → cursor browser ditandai selesai → pembacaan berikutnya. Event saat pembacaan berlangsung **tidak memotong** hasil aktif. LIVE 2 bisa selesai lebih lambat daripada LIVE 1 karena memiliki cursor berbeda. Urutan pemilihan: gift lebih dulu, lalu satu like setelah tiga gift agar like tidak kelaparan. Maksimal 2.000 hasil terbaru dan umur antrean 6 jam; yang lebih tua akan kedaluwarsa. Ini **bukan sistem guaranteed-delivery tanpa batas**, karena batas umur, kuota, dan storage localStorage pada OBS.

Saat OBS sudah aktif, cursor tersimpan sebagai `jalurtarot:queue:v1:live1` atau `jalurtarot:queue:v1:live2` di `localStorage`. **Jangan membersihkan storage OBS saat siaran** karena browser baru mulai dari posisi antrean saat itu dan event sebelumnya tidak direplay. Event yang sedang tampil ketika reload akan diputar ulang agar tidak hilang. Jika gagal membaca Durable Object, overlay mempertahankan layar idle/bacaan yang ada dan mencoba lagi.

`/api/live/state` dipertahankan hanya untuk integrasi lama; LIVE 1 dan LIVE 2 sekarang memakai endpoint read-only `/api/live/queue`. Skrip `public/live-queue.js` mesti dimuat sebelum skrip kedua overlay. Pastikan setelah merge/deploy lakukan **Refresh cache of current page** di OBS. Koneksi `tiktok-live-konektor`, akun Cloudflare, dan izin untuk membuat SQLite Durable Objects harus tersedia.

## CI / CD

| Event | Yang terjadi |
|-------|-------------|
| Push ke branch apa pun / Pull Request | TypeScript type check (`tsc --noEmit`), Node.js 22 |
| Push ke `master` | Type check → deploy ke Cloudflare Workers (`wrangler deploy --minify`), jika lulus |

### Secrets yang diperlukan di GitHub

Buka **Settings → Secrets and variables → Actions**, tambahkan:

| Secret | Isi |
|--------|-----|
| `CLOUDFLARE_API_TOKEN` | API Token CF dengan permission `Workers Scripts: Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID dari Cloudflare dashboard |

Dependency di-update otomatis lewat `.github/dependabot.yml`.

---

## Environment Variables

```toml
# Secret Cloudflare
ADMIN_PASSWORD
TIKTOK_CONNECTOR_API_KEY
TIKTOK_CONNECTOR_WEBHOOK_SECRET

# Legacy trigger dinonaktifkan secara operasional; tidak dibutuhkan untuk integrasi connector.
LIVE_SECRET

# Vars di wrangler.toml
TIKTOK_CONNECTOR_URL = "https://tiktok-live-konektor.onrender.com"
LIVE_TARGET_GIFT_NAME = "*"
LIVE_MIN_GIFT_VALUE = "1"
LIVE_THREE_CARD_MIN_VALUE = "5"
LIVE_DEFAULT_SPREAD = "single"

# KV
RATE_LIMIT_KV
```

### API consumer yang tersedia

```text
GET  /api/live/connector/status
GET  /api/live/connector/stats
GET  /api/live/connector/events?type=chat,like,gift&limit=50
POST /api/live/connector-webhook?secret=...
```

Ketiga endpoint GET memanggil `tiktok-live-konektor` dari Worker dengan bearer API key dan membutuhkan sesi admin. Credential tidak pernah dikirim ke browser.

## Storage — KV Keys

| Data | TTL | Key Pattern |
|------|-----|-------------|
| Draw Ramalan Live terkini | 6 jam | `live:current` |
| IP Blacklist | permanen | `blacklist:{IP}` |
| Banner aktif | 30 hari | `banner:active` |
| Riwayat Ramalan (browser) | — | `localStorage: jalurtarot-readings-v1` (max 50) |
| Catatan harian (browser) | — | `localStorage: jalurtarot-daily-note-{dateKey}` |

---

## Routes

```
GET  /                  Halaman utama
GET  /daily             Kartu harian
GET  /reading           Baca tarot (1 atau 3 kartu)
GET  /library           Referensi 78 kartu
GET  /history           Riwayat ramalan (localStorage)
GET  /support           Halaman support / QRIS
GET  /live              Overlay OBS (transparan, auto-polling)

POST /api/live/trigger  Endpoint kompatibilitas lama (deprecated, jangan digunakan)
GET  /api/live/state    Status draw terkini (di-poll oleh /live)
POST /api/interpret     Interpretasi statis (SSE)
GET  /api/daily-card    Data kartu harian
GET  /api/config        Status statis
GET  /api/banner        Banner aktif dari KV (publik)

GET  /admin             Redirect ke /admin/live
GET  /admin/login       Login admin
POST /admin/login       Auth + set cookie
POST /admin/logout      Clear cookie
GET  /admin/live        Status TikTok, pengaturan gift/like + test draw manual
POST /admin/live/settings   Simpan pengaturan gift/like (sesi admin, same-origin)
POST /admin/live/test-draw  Trigger draw manual (auth cookie admin)
GET  /admin/banner      Kelola banner
POST /admin/banner/set  Simpan banner ke KV
POST /admin/banner/deactivate  Hapus banner dari KV
```

---

## Tone System

Tiga gaya interpretasi untuk `/reading` & `/daily` (Ramalan Live selalu memakai gaya singkat dari `liveAspectMeanings.ts`):

| Tone | Karakter |
|------|---------|
| `spiritual` | Arketipe Jungian, simbolisme dalam, refleksi batin |
| `praktis` | Tindakan konkret, keputusan nyata, langkah terukur |
| `puitis` | Bahasa metaforis, paradoks, imaji yang tajam |

---

## Design System

**Fonts:** Cinzel Decorative (display), Cinzel (heading), Cormorant Garamond (body), Marcellus (UI)

**Colors:**
```css
--ink-void: #050507    /* background */
--gold: #c8a84b        /* accent utama */
--gold-dim: #7a6128    /* accent redup */
--bone: #ede8de        /* teks utama */
--mist: #5c6e90        /* teks sekunder */
```

**FX:** Film grain, vignette, star canvas, cursor candle glow

**Nav:** Side nav desktop (56px) | Bottom nav mobile (72px, fixed) — 4 item: Home / Harian / Ramalan / Kartu

---

## Known Limitations

- `tiktok-live-connector` adalah reverse-engineering pihak ketiga — bisa berhenti bekerja jika TikTok mengubah sistem internalnya.
- Service `tiktok-live-konektor` harus dalam status Connected saat live. Autostart tidak diwajibkan; START/STOP tetap dikontrol dari dashboard konektor.
- `live:current` hanya mirror kompatibilitas untuk endpoint lama `/api/live/state`; event gift/like sekarang masuk `LIVE_QUEUE` Durable Object SQLite sebelum mirror, sehingga tidak saling menimpa pada overlay terbaru. Balasan webhook tetap melaporkan ID ramalan yang diterima. Bacaan dibaca terpisah di LIVE 1 dan LIVE 2; browser baru tidak mereplay backlog lama.
- Milestone like kini dihitung dengan transaksi SQLite Durable Object dan deduplikasi event. Counter room direset setelah 6 jam tidak aktif. Komentar yang terkait gift/like tetap menggunakan KV dan pemilihan topik saat event sangat berdekatan masih best-effort.
- Overlay polling tiap ~2 detik — ada delay ±2 detik antara trigger dan tampil di layar.
- Bundle size — `cards.ts` + `enrichedMeanings.ts` + `liveAspectMeanings.ts` cukup besar, pantau jika mendekati limit 1MB Workers free tier.
- `routes/agent.ts` dan `lib/config.ts` (legacy dari versi Oracle berbasis AI) masih ada di kode tapi tidak lagi terhubung ke fitur aktif — aman diabaikan.

---

## Lisensi

Private / internal project — tidak ada lisensi open-source publik saat ini.
