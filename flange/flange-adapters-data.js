/* =====================================================================
 * flange-adapters-data.js  —  CONVERSION PRODUCTS AND PRESETS
 * ---------------------------------------------------------------------
 * Pure data for the "Adapters" tab. The maths lives in flange-adapters.js.
 *
 * RULES FOR THIS FILE
 *  - Only products found on a manufacturer's or supplier's own page or
 *    datasheet (the `sources` URLs). Never guess a product or a size.
 *  - Anything not certain is written into `flags`. The app shows each
 *    flag with a ⚠, the same way flange-data.js does.
 *  - Sizes are checked 26 Nov 2026. Ranges change: confirm with the
 *    maker before ordering.
 *
 * HOW A PRODUCT SAYS WHAT IT FITS
 * Flanges are named by their id in flange-data.js, e.g.
 * 'EN1092-1_PN16_150' (DN150 PN16) or 'BS10_D_6' (6" Table D).
 *
 *   kind 'converter'  a flange-to-flange piece. `pairs` lists the two
 *                     faces it joins: { a, b, ref, note }.
 *   kind 'dual'       a part whose own flange is drilled for BOTH
 *                     patterns, so it bolts to either. `sets` lists the
 *                     flanges one part is drilled for (`maybe` = the
 *                     datasheet is not specific, shown as "possible ⚠").
 *   kind 'bespoke'    made to order. `tables` lists the standards it can
 *                     be drilled to; `dn` is the size range if stated.
 * ===================================================================== */

const ADAPTER_CHECKED = '26 Nov 2026';

// Short names for the AVK UK file server and the pages we read.
const AVK_PAGE = 'https://www.avkuk.co.uk/en-gb/product-finder/couplings-adaptors/flange-adaptors/';
const AVK_FILES = 'https://files.avkvalves.com/updated-ftp/downloads/';

