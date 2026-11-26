# Flange Identifier

> **Where it lives:** the hosted copy is in the `flange/` folder of the site (https://dannyjk1-eng.github.io/flange/). The site root is the Technician Tools hub. Run `node tests.js` and `node build-standalone.js` from inside this folder.

A small offline web app for identifying an unknown pipe flange on site. You type in whatever you could measure (OD, bolt count, bolt spacing, hole size and so on) and it gives you a ranked list of likely flanges, each with its standard, DN/NPS and PN/class/table. It also shows the full standard dimensions, a suggested bolt length and a gasket size for each one.

## Files

| File | What it is |
|---|---|
| `index.html` | The screen: layout, styling, and the code that reads inputs and draws results |
| `flange-data.js` | **All the flange tables.** Pure data, heavily commented. This is the file to extend |
| `flange-drawing.js` | Draws the flange picture (face view and side view) as an SVG, to scale |
| `flange-browse.js` | The "Browse standards" reference catalogue: drop-downs, details, range table, compare |
| `flange-adapters.js` | The "Adapters" tab: compare two flanges' drilling, the verdict, and the product finder |
| `flange-adapters-data.js` | **The conversion products** (AVK, Viking Johnson, Cascade, EPE ...) with sizes, ratings, source URLs and ⚠ flags. Add products here |
| `flange-logic.js` | The matching engine: geometry, tolerances, scoring, bolt length, gasket |
| `tests.js` | Automated checks. Run with `node tests.js` |
| `build-standalone.js` | Run `node build-standalone.js` to make the single-file version |
| `flange-identifier-standalone.html` | Everything in one file. Copy it to a phone or email it and it works offline |
| `FlangeID.apk` | **The Android app.** Install it on the phone (see "Android app" below) |
| `rebuild-apk.sh` | One command to make a new `FlangeID.apk` after changing anything |
| `android/` | The Android app source: manifest, one Java file (`MainActivity.java`), icons, build script |
| `android-signing/` | The app's signing key and its passwords. **Back this up.** Without it, updates won't install over the old app |
| `manifest.json`, `sw.js`, `icons/` | Web-app (PWA) files, so a hosted copy can be installed with "Add to Home screen" and works offline |
| `screenshot.png` | What the app looks like with the built-in example loaded |
| `screenshot-drawing-desktop.png` | The drawing on a desktop browser, example loaded |
| `screenshot-browse-desktop.png` | Browse standards mode, EN 1092-1 PN16 DN100 selected, desktop |
| `screenshot-browse-mobile.png` | The same on a ~400px wide phone screen |
| `screenshot-drawing-mobile.png` | The drawing on a ~400px wide phone screen |

**To use it:** open `index.html` (or the standalone file) in any browser. You don't need to install anything or be online. Add `#example` to the end of the address to load a worked example. Add `#browse` to open the Browse standards tab, or `#browse=EN1092-1_PN16_100` to open it on one size.

## Android app (FlangeID.apk)

`FlangeID.apk` is a tiny Android app (about 110 kB). It shows this web app from files packed inside it. It has **no internet permission**, so it works completely offline. localStorage still works, so it remembers your last tab and selection.

**Install on the phone:**
1. Copy `FlangeID.apk` to the phone, or download it from the chat.
2. Tap the file in the Files or Downloads app.
3. Android will ask to allow installs from that app (Chrome, Files...). Tap **Settings**, turn on **Allow from this source**, then go back.
4. Tap **Install**. If Play Protect warns about an unknown app, tap **More details**, then **Install anyway**. It warns because the app isn't from the Play Store.
5. Open **Flange ID** from the app drawer.

**How it's built:** `android/` is a minimal native app. `MainActivity.java` is one full-screen WebView that loads `file:///android_asset/index.html`, with JavaScript and DOM storage turned on. `android/build-apk.sh` uses the Android SDK tools directly (aapt2, javac, d8, zipalign, apksigner), so no Gradle or Android Studio is needed. It needs JDK 17+ and the SDK at `/opt/android-sdk`, with `platforms;android-34` and `build-tools;34.0.0`. The app uses minSdk 24 (Android 7.0) and targetSdk 34.

**After changing the web files, rebuild with one command:**

```
bash rebuild-apk.sh
```

That runs the tests and adds 1 to `versionCode` (versionName becomes 1.1, 1.2...). It then rebuilds the standalone HTML, copies it into the app as `assets/index.html`, and builds and signs `FlangeID.apk`. Install the new file over the old one; your saved settings stay.

- Signing uses `android-signing/flangeid.keystore`, with its passwords in `android-signing/keystore.properties`. **Every update must be signed with this same key**, or Android refuses to install it over the existing app. You would have to uninstall first. The build script will never make a new key on its own. Back up that folder.
- `android/build-apk.sh` on its own rebuilds **without** bumping the version.
- `android/make-icons.py` redraws the launcher icon (and the web-app icons) if you want to change it.

## Web app (PWA) for later

`manifest.json`, `sw.js` and `icons/` make the separate-file version installable once it is put on any HTTPS web host (GitHub Pages, Netlify...). Open the link in Chrome, then tap **Install app** / **Add to Home screen**. The service worker saves every file on the first visit, so it then works offline. When you change a file, bump `CACHE` in `sw.js` (e.g. `flange-id-v2`) so phones pick up the new copy. The service worker is skipped for `file://` and inside the Android app, which are offline already.

## How it works

1. **Data → objects.** `expandTables()` turns each compact data row (for example `[100, 220, 180, 8, 18, 'M16', …]`) into an object such as `{dn: 100, od: 220, pcd: 180, n: 8, …}`. Inch tables are converted to mm at this point, so everything inside the app is in mm.
2. **Bolt spacing → PCD.** Bolts are equally spaced, so the straight-line distance between two adjacent bolt centres (the chord) is
   `chord = PCD × sin(180° / n)`, which gives `PCD = chord / sin(180° / n)`.
   Example: 8 bolts and a 68.9 mm chord give 68.9 / sin(22.5°) = 180 mm, which is DN100 PN16.
   If you don't enter a bolt count, each candidate flange is checked using its own bolt count.
3. **Scoring.** `scoreFlange()` compares each measurement with the standard value:
   - Each field has a **tolerance**: OD ±(3 mm + 0.5 %), PCD/chord ±(2 mm + 0.3 %), hole ±1.5 mm, bolt ±1.2 mm. Thickness is lopsided: up to 4 mm thinner (corrosion) or 3 mm thicker (paint, raised face). The Tight/Normal/Loose buttons scale all of these by 0.6, 1 or 1.6.
   - Inside tolerance a field scores 1.0, sliding to 0.7 at the tolerance limit. It then drops to 0 at three times the tolerance.
   - Fields are **weighted**: PCD/chord 4, bolt count 4, OD 3, hole 2, bolt size 2, pipe OD 1.5, thickness 1, raised face 1.
   - A wrong bolt count multiplies the score by 0.6. Each other field more than 1× outside tolerance costs 7 %, and more than 2× costs 20 %.
   - Every comparison is written out as a ✓ / ~ / ✗ line, so you can see *why* a flange matched or didn't.
4. **Identical drillings.** Flanges with the same OD, PCD and bolt count (for example EN 1092-1 PN10 and PN16 up to DN150) are shown together as one result with an explanation. **A tape measure cannot tell these apart.** Look for the PN marking cast or stamped on the flange, valve body or nameplate, or check the asset records. If it's still unknown, treat it as the lower rating. Bolt holes in cast/ductile iron (EN 1092-2) are 1 mm bigger than in steel (19 vs 18 mm for M16), which can hint at the material.
5. **Extras.**
   - Bolt length ≈ 2 × flange thickness + 3 mm gasket + 2 washers + nut (0.8 d) + 2–3 threads (0.3 d), rounded up to the next 5 mm.
   - The IBC gasket OD is taken as PCD − hole diameter. For EN 1092 this gives the EN 1514-1 size (for example DN100 PN16: 180 − 18 = 162 mm).

## Adapters mode (flange converters and compatibility)

The **🔌 Adapters** tab compares any two flanges (A and B, from the same tables as everything else). It shows OD, PCD, bolt count, bolt-hole diameter and bolt size side by side, then gives one of three verdicts:

- **✓ Identical drilling**: same bolt count and PCD (within 0.5 mm). Bolt up directly.
- **~ Bolts will fit**: same bolt count, PCD a little different, but a bolt still passes through *both* sets of holes. The app works out the biggest bolt that fits through both holes (the overlap of two circles) and says if it is smaller than the bolt the flanges are designed for, or only just fits (under 2 mm to spare).
- **✗ Not compatible**: different bolt count, or the holes are too far apart for the bolt. An adapter is needed.

An overlay drawing puts both bolt circles on top of each other (A blue, B orange) with a zoomed view of one hole pair. Below that are the real conversion products that bridge the pair, taken from the makers' own pages and datasheets, each with its source link: stock flange converters (AVK 209/30 and 209/36), dual-drilled adaptors that bolt to either flange (Viking Johnson MaxiDaptor, AVK 603/A-003, AVK hydrants) and made-to-order converters (EPE, Cascade, Castings Services, Teekay). Products are only matched when the datasheet says they cover that exact pair of drillings; anything uncertain carries a ⚠.

Quick presets cover Table D → PN16 (DN80 to DN200), PN10 → PN16 (DN200 and up) and ANSI 150 → PN16. Every Identify result has a **⇄ Compare with… / adapters** button. Links: `#adapters` opens the tab, `#adapters=BS10_D_6,EN1092-1_PN16_150` opens it on a pair. Code: `flange-adapters.js` (pure functions first, screen code last, like `flange-browse.js`) and `drawOverlay()` in `flange-drawing.js`.

To add a product, copy one in `flange-adapters-data.js`. Use the flange ids from `flange-data.js`, put the maker's page in `sources`, and write anything you could not confirm into `flags`. `node tests.js` checks every id exists.

## Browse standards mode

The **📖 Browse standards** tab at the top is a reference catalogue. You don't need to measure anything to use it. The code is in `flange-browse.js`, and it reuses the same data, maths and drawing as Identify mode.

- **Standard / rating** drop-down: grouped as EN 1092-1 steel PN6–40, EN 1092-2 iron PN6–40, BS 10 Tables D/E/F, and ASME Class 150/300. The quick buttons jump straight to PN16, PN10, Table D, Table E or Class 150.
  - When you switch standard, the app keeps the nearest size. For example, PN16 DN100 → Table D gives 4".
- **Size** drop-down, with **‹ ›** buttons to step through the sizes.
- **Details card:** the full dimensions, flange thickness by type, bolt-length and gasket estimates, notes and sources. It also shows:
  - any ⚠ unverified flags;
  - **Same drilling as:** flanges from any standard that bolt straight on, e.g. PN10 = PN16 up to DN150, or ASME 4" Class 150 and BS 10 Table F 4";
  - **Looks similar but is NOT the same drilling:** same bolt count with a PCD within 4 mm. This is the classic site trap, e.g. BS 10 Table E 4" (177.8 PCD) against PN16 DN100 (180 PCD).
  - Tap any of these to compare.
- **Drawing:** the same to-scale SVG as Identify mode, with no site values.
- **Compare with:** pick a second standard and size to see two flanges side by side. Values that differ are highlighted, and a one-line verdict says whether they bolt together.
- **All sizes** table: the whole range for the chosen standard, with the selected row highlighted. Tap a row to select it.
- The last tab, selection, compare and inch setting are saved in the browser's `localStorage`, so the app opens where you left it.

How the code is laid out: the top half of `flange-browse.js` is **pure functions** that turn data into HTML text (`browseSizes`, `browseDetailsHTML`, `browseRangeHTML`, `compareHTML`, `sameDrillingAs`, `lookAlikes`). That means `tests.js` can check them in Node. The bottom half, `initBrowse()`, connects them to the drop-downs and buttons.

## How the drawing works

The drawing lives in `flange-drawing.js`. Its main function, `drawFlange(flange, options)`, **builds the SVG as a text string**. Because of that, `tests.js` can check it in Node without a browser. `index.html` then puts the string into the `#drawing` box.

- **Coordinates:** the SVG uses `viewBox="0 0 640 H"`. Everything is drawn in those units, and the browser scales it to the screen. The flange's OD becomes a circle of radius `R`, so 1 mm = `R / (OD/2)` units. That keeps the PCD, holes, raised face and bore in true proportion: the picture is drawn to scale.
- **Face view:**
  - The outside disc.
  - The raised face ring.
  - The bore, drawn at the pipe OD.
  - Centre lines.
  - The PCD as a dashed circle.
  - `n` bolt holes at the correct diameter. Holes straddle the centrelines (normal flange practice), so hole `i` sits at `(i + 0.5) × 360/n` degrees from 12 o'clock (`fdHoleAngles`).
  - The orange line between the two top holes is the **chord** you measure on site: `PCD × sin(180°/n)`.
  - Dimension lines and labels for OD, PCD, holes (n × Ø, bolt size), raised face and pipe OD.
- **Side view:** a bolted joint, drawn top to bottom: bolt head, this flange (with its raised face where there is one), a 3 mm gasket, the mating flange (dashed), then nut and bolt end. It is labelled with the thickness and the estimated bolt/stud length from `boltLength()`.
  - EN 1092 thicknesses *include* the raised face.
  - ASME B16.5 thicknesses *exclude* it (the 1/16" raised face is added on top).
- **Raised face height (`fdRaisedFaceHeight`):**
  - EN 1092-1 uses Table 8 f1: 2 mm up to DN32, 3 mm up to DN250, 4 mm up to DN500, then 5 mm.
  - ASME uses 1.6 mm (1/16").
  - BS 10 and cast iron flanges are drawn flat-faced.
- **Colours:** each label shows the standard value (plus inches with "Also show inch values" or for imperial standards). If you measured that value, the site figure is shown underneath, coloured from the match checks in `flange-logic.js`:
  - green ✓ = within tolerance
  - amber ~ = close
  - red ✗ = outside
- **Phones:** if the drawing box is narrower than 520 px, `compact` mode uses bigger text and a slightly smaller circle, so labels stay readable on a phone. The drawing redraws when the window is resized.
- **Choosing what to draw:** the top match is drawn automatically. Tap **✎ Draw** on any result to draw that flange instead. Changing a measurement goes back to drawing the top match.
- **Tests:** `tests.js` checks that the right number of bolt holes is drawn (4, 8, 12, 24 and 48 hole flanges, in both desktop and phone modes). It also checks that a good site OD comes out green and a wrong one red.
- **Browse tests:** every standard is listed with all its sizes. EN PN16 DN100 shows OD 220, PCD 180 and 8 × M16. BS 10 Table D 4" shows 4 × 5/8" with its ⚠ flag. The tests also cover prev/next, the selected-row highlight, and both compare verdicts.

## Standards and sizes covered (342 sizes)

| Table | Sizes |
|---|---|
| EN 1092-1 steel PN6 | DN15–DN1200 |
| EN 1092-1 steel PN10, PN16 | DN15–DN2000 |
| EN 1092-1 steel PN25 | DN15–DN1000 |
| EN 1092-1 steel PN40 | DN15–DN600 |
| EN 1092-2 cast/ductile iron PN6 | DN15–DN1200 |
| EN 1092-2 PN10, PN16 | DN40–DN2000 |
| EN 1092-2 PN25 | DN40–DN1000 |
| EN 1092-2 PN40 | DN40–DN600 |
| BS 10 Table D, E | 1/2"–24" (including 3 1/2", 7", 9", 15") |
| BS 10 Table F | 1/2"–24" |
| ASME B16.5 Class 150, 300 | 1/2"–24" |

BS 4504 is covered through the EN 1092 tables, because it has the same mating dimensions (`aliases` in the data).

## Adding a new standard

1. Open `flange-data.js` and copy a whole table object, from `{` to `},`. Pick one with the same unit, for example an EN table for mm or a BS 10 table for inches.
2. Give it a new `id`, `family`, `rating` and `material`.
3. Set `columns` to match your numbers, then type one row per size. Use `null` when the standard gives no value, and **never guess**.
4. Add `sources`. Add `unverified: { size: 'reason' }` for any row you couldn't cross-check; it shows as ⚠ in the app.
5. Run `node tests.js`, then `node build-standalone.js`. The matcher picks the new table up automatically.

## Data sources

- **EN 1092-1:2018** (BS EN 1092-1:2018) Tables 8 and 11–15: D, K, L, n, bolt, thicknesses and raised face d1. Cross-checked against Zickwolff (zickwolff.de) and S.K. Fitting Valve (skfitting.com): all 101 overlapping rows matched with **0 differences**. The PN16 table was also checked against RoyMech.
- **BS EN 1092-2:1997** Tables 7–11: cast iron D, K, L, n, bolt and ductile iron thickness. DN50–600 for PN10/16/25 was cross-checked against TPMC Steel's EN 1092-2 tables (all agree). The ductile iron ODs of 400 mm at DN250 and 455 mm at DN300 are included.
- **EN 545:2010** Table 16: ductile pipe DE. Cross-checked against Electrosteel and APS Romania.
- **BS 10:1962** Tables D/E/F as reproduced by Evenort Ltd / Hilton Metal Forgings. Cross-checked against Inflow UK's BS 10 table, with Complete Stainless as a third check.
- **ASME B16.5** Class 150/300: pipedata.org weld neck tables, cross-checked against S.K. Fitting Valve and the Fluidcon catalogue.

### Values that could not be fully verified (shown with ⚠ in the app)

- **BS 10 7", 9" and 15"** (Tables D and E) come from one source (Inflow UK). Their hole sizes are inferred from the metric bolt that source lists.
- **BS 10 3 1/2"** (Tables D, E and F) comes from one source (Evenort).
- **BS 10 bolt counts:** Complete Stainless disagrees with the other two sources on Table D 4", 10" and 18" and Table E 4" and 10". The majority value is used.
- **BS 10 typos in Inflow UK:** Table E 8" OD (13 3/4" printed; 13 1/4" used) and Table F 20" thickness (1" printed; 2" used) are treated as typos.
- **EN 1092-2:**
  - DN700+ for PN10/16/25 comes from the 1997 standard only. D, K, n and bolt agree with EN 1092-1.
  - All of PN6 and PN40 iron, and DN60, are single-source. The PN6 thickness column (grey vs ductile iron) is uncertain.
  - The raised face diameter is assumed to be the same as EN 1092-1.
  - The 2023 edition of EN 1092-2 was not checked.
- **Thickness in general** depends on the flange type, material and standard edition. ASME values exclude the 1.6 mm raised face (2003+ editions), so older flanges can be about 1.6 mm thicker.
- **Bolt lengths and gasket sizes** are estimates. Check them before ordering.

**For guidance only.** Before ordering parts or working on pressurised plant, confirm against the current standard, the manufacturer's drawing or the asset record.
