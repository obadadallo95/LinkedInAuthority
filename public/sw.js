// Self-destroying service worker to clear caches from the old LinkedIn app and unregister itself
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        // Clear all caches
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
      .then(() => {
        // Unregister this service worker
        return self.registration.unregister();
      })
      .then(() => {
        // Claim clients and force a reload to fetch fresh non-cached assets
        return self.clients.claim();
      })
      .then(() => {
        return self.clients.matchAll();
      })
      .then((clients) => {
        clients.forEach((client) => {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url);
          }
        });
      })
  );
});
