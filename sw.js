const CACHE_NAME = 'av-rr-static-1',
  cachedFiles = [
    '/index.html',
    '/css/styles.css',
    '/restaurant.html',
    '/img/',
    '/js/main.js',
    '/data/restaurants.json',
    '/js/restaurant_info.js',
    '/js/dbhelper.js'
  ];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(cachedFiles);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name.startsWith('av-rr-') && name !== CACHE_NAME;
          })
          .map(name => {
            return caches.delete(name);
          })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(resp => {
        return (
          resp ||
          fetch(event.request).then(resp => {
            cache.put(event.request, resp.clone());
            return resp;
          })
        );
      });
    })
  );
});
