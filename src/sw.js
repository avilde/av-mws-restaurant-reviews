const CACHE_NAME = 'av-rr-static-1',
  WEB_DIR = 'public',
  cachedFiles = [
    `${WEB_DIR}/index.html`,
    `${WEB_DIR}/restaurant.html`,
    `${WEB_DIR}/css/restaurant_list.css`,
    `${WEB_DIR}/css/restaurant_details.css`,
    `${WEB_DIR}/img/1.webp`,
    `${WEB_DIR}/img/2.webp`,
    `${WEB_DIR}/img/3.webp`,
    `${WEB_DIR}/img/4.webp`,
    `${WEB_DIR}/img/5.webp`,
    `${WEB_DIR}/img/6.webp`,
    `${WEB_DIR}/img/7.webp`,
    `${WEB_DIR}/img/8.webp`,
    `${WEB_DIR}/img/9.webp`,
    `${WEB_DIR}/img/10.webp`,
    `${WEB_DIR}/img/app-logo16.png`,
    `${WEB_DIR}/img/app-logo48.png`,
    `${WEB_DIR}/img/app-logo64.png`,
    `${WEB_DIR}/img/app-logo128.png`,
    `${WEB_DIR}/img/app-logo256.png`,
    `${WEB_DIR}/img/app-logo512.png`,
    `${WEB_DIR}/js/restaurant_list.js`,
    `${WEB_DIR}/js/restaurant_details.js`,
    '/sw.js',
    '/manifest.json',
    '/favicon.ico'
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
