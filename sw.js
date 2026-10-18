/**
 * The Kaavish Radio (TKR) — Service Worker
 * Enables PWA installability, background asset caching, and offline resilience.
 */

const CACHE_NAME = 'tkr-v1.0.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/player.js',
  '/js/ambient-audio.js',
  '/js/rain-effect.js',
  '/manifest.json',
  '/assets/icons/logo-tkr.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/images/support_qr.jpeg',
  '/assets/images/Img1.png',
  '/assets/images/Img1_mob.png',
  '/assets/images/Img2.png',
  '/assets/images/Img2_mob.png',
  '/assets/images/Img3.png',
  '/assets/images/Img3_mob.png',
  '/data/notes.json'
];

// Install: Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with error handling so one missing optional asset doesn't break installation
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Could not precache:', url, err.message);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for app assets; Network-Only for dynamic APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker for dynamic real-time APIs
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Bypass YouTube API and external media CDNs (handled by browser)
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('fonts.googleapis.com') && !url.origin.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Fetch fresh version in background
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and not in cache, fallback gracefully
          return cachedResponse;
        });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
