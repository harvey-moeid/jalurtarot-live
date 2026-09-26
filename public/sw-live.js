// Service worker untuk PWA installability halaman overlay Live.
// Hanya icon statis yang boleh di-cache (jarang berubah). HTML overlay
// dan /api/live/state SELALU network-first supaya overlay tidak pernah
// menampilkan draw kartu yang basi.
const CACHE_NAME = 'jalurtarot-live-overlay-v1';
const PRECACHE_URLS = ['/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // HTML overlay + /api/live/state: selalu network, tanpa fallback cache.
  event.respondWith(fetch(event.request));
});
