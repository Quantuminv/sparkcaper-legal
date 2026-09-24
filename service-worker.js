const VERSION = 'e5c53c4d30585716';
const CACHE = `doppia-scelta-${VERSION}`;
const ASSETS = ["./index.html","./style.css","./main.js","./manifest.webmanifest","./icon.svg","./privacy.html","./support.html","./_redirects","./_headers","./robots.txt"];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('doppia-scelta-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request)
    .then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    })
    .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html'))));
});

