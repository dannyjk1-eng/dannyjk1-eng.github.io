# Pipe Reference

Offline phone reference for pipe sizes and couplings. It is the sister app to **Flange ID** (the site root `../`).
It is plain HTML, JS and SVG with no build step, and it works offline once opened online (service worker), or as one file
(`pipe-reference-standalone.html`).

## What it does
- **By size**: pick a DN (15–1200) to get every material, standard and class at that size, with OD, wall and nominal ID
  (= OD − 2 × wall). Under **Plastics**, there are two size drop-downs — **Metric (outside diameter)** and
  **Imperial (nominal inch)** — so you can work in either system. Plastic labels never use an “≈ DNxx” conversion
  (25 mm pipe reads **25 mm (OD 25.0)**). In All mode, metals stay grouped by steel DN; plastic rows listed with a DN
  are labelled by their real OD. Tap a row to get:
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

## Plastic labels, metric / imperial pickers, jointing and compatibility (v6)
Metric plastic is sold by outside diameter: a 25 mm pipe is 25.0 mm OD. Steel DN25 is 33.7 mm OD.
Plastic labels, pickers, the Plastics tab and search results never show an “≈ DNxx” conversion. Typing **25**, **d25** or **25 mm** finds the 25 mm OD pipe. Under **All**, metals stay grouped by steel DN; a 32 mm plastic listed with DN25 is still labelled **32 mm (OD 32.0)**.

