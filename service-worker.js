const CACHE_NAME = 'pash-cache-v1';
const ASSETS_TO_CACHE = [
  '/pash/',
  '/pash/index.html',
  '/pash/styles.css',
  '/pash/script.js',
  '/pash/icons/icon-192.png',
  '/pash/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
  'https://cdn.quilljs.com/1.3.6/quill.snow.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/luxon@3.3.0/build/global/luxon.min.js',
  'https://cdn.quilljs.com/1.3.6/quill.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// Install service worker and cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests like Google APIs
  if (event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('cdn.')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response; // Return from cache if available
          }
          return fetch(event.request)
            .then(response => {
              // Don't cache if not a valid response or not GET
              if (!response || response.status !== 200 || response.type !== 'basic' || 
                  event.request.method !== 'GET') {
                return response;
              }
              
              // Cache new resources not in ASSETS_TO_CACHE
              let responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // If the request is for a page
              if (event.request.mode === 'navigate') {
                return caches.match('/pash/index.html');
              }
              // Could return a generic offline image or fallback here
            });
        })
    );
  }
}); 