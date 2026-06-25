const CACHE_NAME = 'ceypeepung-premium-bio-v1';
const CORE_ASSETS = ['/', 'index.html', 'admin.html', 'styles.css', 'user.js', 'admin.js', 'manifest.webmanifest', 'favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('firebaseio.com')) return;
  event.respondWith(fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(req).then(cached => cached || caches.match('index.html'))));
});
