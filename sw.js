const CACHE_NAME = 'day-routine-v40';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    if (url.protocol === 'chrome-extension:') return;
    e.respondWith(
        caches.match(e.request)
            .then(r => r || fetch(e.request).then(resp => {
                if (resp.status === 200 && url.protocol.startsWith('http')) {
                    const clone = resp.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                }
                return resp;
            }))
            .catch(() => caches.match('./index.html'))
    );
});
