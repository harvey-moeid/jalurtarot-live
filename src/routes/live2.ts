/** Standalone portrait OBS/TikTok overlay. No external CDNs or viewer credentials. */
export function live2OverlayPage(): string {
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#110b20">
<meta name="color-scheme" content="dark">
<title>Jalur Tarot — LIVE 2 Magical Host</title>
<link rel="stylesheet" href="/live2.css">
<script src="/live2.js" defer></script>
</head>
<body>
<main class="live2" id="live2" aria-label="Overlay ramalan tarot TikTok Live">
  <div class="aurora" aria-hidden="true"></div>
  <header class="brand">
    <div class="brand__row"><span class="brand__moon" aria-hidden="true">☾</span><span class="brand__live">LIVE 2</span><strong>Tarot Reading</strong><span class="brand__star" aria-hidden="true">✦</span></div>
    <small>KARTU · ENERGI · PESAN SEMESTA</small>
  </header>
  <div class="stardust" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <section class="host" aria-label="Host tarot 3D">
    <div class="host__halo" aria-hidden="true"></div>
    <canvas id="host3d" aria-label="Karakter pembaca tarot tiga dimensi yang bergerak"></canvas>
    <div class="host__fallback" aria-hidden="true">🔮<span>✦</span></div>
    <div class="host__name">✦ LUNA TAROT ✦</div>
  </section>
  <section class="speech" id="speech" aria-live="polite" aria-atomic="true">
    <div class="speech__spark" aria-hidden="true">✧</div>
    <span class="speech__title" id="speech-title">Selamat datang di LIVE ✨</span>
    <p class="speech__message" id="speech-message">Kirim gift atau kumpulkan like untuk membuka pesan dari kartu tarot.</p>
  </section>
  <section class="reading" id="reading" aria-label="Hasil pembacaan kartu tarot" hidden>
    <div class="reading__eyebrow">✧ KARTU RAMALAN ✧</div>
    <h1 id="reading-name">Ramalan untuk penonton</h1>
    <div class="reading__cards" id="reading-cards"></div>
    <div class="reading__interpretation"><span class="reading__label">PESAN KARTU</span><p id="reading-summary"></p></div>
    <div class="reading__gift" id="reading-gift"></div>
  </section>
  <footer class="footer">
    <div class="footer__viewer"><span aria-hidden="true">☾</span><span id="viewer-label">Menanti energi baik...</span></div>
    <div class="footer__cta">🎁 Kirim Gift <small>untuk request ramalan</small></div>
    <p>SETIAP KARTU ADALAH PESAN ✧ SETIAP KAMU PUNYA CERITA</p>
  </footer>
  <button class="sound-toggle" id="sound-toggle" type="button" hidden aria-pressed="false">🔊 Aktifkan suara</button>
  <span class="sr-only" id="live-status" role="status">Menunggu pembacaan tarot.</span>
</main>
</body>
</html>`;
}
