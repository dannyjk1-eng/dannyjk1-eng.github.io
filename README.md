# Technician Tools

Small offline reference apps for technicians, hosted on GitHub Pages at https://dannyjk1-eng.github.io/

| Folder | App | Notes |
|---|---|---|
| `/` (`index.html`) | **Technician Tools hub** | A plain page with one card per app. No manifest and no service worker, so it can't be installed and never takes over the apps' scopes. |
| `flange/` | **Flange ID** | Identify flanges, browse EN 1092 / BS 10 / ASME, flange adapters and converters. Own manifest (`id` `/flange/`, scope `/flange/`) and service worker (`flange-id-v3`). |
| `pipes/` | **Pipe Reference** | Pipe sizes, materials and couplings. Own manifest (scope `/pipes/`) and service worker (`pipe-ref-*`). |

Each app is installed on its own from its own page. Never give the root a manifest or a caching service worker: a manifest at `/` would claim every folder below it and stop the other apps installing separately.

`sw.js` at the root is a **clean-up worker** for phones that had the old root-scoped Flange ID: it deletes the old `flange-id-v1`/`flange-id-v2` caches, unregisters itself and reloads open pages. It can be removed once nobody is likely to still have the old version (a few months).

To add an app: make a new folder with its own `index.html`, `manifest.json` (relative `start_url` and `scope`, a distinct `id`), `sw.js` (own cache prefix, scope = its folder) and icons, then add a card to the root `index.html`.
