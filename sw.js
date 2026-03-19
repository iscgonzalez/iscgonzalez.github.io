// GymLog Service Worker v4
const CACHE_NAME = 'gymlog-v4';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// ── Install: cache shell assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for assets, network-first for API ──
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests we don't cache
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if(cached) return cached;

        return fetch(event.request)
          .then(response => {
            // Only cache valid responses
            if(!response || response.status !== 200 || response.type === 'opaque'){
              return response;
            }
            const toCache = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
            return response;
          })
          .catch(() => {
            // Offline fallback: return the cached index.html for navigation requests
            if(event.request.mode === 'navigate'){
              return caches.match('./index.html');
            }
          });
      })
  );
});
