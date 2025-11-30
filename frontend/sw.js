const CACHE_NAME = 'ecosdelcampo-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/premium.css',
  '/js/config.js',
  '/manifest.json',
  '/offline.html',
  // Add other critical assets here (icons, fonts if local)
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching app shell v3');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
  // Ignore non-http/https requests (like chrome-extension://)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // API requests
  if (event.request.url.includes('/api/')) {
    // Strategy for GET: Network First, Fallback to Cache
    if (event.request.method === 'GET') {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            // Cache valid responses
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            // Fallback to cache
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              return cachedResponse;
            }
            // If nothing in cache, return offline error
            return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          })
      );
      return;
    }

    // Strategy for Non-GET (POST, PUT, etc.): Network Only (let it fail to handle in UI)
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503 // Service Unavailable
        });
      })
    );
    return;
  }

  // Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache with new version if valid
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise;
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
    })
  );
});
