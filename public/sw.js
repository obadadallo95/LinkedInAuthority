// Bump this whenever the deployed shell/assets change so an older cached
// index cannot reference chunks from a previous release.
const CACHE_NAME = 'linkedin-authority-shell-v3';
const PRECACHE_URLS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key.startsWith('linkedin-authority-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache API, Firebase, GitHub, or non-GET requests. Drafts and
  // credentials must always come from the live authenticated data path.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Hashed Vite assets are safe to cache for the lifetime of this SW version.
  // The /src and /@vite branches only support the local E2E/dev server; they
  // are static modules and never contain authenticated product data.
  const isStaticAsset = url.pathname.startsWith('/assets/')
    || url.pathname === '/manifest.json'
    || url.pathname.startsWith('/src/')
    || url.pathname.startsWith('/@vite/')
    || url.pathname === '/@react-refresh'
    || url.pathname.startsWith('/node_modules/');
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }))
    );
  }
});
