/* tests.js — run with:  node tests.js
 * Checks the matching engine against flanges whose sizes we know.
 * Each test gives some "site measurements" and the flange we expect at
 * the top of the list (or inside the top group of identical drillings).
 */
const { FLANGE_TABLES } = require('./flange-data.js');
const L = require('./flange-logic.js');

const flanges = L.expandTables(FLANGE_TABLES);
let passed = 0, failed = 0;

function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}  ${detail}`); }
}

// Run identify() and check the expected flange is in the TOP group.
function expectTop(name, m, expectedIds, mustAlsoInclude = []) {
  const groups = L.identify(flanges, m);
  if (!groups.length) return check(name, false, 'no results');
  const top = groups[0].items.map((i) => i.flange.id);
  const okTop = expectedIds.some((id) => top[0] === id || top.includes(id));
  const okAlso = mustAlsoInclude.every((id) => top.includes(id));
  check(name, okTop && okAlso,
    `\n        top group: ${top.join(', ')} (score ${groups[0].best.score})` +
    `\n        next: ${groups.slice(1, 3).map((g) => g.best.flange.id + ' ' + g.best.score).join(' | ')}`);
  console.log(`        → top: ${groups[0].items.map((i) => `${i.flange.label} [${i.score}]`).join(', ')}`);
  return groups;
}

console.log('\nGeometry');
check('chord for DN100 PN16 (PCD 180, 8 bolts) = 68.9 mm', Math.abs(L.chordFromPcd(180, 8) - 68.88) < 0.05);
check('PCD from chord 68.88 mm, 8 bolts = 180 mm', Math.abs(L.pcdFromChord(68.88, 8) - 180) < 0.05);
check('PCD from chord, 4 bolts: 125 mm PCD → chord 88.4', Math.abs(L.chordFromPcd(125, 4) - 88.39) < 0.05);
check('bolt "5/8\\"" = 15.875 mm', Math.abs(L.boltDiameterMm('5/8"') - 15.875) < 1e-6);
check('bolt "M20" = 20 mm', L.boltDiameterMm('M20') === 20);
check('inchFraction(8.5) = 8 1/2"', L.inchFraction(8.5) === '8 1/2"');

console.log('\nData sanity');
let bad = 0;
for (const f of flanges) {
  if (!(f.od > f.pcd && f.pcd > 0 && f.n >= 4 && f.n % 4 === 0 && f.hole > 0 && f.boltDia > 0 && f.hole > f.boltDia)) {
    bad++; console.log('   odd row:', f.id, f.od, f.pcd, f.n, f.hole, f.boltDia);
  }
  // bolt holes must fit between OD and PCD with some metal left
  if ((f.od - f.pcd) / 2 < f.hole / 2) { bad++; console.log('   hole breaks out:', f.id); }
}
check(`all ${flanges.length} rows: OD > PCD, n multiple of 4, hole > bolt`, bad === 0);

console.log('\nKnown flanges');
// 1. DN100 PN16 — OD 220, PCD 180, 8 × M16. PN10 must be in the same group.
expectTop('DN100 PN16 (OD 220, PCD 180, 8×M16)',
  { od: 220, pcd: 180, n: 8, boltDia: 16 },
  ['EN1092-1_PN16_100'], ['EN1092-1_PN10_100', 'EN1092-2_PN16_100', 'EN1092-2_PN10_100']);

// 2. DN150 PN16 — OD 285, PCD 240, 8 × M20.
expectTop('DN150 PN16 (OD 285, PCD 240, 8×M20)',
  { od: 285, pcd: 240, n: 8, boltDia: 20 },
  ['EN1092-1_PN16_150'], ['EN1092-1_PN10_150']);

// 3. BS 10 Table D 4" — OD 215.9, PCD 177.8, 4 × 5/8".  (Table E 4" has 8 bolts, so D should win.)
expectTop('BS 10 Table D 4" (OD 215.9, PCD 177.8, 4×5/8")',
  { od: 215.9, pcd: 177.8, n: 4, boltDia: 15.875 },
  ['BS10_D_4']);

// 4. ASME 4" Class 150 — OD 228.6, PCD 190.5, 8 × 5/8".
expectTop('ASME B16.5 4" Class 150 (OD 228.6, PCD 190.5, 8×5/8")',
  { od: 228.6, pcd: 190.5, n: 8, boltDia: 15.875 },
  ['ASME_150_4']);

// 4b. BS 10 Table F 4" has the SAME OD, PCD and bolt count as ASME 150 4" (they share a group above).
//     Adding the hole size (ASME 3/4" = 19.05 mm, BS 10 F 11/16" = 17.5 mm) separates them.
const g4b = L.identify(flanges, { od: 228.6, pcd: 190.5, n: 8, boltDia: 15.875, hole: 19.05 });
check('ASME 4" Class 150 with 19 mm holes → ASME alone on top', g4b[0].items.length === 1 && g4b[0].best.flange.id === 'ASME_150_4',
  g4b[0].items.map((i) => i.flange.id).join(','));

// 5. Chord only: DN100 PN16 measured on site — 8 bolts, adjacent centres 69 mm, OD 221 (paint).
expectTop('Chord-only: 8 bolts, 69 mm between adjacent centres, OD 221',
  { od: 221, chord: 69, n: 8 },
  ['EN1092-1_PN16_100']);

// 6. Chord only, no bolt count given: 12 bolts on DN200 PN16 PCD 295 → chord 76.35
expectTop('Chord without bolt count: OD 340, chord 76.4, hole 22',
  { od: 340, chord: 76.4, hole: 22 },
  ['EN1092-1_PN16_200']);

// 7. DN200 PN10 vs PN16 differ by bolt count — 8 bolts must give PN10, not PN16.
const g7 = expectTop('DN200 with 8 bolts → PN10 (PN16 has 12)',
  { od: 340, pcd: 295, n: 8 },
  ['EN1092-1_PN10_200']);
check('  DN200 PN16 not in top group', !g7[0].items.some((i) => i.flange.id === 'EN1092-1_PN16_200'));

// 8. Ductile iron DN300 PN16 with the DI-specific OD of 455 mm and 23... 28 mm holes
expectTop('Ductile iron DN300 PN16 (OD 455, PCD 410, 12 holes of 28 mm)',
  { od: 455, pcd: 410, n: 12, hole: 28 },
  ['EN1092-2_PN16_300']);

// 9. Corroded, painted, imperfect measurements: DN80 PN16 with OD 198, PCD 161.5, 8 bolts, thickness 17 (corroded)
expectTop('Rough DN80 PN16 (OD 198, PCD 161.5, 8 bolts, t=17)',
  { od: 198, pcd: 161.5, n: 8, thickness: 17 },
  ['EN1092-1_PN16_80', 'EN1092-1_PN10_80', 'EN1092-2_PN16_80']);

console.log('\nBolt length / gasket');
const dn100 = flanges.find((f) => f.id === 'EN1092-1_PN16_100');
const bl = L.boltLength(dn100);
check(`DN100 PN16 bolt length ≈ 70 mm (got M16 × ${bl.bolt}, stud ${bl.stud})`, bl.bolt >= 65 && bl.bolt <= 75);
const gk = L.gasketInfo(dn100);
check(`DN100 PN16 IBC gasket OD = 162 mm (EN 1514-1) (got ${gk.ibcOD})`, gk.ibcOD === 162);

console.log('\nDrawing');
const { drawFlange } = require('./flange-drawing.js');
// The drawing must show exactly n bolt holes (each drawn with class="bolt-hole").
for (const [id, n] of [['EN1092-1_PN16_100', 8], ['EN1092-1_PN16_200', 12], ['BS10_D_4', 4],
                       ['ASME_300_24', 24], ['EN1092-2_PN16_2000', 48]]) {
  const f = flanges.find((x) => x.id === id);
  for (const compact of [false, true]) {
    const svg = drawFlange(f, { bolt: L.boltLength(f), compact });
    const holes = (svg.match(/class="bolt-hole"/g) || []).length;
    check(`${id} drawing (${compact ? 'phone' : 'desktop'}) has ${n} bolt holes (got ${holes})`, holes === n);
  }
}
// Site values appear with the right colour: OD 221 vs 220 is within tolerance (green ✓),
// OD 240 is well outside (red ✗).
{
  const f = flanges.find((x) => x.id === 'EN1092-1_PN16_100');
  const ok = drawFlange(f, { checks: L.scoreFlange(f, { od: 221 }).checks });
  const bad = drawFlange(f, { checks: L.scoreFlange(f, { od: 240 }).checks });
  check('site OD within tolerance drawn green with ✓', /fill="#1a8a4a"[^>]*>site 221 mm ✓/.test(ok));
  check('site OD out of tolerance drawn red with ✗', /fill="#c0392b"[^>]*>site 240 mm ✗/.test(bad));
}

console.log('\nBrowse standards');
const B = require('./flange-browse.js');
// Every standard appears in drop-down 1 and lists all of its sizes in drop-down 2.
{
  const listed = B.browseStandards(FLANGE_TABLES).flatMap((g) => g.items.map((i) => i.id));
  check(`all ${FLANGE_TABLES.length} standards listed in the drop-down`, FLANGE_TABLES.every((t) => listed.includes(t.id)));
  const wrong = FLANGE_TABLES.filter((t) => B.browseSizes(flanges, t.id).length !== t.rows.length).map((t) => t.id);
  check('every standard lists all its sizes', wrong.length === 0, wrong.join(', '));
  const sizes = B.browseSizes(flanges, 'EN1092-1_PN16').map((f) => f.dn);
  check('sizes are listed smallest first', sizes.every((d, i) => i === 0 || d > sizes[i - 1]));
}
// Default selection, EN 1092-1 PN16 DN100: OD 220, PCD 180, 8 × M16.
{
  const f = flanges.find((x) => x.id === B.BROWSE_DEFAULT.flangeId);
  const html = B.browseDetailsHTML(f, flanges);
  check('default is EN 1092-1 PN16 DN100', f.id === 'EN1092-1_PN16_100');
  check('PN16 DN100 details show OD 220 / PCD 180 / 8 × M16',
    html.includes('<td>220 mm') && html.includes('<td>180 mm') && html.includes('8 × M16'));
  check('PN16 DN100 lists PN10 DN100 under "same drilling"', html.includes('data-cmp="EN1092-1_PN10_100"'));
  const range = B.browseRangeHTML(flanges, 'EN1092-1_PN16', f.id);
  check('range table highlights the selected row', /<tr data-id="EN1092-1_PN16_100" class="sel">/.test(range));
  check('range table has one row per size', (range.match(/<tr data-id=/g) || []).length === 28);
}
// BS 10 Table D 4": 4 bolts, 5/8", and it carries its ⚠ flag.
{
  const f = flanges.find((x) => x.id === 'BS10_D_4');
  const html = B.browseDetailsHTML(f, flanges);
  check('BS 10 Table D 4" shows 4 × 5/8" bolts', f.n === 4 && html.includes('4 × 5/8&quot;'));
  check('BS 10 Table D 4" shows its ⚠ unverified note', html.includes('⚠ Not fully verified'));
  check('switching PN16 DN100 → Table D picks 4" (nearest size)', B.nearestSize(flanges, 'BS10_D', 100).id === 'BS10_D_4');
}
// Prev / next stop at the ends.
check('next after PN16 DN100 is DN125', B.stepSize(flanges, 'EN1092-1_PN16_100', 1).id === 'EN1092-1_PN16_125');
check('prev at the smallest size stays put', B.stepSize(flanges, 'EN1092-1_PN16_15', -1).id === 'EN1092-1_PN16_15');
// Compare: ASME 4" Cl150 and BS 10 Table F 4" share drilling; PN16 DN100 vs Table D 4" do not.
{
  const g = (id) => flanges.find((x) => x.id === id);
  check('ASME 4" Cl150 vs BS 10 Table F 4" = same drilling', B.compareHTML(g('ASME_150_4'), g('BS10_F_4')).includes('✓ Same drilling'));
  const cmp = B.compareHTML(g('EN1092-1_PN16_100'), g('BS10_D_4'));
  check('PN16 DN100 vs Table D 4" = not the same, bolts and PCD highlighted',
    cmp.includes('✗ Not the same drilling') && cmp.includes('8 vs 4 bolts') && /class="diff"><th>PCD/.test(cmp) && /class="diff"><th>Bolts/.test(cmp));
}

console.log('\nAdapters: compatibility logic');
const AD = require('./flange-adapters.js');
const ADD = require('./flange-adapters-data.js');
{
  const g = (id) => flanges.find((x) => x.id === id);
  const cmp = (a, b) => AD.compareDrilling(g(a), g(b));
  // lens maths: one hole inside the other = the smaller hole; touching circles = 0
  check('lensMaxBolt: 22 mm and 17.5 mm holes 2.5 mm apart → 17.2 mm', Math.abs(AD.lensMaxBolt(22, 17.4625, 2.525) - 17.2) < 0.05);
  check('lensMaxBolt: concentric holes → the smaller hole', AD.lensMaxBolt(22, 18, 0) === 18);
  check('lensMaxBolt: 30 mm apart → 0', AD.lensMaxBolt(18, 18, 30) === 0);

  // identical drilling
  let r = cmp('EN1092-1_PN16_100', 'EN1092-1_PN10_100');
  check('PN16 DN100 vs PN10 DN100 = direct bolt-up', r.status === 'direct');
  r = cmp('ASME_150_4', 'BS10_F_4');
  check('ASME 4" Cl150 vs BS 10 Table F 4" = direct (hole sizes differ, noted)', r.status === 'direct' && r.holeDiff > 0.5);
  check('the verdict for that pair mentions the hole sizes',
    AD.adVerdictHTML(g('ASME_150_4'), g('BS10_F_4'), r).includes('Hole sizes differ'));

  // bolts fit with a different hole / bolt size
  r = cmp('BS10_D_6', 'EN1092-1_PN16_150');
  check('6" Table D vs DN150 PN16 = bolts fit (marginal), 5/8" / M16 only',
    r.status === 'fit' && r.tight && r.undersized && r.largestMetric === 'M16' && r.largestImperial === '5/8"' && Math.abs(r.maxBolt - 17.2) < 0.1,
    JSON.stringify(r));
  check('  the verdict warns it is marginal and points to a converter',
    /only just fit/.test(AD.adVerdictHTML(g('BS10_D_6'), g('EN1092-1_PN16_150'), r)) && /converter/.test(AD.adVerdictHTML(g('BS10_D_6'), g('EN1092-1_PN16_150'), r)));
  r = cmp('ASME_150_6', 'EN1092-1_PN16_150');
  check('ASME 6" Cl150 vs DN150 PN16 = bolts fit, M20 or 3/4" go through', r.status === 'fit' && r.largestMetric === 'M20' && !r.undersized);
  r = cmp('EN1092-1_PN10_250', 'EN1092-1_PN16_250');
  check('PN10 vs PN16 DN250 = bolts fit with M20 only (PN16 wants M24)', r.status === 'fit' && r.chosenLabel === 'M20' && r.undersized);

  // not compatible
  r = cmp('BS10_D_3', 'EN1092-1_PN16_80');
  check('3" Table D vs DN80 PN16 = adapter (4 vs 8 bolts)', r.status === 'adapter' && !r.sameN);
  r = cmp('BS10_D_4', 'EN1092-1_PN16_100');
  check('4" Table D vs DN100 PN16 = adapter, only 4 holes could line up', r.status === 'adapter' && r.partial === 4);
  r = cmp('BS10_D_8', 'EN1092-1_PN16_200');
  check('8" Table D vs DN200 PN16 = adapter (8 vs 12 bolts)', r.status === 'adapter');
  r = cmp('EN1092-1_PN10_200', 'EN1092-1_PN16_200');
  check('PN10 vs PN16 DN200 = adapter (8 vs 12 bolts), same PCD', r.status === 'adapter' && r.dPcd === 0 && r.partial === 4);
  r = cmp('EN1092-1_PN10_300', 'EN1092-1_PN16_300');
  check('PN10 vs PN16 DN300 = adapter (M20 needs 20 mm, overlap only 19 mm)', r.status === 'adapter' && Math.abs(r.maxBolt - 19) < 0.01);
  check('  the verdict says the bolt will not go through both holes',
    /will not go through both holes/.test(AD.adVerdictHTML(g('EN1092-1_PN10_300'), g('EN1092-1_PN16_300'), r)));

  // the verdict does not depend on the order
  const pairs = [['BS10_D_6', 'EN1092-1_PN16_150'], ['BS10_D_4', 'EN1092-1_PN16_100'], ['EN1092-1_PN10_300', 'EN1092-1_PN16_300'],
                 ['ASME_150_6', 'EN1092-1_PN16_150'], ['EN1092-1_PN16_100', 'EN1092-1_PN10_100']];
  check('A/B order makes no difference to the verdict',
    pairs.every(([x, y]) => cmp(x, y).status === cmp(y, x).status && Math.abs(cmp(x, y).dPcd - cmp(y, x).dPcd) < 1e-9));

  // the side-by-side table highlights the rows that differ
  const t = AD.adTableHTML(g('BS10_D_6'), g('EN1092-1_PN16_150'));
  check('table highlights PCD and hole rows for 6" Table D vs DN150 PN16',
    /class="diff"><th>PCD/.test(t) && /class="diff"><th>Bolt hole/.test(t) && !/class="diff"><th>Number of bolts/.test(t));
  check('table shows the inch value for Table D', t.includes('9 1/4&quot;') || t.includes('9 1/4"'));

  // suggested partner
  check('partner for Table D 6" = PN16 DN150', AD.suggestPartner(flanges, g('BS10_D_6')).id === 'EN1092-1_PN16_150');
  check('partner for PN16 DN150 = Table D 6"', AD.suggestPartner(flanges, g('EN1092-1_PN16_150')).id === 'BS10_D_6');
}

console.log('\nAdapters: products and data sanity');
{
  const g = (id) => flanges.find((x) => x.id === id);
  const ids = new Set(flanges.map((f) => f.id));
  const find = (a, b) => AD.findAdapterProducts(g(a), g(b), flanges);

  // every flange id named in the data exists
  const named = [];
  for (const p of ADD.ADAPTER_PRODUCTS) {
    (p.pairs || []).forEach((x) => named.push(x.a, x.b));
    (p.sets || []).forEach((st) => named.push(...(st.yes || []), ...(st.maybe || [])));
  }
  ADD.ADAPTER_PRESETS.forEach((gr) => gr.items.forEach((it) => named.push(it.a, it.b)));
  const missing = [...new Set(named.filter((id) => !ids.has(id)))];
  check(`all ${new Set(named).size} flange ids named in the products and presets exist`, missing.length === 0, missing.join(', '));
  const tableIds = new Set(FLANGE_TABLES.map((t) => t.id));
  const badTables = ADD.ADAPTER_PRODUCTS.flatMap((p) => p.tables || []).filter((tb) => !tableIds.has(tb));
  check('every standard named in the made-to-order products exists', badTables.length === 0, badTables.join(', '));

  // every product carries what the brief asks for
  const kinds = ['converter', 'dual', 'bespoke'];
  const incomplete = ADD.ADAPTER_PRODUCTS.filter((p) => !(p.maker && p.name && kinds.includes(p.kind) && p.summary && p.pressure && p.sizes &&
    Array.isArray(p.sources) && p.sources.length && p.sources.every((u) => /^https:\/\/[^ ]+$/.test(u)) && Array.isArray(p.flags)));
  check(`all ${ADD.ADAPTER_PRODUCTS.length} products have maker, name, kind, pressure, sizes, https sources and flags`, incomplete.length === 0, incomplete.map((p) => p.id).join(', '));
  check('product ids are unique', new Set(ADD.ADAPTER_PRODUCTS.map((p) => p.id)).size === ADD.ADAPTER_PRODUCTS.length);
  check('every converter has pairs, every dual product has sets, every bespoke product has tables',
    ADD.ADAPTER_PRODUCTS.every((p) => (p.kind === 'converter' ? p.pairs && p.pairs.length : p.kind === 'dual' ? p.sets && p.sets.length : p.tables && p.tables.length)));
  const flagsOk = ADD.ADAPTER_PRODUCTS.every((p) => p.flags.every((f) => typeof f === 'string' && f.length > 10)) &&
    ADD.ADAPTER_PRODUCTS.every((p) => (p.pairs || []).every((x) => !x.flag || x.flag.length > 10));
  check('every ⚠ flag is a real sentence', flagsOk);
  const refs = ADD.ADAPTER_PRODUCTS.filter((p) => p.kind === 'converter').flatMap((p) => p.pairs.map((x) => `${p.id}|${x.ref}|${x.a}|${x.b}`));
  check('no converter pair is listed twice', new Set(refs).size === refs.length);
  check('a converter pair never joins a flange to itself', ADD.ADAPTER_PRODUCTS.every((p) => (p.pairs || []).every((x) => x.a !== x.b)));
  const mism = ADD.ADAPTER_PRODUCTS.filter((p) => p.kind === 'converter').flatMap((p) => p.pairs).filter((x) => !/DN|"/.test(x.note));
  check('every converter pair has a readable note', mism.length === 0);

  // the DN150 PN16 ⇄ 6" Table D example: the AVK 209/30 converter, both ways round
  for (const [x, y] of [['BS10_D_6', 'EN1092-1_PN16_150'], ['EN1092-1_PN16_150', 'BS10_D_6'], ['BS10_D_6', 'EN1092-1_PN10_150']]) {
    const m = find(x, y).find((q) => q.product.id === 'avk-209-30');
    check(`AVK 209/30 found for ${x} vs ${y}`, m && m.items.some((i) => i.ref === '209-30-15002-15206'));
  }
  // the presets in the brief all have a verdict and at least one product
  const expectStatus = {
    'BS10_D_3|EN1092-1_PN16_80': 'adapter', 'BS10_D_4|EN1092-1_PN16_100': 'adapter',
    'BS10_D_6|EN1092-1_PN16_150': 'fit', 'BS10_D_8|EN1092-1_PN16_200': 'adapter',
  };
  for (const [key, st] of Object.entries(expectStatus)) {
    const [x, y] = key.split('|');
    check(`preset ${key} → ${st}`, AD.compareDrilling(g(x), g(y)).status === st);
    const m = find(x, y);
    check(`  and it lists an AVK 209/30 stock converter`, m.length && m[0].product.id === 'avk-209-30', m.map((q) => q.product.id).join(','));
  }
  const presetSizes = ADD.ADAPTER_PRESETS.map((gr) => gr.group + ': ' + gr.items.map((it) => it.text).join(','));
  check('presets cover Table D → PN16, PN10 → PN16 from DN200 and ANSI 150 → PN16',
    ADD.ADAPTER_PRESETS.length === 3 && ADD.ADAPTER_PRESETS[1].items[0].text === 'DN200' && /ANSI 150/.test(presetSizes[2]));
  check('every preset joins two different flanges',
    ADD.ADAPTER_PRESETS.every((gr) => gr.items.every((it) => it.a !== it.b)));
  {
    const m = find('EN1092-1_PN10_200', 'EN1092-1_PN16_200').map((q) => q.product.id);
    check('PN10 → PN16 DN200: AVK 209/30 (209-30-20001-20002) and MaxiDaptor listed', m.includes('avk-209-30') && m.includes('vj-maxidaptor'));
    check('PN10 → PN16 DN300: no stock converter, made-to-order only', find('EN1092-1_PN10_300', 'EN1092-1_PN16_300').every((q) => q.product.kind === 'bespoke'));
  }
  // dual-drilled and uncertain products
  {
    const m = find('BS10_D_6', 'EN1092-1_PN16_150');
    const vj = m.find((q) => q.product.id === 'vj-maxidaptor');
    check('MaxiDaptor listed for DN150 PN16 vs 6" Table D as dual-drilled', vj && vj.certainty === 'yes' && vj.product.kind === 'dual');
    const avk603 = m.find((q) => q.product.id === 'avk-603-a-003');
    check('AVK 603/A-003 is only "possible" (⚠) for Table D', avk603 && avk603.certainty === 'maybe');
    check('converters are listed before dual-drilled before made-to-order',
      m.map((q) => q.product.kind).join(',') === [...m.map((q) => q.product.kind)].sort((p, q) => kinds.indexOf(p) - kinds.indexOf(q)).join(','));
    check('Teekay Table D is only offered as made-to-order', m.find((q) => q.product.id === 'teekay-fa').product.kind === 'bespoke');
  }
  // a pair nothing covers
  check('Cascade Xtra is not offered at DN250 (Table D not available there)',
    !find('BS10_D_10', 'EN1092-1_PN16_250').some((q) => q.product.id === 'cascade-xtra'));
  // the products HTML
  {
    const m = find('BS10_D_6', 'EN1092-1_PN16_150');
    const html = AD.adProductsHTML(m, g('BS10_D_6'), g('EN1092-1_PN16_150'));
    check('products HTML shows the AVK ref, a source link and ⚠ notes',
      html.includes('209-30-15002-15206') && html.includes('avkuk.co.uk') && html.includes('⚠'));
    check('products HTML does not link anything except https',
      !/href="(?!https:)/.test(html));
    check('guidance HTML lists the general options', (AD.adGuidanceHTML().match(/<details/g) || []).length === ADD.ADAPTER_GUIDANCE.length);
  }
  const nFlags = AD.adFlagCount();
  check(`⚠ count is ${nFlags} and counted`, nFlags > 0);
  console.log(`        → ${ADD.ADAPTER_PRODUCTS.length} products, ${nFlags} ⚠ flags (${ADD.ADAPTER_PRODUCTS.reduce((n, p) => n + p.flags.length, 0)} on products, ` +
    `${ADD.ADAPTER_PRODUCTS.reduce((n, p) => n + (p.pairs || []).filter((x) => x.flag).length, 0)} on converter pairs, ${ADD.ADAPTER_GUIDANCE.filter((x) => x.flag).length} on general options)`);
}

console.log('\nAdapters: overlay drawing');
{
  const { drawOverlay } = require('./flange-drawing.js');
  const g = (id) => flanges.find((x) => x.id === id);
  const count = (svg, cls) => (svg.match(new RegExp(`class="${cls}"`, 'g')) || []).length;
  for (const compact of [false, true]) {
    const a = g('BS10_D_6'), b = g('EN1092-1_PN16_150');
    const fit = AD.compareDrilling(a, b);
    const svg = drawOverlay(a, b, { compact, fit });
    check(`overlay 6" Table D vs DN150 PN16 (${compact ? 'phone' : 'desktop'}): 8 + 8 holes`, count(svg, 'bolt-hole-a') === 8 && count(svg, 'bolt-hole-b') === 8);
    check('  A in blue, B in orange', svg.includes('#0b5cad') && svg.includes('#d35400'));
    check('  zoomed hole pair with the bolt that passes', count(svg, 'bolt-pass') === 1 && svg.includes('Largest bolt through both holes'));
    check('  valid svg with a viewBox', /^<svg [^>]*viewBox="0 0 640 \d+"/.test(svg) && svg.endsWith('</svg>'));
  }
  const svg2 = drawOverlay(g('BS10_D_3'), g('EN1092-1_PN16_80'), { fit: AD.compareDrilling(g('BS10_D_3'), g('EN1092-1_PN16_80')) });
  check('overlay with different bolt counts: 4 + 8 holes, no zoom inset', count(svg2, 'bolt-hole-a') === 4 && count(svg2, 'bolt-hole-b') === 8 && count(svg2, 'bolt-pass') === 0 && svg2.includes('cannot pair up'));
  const svg3 = drawOverlay(g('EN1092-1_PN16_100'), g('EN1092-1_PN10_100'), { fit: AD.compareDrilling(g('EN1092-1_PN16_100'), g('EN1092-1_PN10_100')) });
  check('overlay of identical drillings still draws', count(svg3, 'bolt-hole-a') === 8 && count(svg3, 'bolt-hole-b') === 8);
  check('overlay escapes text safely', !/<text[^>]*>[^<]*&(?!amp;|lt;|gt;|quot;)/.test(svg2));
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
