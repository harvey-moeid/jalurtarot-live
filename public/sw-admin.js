// Service worker minimal untuk PWA installability panel Live Admin.
// Sengaja TIDAK menyimpan cache apa pun - data admin selalu berubah
// dan halaman ini dilindungi cookie auth, jadi tidak aman untuk di-cache.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through murni ke network, tanpa caching sama sekali.
  event.respondWith(fetch(event.request));
});