- Under **Plastics** (By size and the Plastics tab) there are two phone-friendly drop-downs: **Metric (OD, mm)** and **Imperial (nominal inch)**. Waste and soil sizes are labelled with their real OD (e.g. 32 mm waste (OD 36.1)).
- **Metric / imperial fit:** only 2½" / 75 mm and 5" / 140 mm have compatible ODs (Durapipe; GF). Other sizes need a purpose-made adaptor or a wide-range coupling. Sourced adaptor ranges: Durapipe PVC-U imperial/metric sockets ½"×20 to 4"×110 (PN15, including 2½"×75); SuperFLO ABS ½"×20 to 6"×160 (PN10, no 2½" or 5" — those already interchange). Do not mix metric and imperial flanges or backing rings. PVC and ABS cements are not interchangeable across a transition; Georg Fischer lists an ABS/PVC-U adaptor union in inch sizes ½"–2" PN15.
- **Jointing** (Plastics tab): a matrix of PVC-U, PVC-C, ABS, PE, PP and soil/waste against solvent-weld, ring-seal / push-fit, butt fusion, electrofusion, socket fusion, mechanical couplings, flanged stub + backing ring, and threaded (heavy wall only). Sourced cements include Durapipe PVC-U one-step and HCR-36, Tangit PVC-U / PVC-C / ABS, Griffon UNI-100 XT and FloPlast SC125/SC250, with WRAS status and cure times where published. PE and PP cannot be solvent welded.
- Sources: ISO 161-1:2018, ISO 1452-1:2009, ISO 1452-2:2009 Tables 2–3, ISO 6708:1995, Durapipe PVC-U and SuperFLO ABS specification guides, GF ABS/PVC-U union data sheet, Henkel Tangit TDS, WRAS directory section 5560 (read 27 Nov 2026).

### Retailer table re-assessment (Plastic Pipe Shop, 27 Nov 2026)
The [Plastic Pipe Shop PVC table](https://www.plasticpipeshop.co.uk/PVC-Pipe-Measurements-OD-ID-Wall_ep_53-1.html) was re-read (the page itself warns that, due to supplier shortages, walls may not match the table). Primary sources remain the standards and manufacturer datasheets. Minimum walls are never overwritten. Official **max** walls (National Plastic / Zenith BS 3505 / 3506; ISO 1452-2 Table 3 for metric PVC-U) and Durapipe **product (nom)** walls are shown alongside the min where sourced.

| Item | Retailer | Verdict |
|---|---|---|
| BS 3505 Class E 2½" wall 5.6 vs 4.8 min | 5.6 | **Error relative to the standard max.** Official max is **5.5** (National Plastic / Zenith). 5.6 is 0.1 mm above max. Durapipe does not list 2½" Class E. Min 4.8 / max 5.5 shown; row stays ⚠. |
| BS 3505 Class C 2½" wall 3.6 vs 3.0 min | 3.6 | **Error relative to the standard max (3.5).** 3.6 is 0.1 mm above max. Min 3.0 / max 3.5 shown; row stays ⚠. |
| BS 3505 Class E 6" wall 12.1 vs 10.8 min | 12.1 | **In-band, not a max or a Durapipe nominal.** Official max **12.5**; Durapipe product wall **11.7**. 12.1 sits inside 10.8–12.5, so it is cited in the notes as corroborating that walls are thicker than the min. No ⚠. |
| BS 3505 Class E 8" wall 14.1 vs 12.6 min | 14.1 | **In-band.** Official max **14.5**. Durapipe does not list 8" Class E. 14.1 is inside 12.6–14.5. No ⚠. |
| “Class C” on ½"–1½" | listed as Class C | **Labelling error.** No Class C exists below 2". Those walls are Class E (½"–1") and Class D (1¼"–1½"). Not added as Class C. |
| EN 1452 32 mm PN10 wall 1.8 vs 1.6 min | 1.8 | **In-band typical / mid-range, not the minimum.** ISO 1452-2 Table 3 max for 1.6 mm is **2.0**. Durapipe’s ID table uses the 1.6 min. Min 1.6 / max 2.0 shown. No ⚠. |
| EN 1452 20 / 25 mm (and 16 mm) at 10 bar | 1.0 / 1.25 / 1.5 | **Error.** ISO 1452-2 Table 2 has no PN10 for these sizes (16 mm is PN20 only; 20 / 25 mm start at PN16). Not added. |
| Class 7 ¾" ID 14.1 vs 18.9 | 14.1 | **Typo.** Wall 3.9 matches the standard min; 26.7 − 2 × 3.9 = 18.9. No ⚠ on the wall. |
| 1" OD 33.4, 8" OD 219.1 | — | Within the BS 3505 mean-OD bands. Not an error. |

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

## Files
| File | What |
|---|---|
| `pipe-data.js` | **All numbers**, each series and product citing `sources` (URLs). Global `PIPE_DATA`. |
| `pipe-logic.js` | Flattening rows, DN logic, filters, coupling matching and two-pipe logic. Global `PipeLogic`. |
| `pipe-drawing.js` | Cross-section and two-pipe SVGs. Global `PipeDrawing`. |
| `index.html` | Screen code. CSS scoped to `.pr-app`, ids `pr-*`, one global `PipeUI`, storage keys `pipeRef.*`. |
| `sw.js` / `manifest.json` / `icons/` | PWA. The cache is `pipe-ref-v6`, and it only touches `pipe-ref-*` caches and its own files. |
| `tests.js` | `node tests.js`: data sanity, spot checks, coupling and two-pipe logic, namespacing. |
| `build-standalone.js` | `node build-standalone.js` writes `pipe-reference-standalone.html`. |

**Changed a file?** Bump `CACHE` in `sw.js`, run `node tests.js`, then `node build-standalone.js`.

## Data rules
- Values were copied from the cited standard extracts and maker datasheets or pages (read 26–27 Nov 2026). Nothing is interpolated.
- `unverified` rows show **⚠** with a reason. These cover a doubtful scan, sources that disagree, or a derived wall.
- Where no reliable wall exists, the row is OD only (wall `null`, ID “—”). This applies to EN 10220, GRP, imperial CI/AC
  and metric AC (BS 3505 now has walls).
- Concrete has no dimension rows, because ODs vary by maker.
- Suitability ratings are **general guidance**. They are not approvals. Always check the maker's data and the WRAS / Reg 31 listing.
- Coupling ranges come from VJ datasheets, AVK UK product pages, and the Straub / Teekay datasheets (parsed from the PDFs).
  Material ratings are the makers' own statements. "Not listed" means the maker does not mention that material.
