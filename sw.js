/* Service Worker — SBB CFF FFS Protocole Vérification
   Stratégie : network-first pour les assets, notification de mise à jour */

const CACHE_NAME = 'sbb-protocole-v1.1.0'; // ← Incrémenter à chaque déploiement

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './pdf-generator.js',
  './signature.js',
  './i18n.js',
  './logo.js',
  './logo.jpg',
  './pdf-lib.min.js',
  './manifest.json'
];

// Installation : mise en cache + activation immédiate
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // ← Prend le contrôle immédiatement
  );
});

// Activation : supprime les anciens caches, prend le contrôle de toutes les pages
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // ← Contrôle immédiat des onglets ouverts
  );
});

// Fetch : network-first pour HTML/JS/CSS (toujours à jour), cache fallback offline
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Pour les assets locaux : network-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then(response => {
          // Mettre en cache la version fraîche
          if (response && response.status === 200 && req.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match(req)) // Fallback cache si offline
    );
  } else {
    // CDN (pdf-lib) : cache-first
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});

// Message depuis la page pour forcer le rechargement
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
