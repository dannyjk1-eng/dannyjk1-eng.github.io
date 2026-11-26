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

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
