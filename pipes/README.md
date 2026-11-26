# Pipe Reference

Offline phone reference for pipe sizes and couplings. It is the sister app to **Flange ID** (the site root `../`).
It is plain HTML, JS and SVG with no build step, and it works offline once opened online (service worker), or as one file
(`pipe-reference-standalone.html`).

## What it does
- **By size**: pick a DN (15–1200) to get every material, standard and class at that size, with OD, wall and nominal ID
  (= OD − 2 × wall). Plastics are OD-sized. They show **≈DN** for the usual equivalent-bore PE size (HK WSD table) and
  **~DN** where the OD is within 10 % of the steel OD for that DN. Tap a row to get:
  - a scaled cross-section (with the EN 545 cement lining for ductile iron)
  - the material's coatings, linings and suitability ratings
  - every coupling and flange adaptor whose published range covers that OD
- **Couplings**: enter a measured OD and material, optionally with a second pipe. For two pipes it shows:
  - the OD difference
  - wide-range couplings whose single range spans both pipes
  - the Teekay Axiflex stepped band
  - the flange-adaptor options for each pipe
- **Common in UK** (on by default, remembered as `pipeRef.ukCommon`): hides US-standard tables (ASME B36.10 / B36.19) across
  By size, Couplings and Browse. A count shows how many non-UK sizes are hidden; turn it off to see them with a badge.
  Typed coupling ODs still match even when the lists are filtered.
- **Browse**: search all rows (e.g. `SDR11`, `C40`, `114.3`), filter by material and by service (e.g. drinking water, good
  only), plus a materials × services grid.

## Files
| File | What |
|---|---|
| `pipe-data.js` | **All numbers**, each series and product citing `sources` (URLs). Global `PIPE_DATA`. |
| `pipe-logic.js` | Flattening rows, DN logic, filters, coupling matching and two-pipe logic. Global `PipeLogic`. |
| `pipe-drawing.js` | Cross-section and two-pipe SVGs. Global `PipeDrawing`. |
| `index.html` | Screen code. CSS scoped to `.pr-app`, ids `pr-*`, one global `PipeUI`, storage keys `pipeRef.*`. |
| `sw.js` / `manifest.json` / `icons/` | PWA. The cache is `pipe-ref-v1`, and it only touches `pipe-ref-*` caches and its own files. |
| `tests.js` | `node tests.js`: data sanity, spot checks, coupling and two-pipe logic, namespacing. |
| `build-standalone.js` | `node build-standalone.js` writes `pipe-reference-standalone.html`. |

**Changed a file?** Bump `CACHE` in `sw.js`, run `node tests.js`, then `node build-standalone.js`.

## Data rules
- Values were copied from the cited standard extracts and maker datasheets or pages (read 26 Nov 2026). Nothing is interpolated.
- `unverified` rows show **⚠** with a reason. These cover a doubtful scan, sources that disagree, or a derived wall.
- Where no reliable wall exists, the row is OD only (wall `null`, ID “—”). This applies to EN 10220, GRP, imperial CI/AC,
  metric AC and BS 3505.
- Concrete has no dimension rows, because ODs vary by maker.
- Suitability ratings are **general guidance**. They are not approvals. Always check the maker's data and the WRAS / Reg 31 listing.
- Coupling ranges come from VJ datasheets, AVK UK product pages, and the Straub / Teekay datasheets (parsed from the PDFs).
  Material ratings are the makers' own statements. "Not listed" means the maker does not mention that material.
