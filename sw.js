/* sw.js — the "service worker" that makes the hosted web app work offline.
 * The first time the page is opened online, the browser saves every file
 * below. After that it answers from that saved copy, so no signal is needed.
 * CHANGED A FILE? Bump the version number so phones fetch the new copy.
 */
const CACHE = 'flange-id-v2';
const FILES = [
  './', './index.html', './manifest.json',
  './flange-data.js', './flange-logic.js', './flange-drawing.js', './flange-browse.js',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-192.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];
// Full URLs of our own files. Anything else (e.g. the Pipe Reference app in
// pipes/, which has its own service worker) is left alone.
const OWN = new Set(FILES.map((f) => new URL(f, self.registration.scope).href));

// Install: download and save all the files.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Activate: delete saved copies from older versions of THIS app only.
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('flange-id-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Our own files: use the saved copy if we have it, otherwise the network.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (!OWN.has(u.origin + u.pathname)) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: true }))
    .then((hit) => hit || fetch(e.request)));
});
