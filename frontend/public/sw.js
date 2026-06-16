// Custom service worker - next-pwa generates the main one
// This is a supplementary sw for offline fallback
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
