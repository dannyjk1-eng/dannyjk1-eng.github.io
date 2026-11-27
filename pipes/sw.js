/* sw.js — Pipe Reference offline support (scope: this folder only).
 * The first time the page is opened online, the browser saves every file
 * below. After that it answers from that saved copy, so no signal is needed.
 * CHANGED A FILE? Bump the version number so phones fetch the new copy.
 * Only touches caches named 'pipe-ref-*' so it never deletes Flange ID's.
 */
const CACHE = 'pipe-ref-v5';
const FILES = [
  './', './index.html', './manifest.json',
  './pipe-data.js', './pipe-logic.js', './pipe-drawing.js',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-192.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];
const OWN = new Set(FILES.map((f) => new URL(f, self.registration.scope).href));

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pipe-ref-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Only answer for our own files; everything else goes to the network untouched.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (!OWN.has(u.origin + u.pathname)) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: true }))
    .then((hit) => hit || fetch(e.request)));
});
