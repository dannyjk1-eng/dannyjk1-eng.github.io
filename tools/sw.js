/* sw.js — Technician Tools hub, offline support (scope: this folder only).
 * The first time the page is opened online, the browser saves every file
 * below. After that it answers from that saved copy, so no signal is needed.
 * CHANGED A FILE? Bump the version number so phones fetch the new copy.
 * Only touches caches named 'tech-tools-*', and never handles /flange/ or /pipes/.
 */
const CACHE = 'tech-tools-v1';
const FILES = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-192.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/flange-192.png', './icons/pipes-192.png',
];
const OWN = new Set(FILES.map((f) => new URL(f, self.registration.scope).href));

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tech-tools-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (!OWN.has(u.origin + u.pathname)) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: true }))
    .then((hit) => hit || fetch(e.request)));
});
