// Cache offline do app. Mude a versão ao publicar alterações.
const VERSION = 'dedosolto-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/data.js', './js/audio.js', './js/pitch.js', './js/diagram.js', './js/store.js', './js/ui.js',
  './js/views/home.js', './js/views/changes.js', './js/views/barre.js', './js/views/ear.js', './js/views/tuner.js',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (pega atualizações), cache se estiver offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
