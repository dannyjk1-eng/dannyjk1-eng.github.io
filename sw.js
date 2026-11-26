/* sw.js — CLEAN-UP WORKER for the site root. It does no caching at all.
 * ---------------------------------------------------------------
 * Flange ID used to live at the site root, so phones that visited it
 * have an old service worker registered here (scope "/") and an old
 * saved copy of the page in a cache called flange-id-v1 or flange-id-v2.
 * Flange ID now lives in /flange/ and the root is the Technician Tools
 * hub, so that old worker must go. When a phone fetches this file:
 *   install   -> take over straight away (skipWaiting)
 *   activate  -> delete the old root caches, unregister this worker,
 *                and reload any open page so it shows the hub, not the
 *                stale saved copy.
 * It only deletes flange-id-v1 and flange-id-v2: the new /flange/ app
 * keeps its saved copy in flange-id-v3, and /pipes/ uses pipe-ref-*.
 * The hub page does not register a service worker; this file is only
 * ever run by phones that already had the old one.
 */
const OLD_ROOT_CACHES = ['flange-id-v1', 'flange-id-v2'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all(OLD_ROOT_CACHES.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Reload only pages at the site root (the old app); leave /flange/ and /pipes/ alone.
    const root = new URL(self.registration.scope).pathname;
    for (const c of open) {
      if (new URL(c.url).pathname.startsWith(root + 'flange/') || new URL(c.url).pathname.startsWith(root + 'pipes/')) continue;
      c.navigate(c.url).catch(() => { /* page already closed */ });
    }
  })());
});