const ADAPTER_PRODUCTS = [
  /* ------------------------------------------------------------------
   * AVK UK — Series 209/30 flange converter. THIS is the AVK piece for
   * DN150 PN16 <-> 6" Table D (ref 209-30-15002-15206).
   * Every pair below is a line of the 209/30 datasheet (Oct 2022).
   * ------------------------------------------------------------------ */
  {
    id: 'avk-209-30', maker: 'AVK UK', name: 'Flange Converter, series 209/30', kind: 'converter',
    summary: 'Short studded body with one face drilled PN16 and the other drilled to a different size or table. Ductile iron (some sizes mild steel). Fusion-bonded epoxy, WRAS-approved coating. Made in Great Britain.',
    pressure: 'PN16 (flange drilling to EN 1092 PN16, hydraulic test 1.5 × PN). Table D / E faces keep their own, lower rating.',
    sizes: 'Datasheet lists the pairs below (DN80–DN800). Other sizes and drillings are made to order.',
    pairs: [
      { a: 'EN1092-1_PN16_50',  b: 'EN1092-1_PN16_80',  ref: '209-30-05002-08002', note: 'DN80 ⇄ DN50 PN16 · L 125 mm · 7.0 kg' },
      { a: 'EN1092-1_PN16_80',  b: 'BS10_D_2',          ref: '209-30-05107-08002', note: 'DN80 PN16 ⇄ 2" Table D/E · L 125 mm · 6.9 kg' },
      { a: 'EN1092-1_PN16_80',  b: 'BS10_E_2',          ref: '209-30-05107-08002', note: 'DN80 PN16 ⇄ 2" Table D/E · L 125 mm · 6.9 kg' },
      { a: 'EN1092-1_PN16_80',  b: 'BS10_D_3',          ref: '209-30-07607-08002', note: 'DN80 PN16 ⇄ 3" Table D/E · L 127 mm · 6.7 kg' },
      { a: 'EN1092-1_PN16_80',  b: 'BS10_E_3',          ref: '209-30-07607-08002', note: 'DN80 PN16 ⇄ 3" Table D/E · L 127 mm · 6.7 kg' },
      { a: 'EN1092-1_PN16_80',  b: 'BS10_D_3 1/2',      ref: '209-30-08002-08906', note: 'DN80 PN16 ⇄ 3½" Table D · L 127 mm · 6.9 kg' },
      { a: 'EN1092-1_PN16_80',  b: 'EN1092-1_PN16_100', ref: '209-30-08002-10002', note: 'DN100 ⇄ DN80 PN16 · L 140 mm · 16 kg (ductile iron body)' },
      { a: 'EN1092-1_PN16_80',  b: 'BS10_D_4',          ref: '209-30-08002-10206', note: 'DN80 PN16 ⇄ 4" Table D · L 127 mm · 7.9 kg' },
      { a: 'EN1092-1_PN16_80',  b: 'EN1092-1_PN16_150', ref: '209-30-08002-15002', note: 'DN150 ⇄ DN80 PN16 · L 141 mm · 17 kg' },
      { a: 'EN1092-1_PN16_80',  b: 'EN1092-1_PN16_200', ref: '209-30-08002-20002', note: 'DN80 ⇄ DN200 PN16 · L 120 mm · 25 kg' },
      { a: 'EN1092-1_PN16_100', b: 'BS10_D_4',          ref: '209-30-10002-10206 (also listed as 209-30-10206-10002)', note: 'DN100 PN16 ⇄ 4" Table D · L 125 mm · 7.6 kg' },
      { a: 'EN1092-1_PN16_100', b: 'BS10_E_4',          ref: '209-30-10002-10207', note: 'DN100 PN16 ⇄ 4" Table E · L 136 mm · 12 kg' },
      { a: 'EN1092-1_PN16_100', b: 'BS10_D_5',          ref: '209-30-10002-12706', note: 'DN100 PN16 ⇄ 5" Table D · L 138 mm · 16 kg' },
      { a: 'EN1092-1_PN16_100', b: 'EN1092-1_PN16_150', ref: '209-30-10002-15002', note: 'DN150 ⇄ DN100 PN16 · L 141 mm · 17 kg (ductile iron body)' },
      { a: 'EN1092-1_PN16_150', b: 'BS10_D_6',          ref: '209-30-15002-15206', note: 'DN150 PN16 ⇄ 6" Table D · L 165 mm · 21 kg' },
      { a: 'EN1092-1_PN16_150', b: 'EN1092-1_PN16_200', ref: '209-30-15002-20002', note: 'DN200 ⇄ DN150 PN16 · L 160 mm · 40 kg' },
      { a: 'EN1092-1_PN10_200', b: 'EN1092-1_PN16_200', ref: '209-30-20001-20002', note: 'DN200 PN10 ⇄ DN200 PN16 · L 185 mm · 5.6 kg' },
      { a: 'EN1092-1_PN16_200', b: 'BS10_D_8',          ref: '209-30-20002-20306', note: 'DN200 PN16 ⇄ 8" Table C/D · L 156 mm · 26 kg' },
      { a: 'EN1092-1_PN16_200', b: 'EN1092-1_PN16_250', ref: '209-30-20002-25002', note: 'DN250 ⇄ DN200 PN16 · L 172 mm · 37 kg' },
      { a: 'EN1092-1_PN16_200', b: 'ASME_150_12',       ref: '209-30-20002-30014', note: 'DN200 PN16 ⇄ "300 CL150" (12" Class 150) · L 160 mm · 43 kg', flag: 'The datasheet says "300 CL150". Read here as DN300 / 12" ANSI Class 150. Confirm with AVK.' },
      { a: 'EN1092-1_PN16_250', b: 'BS10_D_10',         ref: '209-30-25002-25406', note: 'DN250 PN16 ⇄ 10" Table D · L 192 mm · 43 kg' },
      { a: 'EN1092-1_PN16_300', b: 'BS10_D_12',         ref: '209-30-30002-30406', note: 'DN300 PN16 ⇄ 12" Table D · L 196 mm · 50 kg' },
      { a: 'EN1092-1_PN16_350', b: 'BS10_D_15',         ref: '209-30-35002-38106', note: 'DN350 PN16 ⇄ 15" Table D · L 216 mm · 92 kg' },
      { a: 'EN1092-1_PN10_800', b: 'EN1092-1_PN16_800', ref: '209-30-80001-80002', note: 'DN800 PN10 ⇄ DN800 PN16 · L 260 mm · 255 kg' },
    ],
    flags: ['The AVK page quotes both "DN50–DN450" and "DN50–DN1200". Only the datasheet pairs are listed here.'],
    sources: [
      AVK_PAGE + '209-30-001',
      AVK_FILES + '209-30-001_avkcms_en%20oct%2022_502386.pdf',
    ],
  },

  /* ------------------------------------------------------------------
   * AVK UK — Series 209/36: the same idea, supplied complete with gasket.
   * ------------------------------------------------------------------ */
  {
    id: 'avk-209-36', maker: 'AVK UK', name: 'Flange Converter with gasket, series 209/36', kind: 'converter',
    summary: 'As the 209/30 but supplied complete with an EPDM gasket. Mild steel (ductile iron on some sizes), epoxy coated, WRAS-approved materials.',
    pressure: 'PN16 (flange drilling to EN 1092 PN16, hydraulic test 1.5 × PN).',
    sizes: 'Datasheet (Sept 2022) lists only the pairs below.',
    pairs: [
      { a: 'EN1092-1_PN16_80',  b: 'EN1092-1_PN16_100', ref: '209-36-080-0210002', note: 'DN80 ⇄ DN100 PN16 · L 140 mm' },
      { a: 'EN1092-1_PN16_80',  b: 'EN1092-1_PN16_150', ref: '209-36-080-0215002', note: 'DN80 ⇄ DN150 PN16 · L 145 mm' },
      { a: 'EN1092-1_PN16_100', b: 'EN1092-1_PN16_150', ref: '209-36-100-0215002', note: 'DN100 ⇄ DN150 PN16 · L 145 mm' },
      { a: 'EN1092-1_PN16_100', b: 'BS10_D_4',          ref: '209-36-100-0210206', note: 'DN100 PN16 ⇄ 4" Table D (from the ref code) · L 125 mm',
        flag: 'The datasheet lists this ref with no size text. "0210206" matches the 4" Table D face of 209-30-10002-10206. Confirm with AVK.' },
    ],
    flags: [],
    sources: [
      AVK_PAGE + '209-36-001',
      AVK_FILES + '209-36-001_avkcms_en%20sept%2022_501997.pdf',
    ],
  },

  /* ------------------------------------------------------------------
   * Viking Johnson — MaxiDaptor: a wide-range flange adaptor whose cast
   * flange is multi-drilled, so it bolts to a PN10/16 OR a BS 10 flange.
   * Rows read from the datasheet table (DR10998, Oct 2024).
   * ------------------------------------------------------------------ */
  {
    id: 'vj-maxidaptor', maker: 'Viking Johnson', name: 'MaxiDaptor flange adaptor', kind: 'dual',
    summary: 'Wide-tolerance flange adaptor for plain pipe ends. The cast flange is drilled for PN10/16 and BS 10 Tables A/D/E (and ANSI) at once, so one adaptor bolts to either flange. It is NOT a flange-to-flange converter.',
    pressure: '16 bar water, 6 bar gas, vacuum to −0.8 bar. The datasheet says the drilling matches the listed standards but the rated pressure stays 16 bar.',
    sizes: 'Pipe OD 57–349 mm (DN50–DN300). Rows below. Does not resist end load: restrain the pipe.',
    sets: [
      { label: 'Pipe OD 63–85 mm, flange DN80 / 3"', yes: ['EN1092-1_PN16_80', 'BS10_D_3', 'BS10_E_3', 'ASME_150_3'] },
      { label: 'Pipe OD 107–132 mm, flange DN100 / 4"', yes: ['EN1092-1_PN16_100', 'BS10_D_4', 'BS10_E_4', 'ASME_150_4'] },
      { label: 'Pipe OD 132–158 mm, flange DN125 / 5"', yes: ['EN1092-1_PN16_125', 'BS10_D_5', 'BS10_E_5'] },
      { label: 'Pipe OD 132–158 mm, flange DN150 / 6"', yes: ['EN1092-1_PN16_150', 'BS10_D_6', 'BS10_E_6', 'ASME_150_6'] },
      { label: 'Pipe OD 158–184 mm, flange DN150 / 6"', yes: ['EN1092-1_PN16_150', 'BS10_D_6', 'ASME_150_6'] },
      { label: 'Pipe OD 189–212 mm, flange DN200 / 8"', yes: ['EN1092-1_PN10_200', 'EN1092-1_PN16_200', 'BS10_D_8'] },
      { label: 'Pipe OD 218–244 mm, flange DN200 / 8"', yes: ['EN1092-1_PN10_200', 'EN1092-1_PN16_200', 'BS10_D_8', 'ASME_150_8'] },
      { label: 'Pipe OD 243–295 mm, flange DN250 / 10"', yes: ['EN1092-1_PN10_250', 'EN1092-1_PN16_250', 'BS10_E_10'] },
    ],
    flags: [],
    sources: [
      'https://www.vikingjohnson.com/product/maxidaptor/',
      'https://www.vikingjohnson.com/wp-content/uploads/2026/07/MaxiDaptor-DS-FA-011024.pdf',
    ],
  },

  /* ------------------------------------------------------------------
   * AVK UK — Series 603/A-003 UK-version Supa flange adaptor.
   * ------------------------------------------------------------------ */
  {
    id: 'avk-603-a-003', maker: 'AVK UK', name: 'Supa flange adaptor, universal drilled, 603/A-003', kind: 'dual',
    summary: 'Flange adaptor for plain pipe ends in DN80, DN100, DN150 and DN200. Flange drilled to EN 1092-2 PN10/16 "with the addition of BS 10 or ANSI B16.1 Class 125 drillings dependent on nominal size". It is not a flange-to-flange converter.',
    pressure: '16 bar maximum working pressure, −10 °C to +70 °C.',
    sizes: 'DN80 (pipe OD 88–99), DN100 (114–123), DN150 (168–178), DN200 (219–233).',
    sets: [
      { label: 'DN80 (pipe OD 88–99 mm)', yes: ['EN1092-1_PN16_80'], maybe: ['BS10_D_3', 'ASME_150_3'] },
      { label: 'DN100 (pipe OD 114–123 mm)', yes: ['EN1092-1_PN16_100'], maybe: ['BS10_D_4', 'ASME_150_4'] },
      { label: 'DN150 (pipe OD 168–178 mm)', yes: ['EN1092-1_PN16_150'], maybe: ['BS10_D_6', 'ASME_150_6'] },
      { label: 'DN200 (pipe OD 219–233 mm)', yes: ['EN1092-1_PN10_200', 'EN1092-1_PN16_200'], maybe: ['BS10_D_8', 'ASME_150_8'] },
    ],
    flags: ['The datasheet does not say which BS 10 table (or ANSI Class 125) is drilled at each size. The Table D fit is "possible": ask AVK UK for the drilling at your size.'],
    sources: [
      AVK_PAGE + '603-a-003',
      AVK_FILES + '603-a-003_avkcms_en%202021-08-26_430215.pdf',
    ],
  },

  /* ------------------------------------------------------------------
   * AVK UK — hydrants that are dual-drilled at the inlet. Shows the
   * "no converter needed" option when the new item is a hydrant.
   * ------------------------------------------------------------------ */
  {
    id: 'avk-hydrants', maker: 'AVK UK', name: 'Clearway and squat underground hydrants (series 29/91, 29/388)', kind: 'dual',
    summary: 'Hydrant inlet flange "universally drilled" to EN 1092-2 PN10/16 and BS 10 Table D/E, DN80 and DN100 only. Shows a dual-drilled part you can use instead of a converter.',
    pressure: 'PN16.',
    sizes: 'DN80 and DN100 only (datasheet: "Double drilled PN10/16 and BS10 table D (only DN80 and DN100)").',
    sets: [
      { label: 'DN80 inlet', yes: ['EN1092-1_PN16_80', 'BS10_D_3', 'BS10_E_3'] },
      { label: 'DN100 inlet', yes: ['EN1092-1_PN16_100', 'BS10_D_4', 'BS10_E_4'] },
    ],
    flags: [],
    sources: [
      'https://www.avkuk.co.uk/en-gb/product-finder/hydrants/underground-hydrants/29-91-004',
      'https://www.avkuk.co.uk/en-gb/product-finder/hydrants/underground-hydrants/29-388-001',
    ],
  },

  /* ------------------------------------------------------------------
   * Made-to-order UK suppliers
   * ------------------------------------------------------------------ */
  {
    id: 'epe-dsc', maker: 'European Pipeline Engineering', name: 'Double Studded Flange Convertors', kind: 'bespoke',
    summary: 'Ductile iron, mild steel or stainless converter, each face drilled to a different standard. WRAS-approved coating for potable water. Bespoke drillings, countersunk holes, tapered bores and A2/A4 studs are options.',
    pressure: 'PN6 to PN40 faces listed (BS 10 Tables A–H, EN 1092-1, ISO 7005, ANSI 150/300).',
    sizes: 'DN40 to DN1200.',
    tables: ['EN1092-1_PN6', 'EN1092-1_PN10', 'EN1092-1_PN16', 'EN1092-1_PN25', 'EN1092-1_PN40', 'BS10_D', 'BS10_E', 'BS10_F', 'ASME_150', 'ASME_300'],
    dn: [40, 1200],
    flags: [],
    sources: ['https://www.epe.co.uk/products/double-studded-flange-convertors'],
  },
  {
    id: 'cascade-dsc', maker: 'Cascade Clamps UK', name: 'Studded Flange Converters', kind: 'bespoke',
    summary: 'Ductile iron or mild steel studded converter for different drillings (ISO/EN 1092, BS 4505 PN10/16, BS 10 Table D/E, ANSI/ASME B16 Class 150). WRAS EPDM gasket for drinking water. Also called change-piece adaptors, transition flanges or spiders.',
    pressure: 'Not stated.',
    sizes: '"Large range of standard sizes"; others made to order. No size list on the page.',
    tables: ['EN1092-1_PN10', 'EN1092-1_PN16', 'EN1092-2_PN10', 'EN1092-2_PN16', 'BS10_D', 'BS10_E', 'ASME_150'],
    dn: null,
    flags: ['The sizes and pressure rating are not published, and the catalogue is from 2017. Ask Cascade for the size list and rating.'],
    sources: [
      'https://pdfs.findtheneedle.co.uk/findtheneedle/pdfs/43429.pdf',
      'https://www.buildingarena.co.uk/companies/cascade-clamps-uk-limited/products/double-studded-flange-converter',
    ],
  },
  {
    id: 'castings-dsc', maker: 'Castings Services', name: 'Studded Flange Convertors (change flanges)', kind: 'bespoke',
    summary: 'Stainless studs through a metal ring set out for the two different drillings, to connect old BS 10 Table D/E pipework to PN16 (EN 1092-1). Standard sizes held; bespoke versions made in days.',
    pressure: 'Not stated.',
    sizes: '"A range of sizes and drillings". No size list on the page.',
    tables: ['EN1092-1_PN10', 'EN1092-1_PN16', 'BS10_D', 'BS10_E'],
    dn: null,
    flags: ['No size list or pressure rating on the page. Ask Castings Services.'],
    sources: ['https://www.castings-services.co.uk/pipelines-and-valves/pipes/'],
  },
  {
    id: 'cascade-xtra', maker: 'Cascade Clamps UK', name: 'Cascade Xtra universal flange adaptor', kind: 'bespoke',
    summary: 'Wide-range flange adaptor for plain pipe ends, flange drilled to BS EN 1092-2 PN10/16, ANSI (up to DN400) or BS Table D (up to DN400 except DN250). Not a flange-to-flange converter.',
    pressure: 'PN10 and PN16.',
    sizes: 'Flange drilling options to DN400 (Table D not at DN250).',
    tables: ['EN1092-1_PN10', 'EN1092-1_PN16', 'EN1092-2_PN10', 'EN1092-2_PN16', 'BS10_D', 'ASME_150'],
    dn: [50, 400], exceptDN: [250], sameDN: true,
    flags: ['2017 catalogue. Whether Table D is available at each size is not tabulated. Ask Cascade.'],
    sources: ['https://pdfs.findtheneedle.co.uk/findtheneedle/pdfs/43429.pdf'],
  },
  {
    id: 'teekay-fa', maker: 'Teekay Couplings', name: 'Flange Adaptor (fabricated, stainless)', kind: 'bespoke',
    summary: 'Stainless steel flange adaptor made to the pipe OD, for use with a Teekay Axiflex or Axilock coupling. Standard drilling to BS 4504 / DIN PN6–PN25. "Other flange tables and drillings such as BS10 Tables A–E or ANSI B16.5 Classes 150 and 300 can be supplied as standard." Not a flange-to-flange converter.',
    pressure: 'PN10 / PN16 / PN25 per drilling table.',
    sizes: 'Made to any pipe OD. Table D dimensions are not published: ask Teekay Technical Department.',
    tables: ['EN1092-1_PN6', 'EN1092-1_PN10', 'EN1092-1_PN16', 'EN1092-1_PN25', 'BS10_D', 'BS10_E', 'ASME_150', 'ASME_300'],
    dn: null,
    flags: ['The Table D dimensions and size range are not published. Ask Teekay.'],
    sources: [
      'https://www.teekaycouplings.com/products/flange-adapter/',
      'https://www.roykon.dk/pub/media/files/Teekay%20%28teknisk%20brochure%29.pdf',
    ],
  },
];

