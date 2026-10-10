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
<link rel="stylesheet" href="/live2.css?v=20261010-2">
<link rel="stylesheet" href="/overlay-fullscreen.css?v=20261009-1">
<script src="/vendor/three.r146.min.js" defer></script>
<script src="/vendor/GLTFLoader.r146.js" defer></script>
<script src="/live-queue.js?v=20261010-1" defer></script>
<script src="/live-audio.js?v=20261010-1" defer></script>
<script src="/live2.js?v=20261010-3" defer></script>
<script src="/overlay-fullscreen.js?v=20261009-1" defer></script>
</head>
<body>
<main class="live2" id="live2" aria-label="Overlay ramalan tarot TikTok Live">
  <div class="aurora" aria-hidden="true"></div>
  <header class="brand">
    <div class="brand__row"><span class="brand__moon" aria-hidden="true">☾</span><span class="brand__live">LIVE 2</span><strong>Jalur Tarot</strong><span class="brand__star" aria-hidden="true">✦</span></div>
    <small>KARTU · ENERGI · PESAN SEMESTA</small>
  </header>
  <div class="stardust" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <section class="host" aria-label="Host tarot 3D">
    <div class="host__halo" aria-hidden="true"></div>
    <img id="host-portrait" class="host__portrait" src="/models/jalur-tarot-host.svg?v=20261009-1" width="680" height="750" alt="Karakter Jalur Tarot bergaya fantasi 3D memegang kartu tarot" fetchpriority="high" decoding="async">
    <canvas id="host3d" aria-label="Mode eksperimental model tiga dimensi Jalur Tarot"></canvas>
    <div class="host__debug" id="host-model-debug" role="status" aria-live="polite" hidden></div>
    <div class="host__fallback" aria-hidden="true">🔮<span>✦</span></div>
    <div class="host__name">✦ JALUR TAROT ✦</div>
  </section>
  <section class="speech" id="speech" aria-live="polite" aria-atomic="true">
    <div class="speech__spark" aria-hidden="true">✧</div>
    <span class="speech__title" id="speech-title">Selamat datang di LIVE ✨</span>
    <p class="speech__message" id="speech-message">Tulis CINTA, NASIB, atau KARIR di komentar. Ramalan muncul setelah gift atau target like tercapai.</p>
    <small class="speech__progress" id="speech-progress" aria-hidden="true" hidden></small>
  </section>
  <section class="reading" id="reading" aria-label="Hasil pembacaan kartu tarot" hidden>
    <div class="reading__eyebrow">✧ KARTU RAMALAN ✧</div>
    <h1 id="reading-name">Ramalan untuk penonton</h1>
    <div class="reading__cards" id="reading-cards"></div>
    <div class="reading__interpretation"><span class="reading__label">PESAN KARTU</span><p id="reading-summary"></p></div>
    <div class="reading__gift" id="reading-gift"></div>
  </section>
  <footer class="footer">
    <div class="footer__viewer"><span aria-hidden="true">☾</span><span id="viewer-label">Menanti energi baik...</span><small class="queue-indicator" id="queue-indicator" aria-live="off"></small></div>
    <div class="footer__cta"><span aria-hidden="true">🎁</span> Gift atau Target Like = Ramalan <small>komentar: cinta · nasib · karir</small></div>
    <p>SETIAP KARTU ADALAH PESAN ✧ SETIAP KAMU PUNYA CERITA</p>
  </footer>
  <button class="sound-toggle" id="sound-toggle" type="button" hidden aria-pressed="false">🔊 Aktifkan suara</button>
  <span class="sr-only" id="live-status" role="status">Menunggu pembacaan tarot.</span>
</main>
<div class="overlay-fullscreen-control" id="overlay-fullscreen-control">
  <button class="overlay-fullscreen-button" id="overlay-fullscreen-button" type="button" aria-label="Masuk layar penuh" aria-pressed="false" title="Masuk layar penuh"><span class="overlay-fullscreen-icon" aria-hidden="true">⛶</span><span class="overlay-fullscreen-label">Layar Penuh</span></button>
</div>
<div class="overlay-fullscreen-status" id="overlay-fullscreen-status" role="status" aria-live="polite" hidden></div>
</body>
</html>`;
}
