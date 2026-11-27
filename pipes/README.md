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

## DN versus outside diameter (v5)
Metric PVC, ABS and PE are designated by **nominal outside diameter** (dn / d), not by steel DN.
**d25 = 25 mm OD**, which is the usual match for steel/valve **DN20**. Steel **DN25** is 33.7 mm OD (1"); the usual metric plastic is **d32 (32 mm OD)**.

This is not an error in the tables — the OD figures were already correct (EN 1452 / ISO 161-1 / Durapipe: 25 mm pipe has a 25.0 mm minimum mean OD). The By-size picker used the steel DN ladder, so choosing “DN 25” listed the 32 mm plastic (the usual steel equivalent) and hid 25 mm OD under “DN 20”. That was confusing.

- Under **Plastics**, the size list is now by OD: `d25 (25 mm OD) ≈ DN20`. Searching **25**, **d25** or **25 mm** finds the 25 mm OD pipe.
- Under **All**, the picker is still by steel DN, but plastic rows are labelled `d32 (32 mm OD) ≈ DN25`, and a note explains the difference with a jump to the 25 mm OD size.
- Browse search: `d25` matches 25 mm OD; `dn25` matches the steel-DN grouping; a bare `25` still matches either.
- Sources: ISO 161-1:2018, ISO 1452-1:2009 cl. 3.1.2, ISO 6708:1995, Durapipe PVC-U specification guide, FIP/GF valve tables (d 25 = DN 20, d 32 = DN 25).

## Material family filter and Plastics tab (v4)
- **Working on… All / Plastics / Metals** (second bar, under *Common in UK*), remembered as `pipeRef.family` and `pipeRef.familySub`.
  It combines with the UK toggle and applies to **By size** (rows and the DN list), **Couplings** (material lists, and products that list no
  pipe of that family are hidden — e.g. PE-only AVK 621 / 623 and AquaFast under Metals), **Browse** and the materials grid.
  - **Plastics** = PE, PVC-U (pressure, sewer, soil), ABS (pressure, waste) and GRP (glass-reinforced *thermoset* plastic). Chips: PVC · ABS · PE · GRP.
  - **Metals** = carbon steel, stainless, ductile iron (water + sewer) and cast iron. Chips: Steel · **Galvanised** · Stainless · Iron.
    Galvanised is a finish: it selects the EN 10255 tube series (supplied black or hot-dip galvanised, same sizes) and adds a galvanised note
    (EN 10240 zinc ≥ 400 g/m², not above 60 °C, not with copper alloys, thread only, WRAS is per product). No copper data yet.
  - Asbestos cement, clay and concrete are neither, so they only show under **All**.
- **Plastics tab** (hidden under Metals): metric / imperial switch and PVC / ABS switch. One card per system with uses, joining, cement, temperature,
  WRAS, and a phone-width table of OD, minimum wall and nominal ID per class. Includes a warning that PVC-U and ABS use **different solvent cements**
  and an inch-vs-metric table (only 2½"/75 mm and 5"/140 mm interchange).
  - PVC-U: EN 1452 metric (PN10/PN16, now from 20 mm), BS 3505 / 3506 imperial Classes B, C, D, E, 7 (all sizes ½"–12"), ASTM D1785 Sch 40 / 80, EN 1401 sewer, EN 1329 soil 82/110/160.
  - ABS: BS 5391 imperial Classes C, D, E, T; ISO 15493 metric PN10 (and PN8 315 mm); EN 1455 waste 32/40/50 (OD 36/43/56!).

### Plastics cross-check against a retailer table (27 Nov 2026)
The Plastic Pipe Shop table was used as a SECONDARY check only. Primary sources: Durapipe PVC-U and SuperFLO ABS specification guides, BS 3505 tables
(National Plastic, Zenith), EN 1452 (Engineering ToolBox), Wavin and FloPlast data sheets, Harvel / GF for ASTM. Differences:
| Item | Retailer | App (primary) |
|---|---|---|
| BS 3505 Class E 2½" wall | 5.6 | 4.8 |
| BS 3505 Class C 2½" wall | 3.6 | 3.0 |
| BS 3505 Class E 6" wall | 12.1 | 10.8 min (Durapipe nominal 11.7) |
| BS 3505 Class E 8" wall | 14.1 | 12.6 min |
| "Class C" ½"–1" (1.7 / 1.9 / 2.2) and 1½" (2.5) | listed as Class C | no Class C below 2"; these are Class E (½"–1") and Class D (1½") |
| "Class C" 1¼" 2.2 | Class C | Class D |
| EN 1452 32 mm 10 bar wall | 1.8 | 1.6 |
| EN 1452 20 mm / 25 mm 10 bar wall | 1.0 / 1.25 | EN 1452 lists no PN10 for 20 / 25 mm (PN16: 1.5 / 1.9) |
| EN 1452 16 mm 10 bar | 1.5 | EN 1452 lists 16 mm only at PN20 (1.5) — not included |
| Class 7 ¾" ID | 14.1 | 18.8 (retailer typo; wall 3.9 matches) |
| 1" OD 33.4, 8" OD 219.1 | | within the BS 3505 mean-OD bands (33.4–33.7, 218.8–219.4), not an error |
| Sch 40 IDs (1½" 40.9, 2" 52.5) | | same as OD − 2 × min wall; Harvel's average IDs are 40.4 / 52.0 |
All other retailer figures agree.

## Files
| File | What |
|---|---|
| `pipe-data.js` | **All numbers**, each series and product citing `sources` (URLs). Global `PIPE_DATA`. |
| `pipe-logic.js` | Flattening rows, DN logic, filters, coupling matching and two-pipe logic. Global `PipeLogic`. |
| `pipe-drawing.js` | Cross-section and two-pipe SVGs. Global `PipeDrawing`. |
| `index.html` | Screen code. CSS scoped to `.pr-app`, ids `pr-*`, one global `PipeUI`, storage keys `pipeRef.*`. |
| `sw.js` / `manifest.json` / `icons/` | PWA. The cache is `pipe-ref-v5`, and it only touches `pipe-ref-*` caches and its own files. |
| `tests.js` | `node tests.js`: data sanity, spot checks, coupling and two-pipe logic, namespacing. |
| `build-standalone.js` | `node build-standalone.js` writes `pipe-reference-standalone.html`. |

**Changed a file?** Bump `CACHE` in `sw.js`, run `node tests.js`, then `node build-standalone.js`.

## Data rules
- Values were copied from the cited standard extracts and maker datasheets or pages (read 26 Nov 2026). Nothing is interpolated.
- `unverified` rows show **⚠** with a reason. These cover a doubtful scan, sources that disagree, or a derived wall.
- Where no reliable wall exists, the row is OD only (wall `null`, ID “—”). This applies to EN 10220, GRP, imperial CI/AC
  and metric AC (BS 3505 now has walls).
- Concrete has no dimension rows, because ODs vary by maker.
- Suitability ratings are **general guidance**. They are not approvals. Always check the maker's data and the WRAS / Reg 31 listing.
- Coupling ranges come from VJ datasheets, AVK UK product pages, and the Straub / Teekay datasheets (parsed from the PDFs).
  Material ratings are the makers' own statements. "Not listed" means the maker does not mention that material.