/* ------------------------------------------------------------------
 * General options (guidance, not products). No ⚠ needed: no sizes or
 * ratings are claimed.
 * ------------------------------------------------------------------ */
const ADAPTER_GUIDANCE = [
  { title: 'Dual-drilled (universal) flanges',
    text: 'A flange drilled with two sets of holes (for example PN10/16 plus Table D) so it bolts to either. Common on new valves, hydrants and flange adaptors. Check the two sets of holes do not break into each other or the edge of the flange.' },
  { title: 'Studded flange converter (change piece)',
    text: 'A short ring with studs from both faces, each side drilled to a different pattern. It adds a joint (two gaskets) and a little length. This is what the AVK 209 series is.' },
  { title: 'Slotted holes',
    text: 'Slotting one flange\'s holes can bridge a small PCD difference (a few mm), as long as the bolts still bear properly on the washers. Only with the asset owner\'s approval: it is a modification, and it is not for high pressure.' },
  { title: 'Adaptor spool or short pipe',
    text: 'A short flanged pipe drilled one way at one end and another way at the other, made to order. Useful when a converter\'s extra thickness will not fit, or when you also need to change size.' },
  { title: 'Stepped and reducing flange adaptors',
    text: 'These join two different pipe ODs (for example 6" cast iron to DN150 ductile iron). That is a different job from changing the drilling: check that the flange face of the adaptor also matches the drilling you have.' },
  { title: 'Replace one flange',
    text: 'On a pipe end you can often cut the old flange off and fit a new one, or fit a flange adaptor, in the drilling you need. That is cheaper than a converter on many repairs.' },
  { title: 'Gaskets',
    text: 'When the PCD differs, a full-face gasket cut for one pattern will not suit the other. Use a ring gasket (inside the bolts) or a gasket made for the converter. For drinking water, use a WRAS-approved EPDM gasket.' },
  { title: 'Pressure rating',
    text: 'The joint is only as strong as its weakest part. Old BS 10 Table D/E flanges are rated lower than PN16 at most sizes, and a converter does not raise that. Check the rating of the old flange and of the bolts you can actually fit.' },
  { title: 'Product ranges differ by country',
    text: 'AVK\'s UK Supa Maxi 633/00-001 flange adaptor is PN10/16 only. An AVK datasheet from another market lists a multi-drilled Supa Maxi with Table D as an option. Do not assume the UK stock has the Table D drilling: ask AVK UK.',
    flag: 'Different sources disagree on this product. Not listed as a match.',
    sources: [AVK_PAGE + '633-00-001', 'https://www.humes.co.nz/assets/Uploads/Resources/Files/Humes-AVK-Supa-Maxi-Flange-Adaptor-PN16-Series-633-00.pdf'] },
];

/* ------------------------------------------------------------------
 * Quick presets: [label, flange A id, flange B id]. Each group becomes a
 * row of buttons.
 * ------------------------------------------------------------------ */
const ADAPTER_PRESETS = [
  { group: 'Table D → PN16', items: [
    { text: 'DN80 / 3"',  a: 'BS10_D_3',  b: 'EN1092-1_PN16_80' },
    { text: 'DN100 / 4"', a: 'BS10_D_4',  b: 'EN1092-1_PN16_100' },
    { text: 'DN150 / 6"', a: 'BS10_D_6',  b: 'EN1092-1_PN16_150' },
    { text: 'DN200 / 8"', a: 'BS10_D_8',  b: 'EN1092-1_PN16_200' },
  ] },
  { group: 'PN10 → PN16 (DN200 and up)', items: [
    { text: 'DN200', a: 'EN1092-1_PN10_200', b: 'EN1092-1_PN16_200' },
    { text: 'DN250', a: 'EN1092-1_PN10_250', b: 'EN1092-1_PN16_250' },
    { text: 'DN300', a: 'EN1092-1_PN10_300', b: 'EN1092-1_PN16_300' },
    { text: 'DN350', a: 'EN1092-1_PN10_350', b: 'EN1092-1_PN16_350' },
    { text: 'DN400', a: 'EN1092-1_PN10_400', b: 'EN1092-1_PN16_400' },
    { text: 'DN500', a: 'EN1092-1_PN10_500', b: 'EN1092-1_PN16_500' },
    { text: 'DN600', a: 'EN1092-1_PN10_600', b: 'EN1092-1_PN16_600' },
  ] },
  { group: 'ANSI 150 → PN16', items: [
    { text: '3" / DN80',   a: 'ASME_150_3',  b: 'EN1092-1_PN16_80' },
    { text: '4" / DN100',  a: 'ASME_150_4',  b: 'EN1092-1_PN16_100' },
    { text: '6" / DN150',  a: 'ASME_150_6',  b: 'EN1092-1_PN16_150' },
    { text: '8" / DN200',  a: 'ASME_150_8',  b: 'EN1092-1_PN16_200' },
    { text: '12" / DN300', a: 'ASME_150_12', b: 'EN1092-1_PN16_300' },
  ] },
];

if (typeof module !== 'undefined') {
  module.exports = { ADAPTER_PRODUCTS, ADAPTER_GUIDANCE, ADAPTER_PRESETS, ADAPTER_CHECKED };
}
