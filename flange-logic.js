/* =====================================================================
 * flange-logic.js  —  THE MATCHING ENGINE
 * ---------------------------------------------------------------------
 * Takes the site measurements, compares them with every flange in
 * flange-data.js and returns a ranked list of likely flanges.
 *
 * Works in the browser (loaded by index.html) and in Node.js (used by
 * tests.js). No libraries, just plain JavaScript.
 *
 * Main functions (read them in this order):
 *   expandTables()   turn the compact data rows into easy objects (mm)
 *   identify()       score every flange against the measurements
 *   scoreFlange()    the scoring for ONE flange
 *   boltLength()     suggested bolt / stud length
 *   gasketInfo()     suggested gasket sizes
 * ===================================================================== */

const MM_PER_INCH = 25.4;

/* ---------------- small helpers ---------------- */

// Round to a number of decimal places, e.g. round(3.14159, 1) -> 3.1
function round(x, dp = 1) {
  const f = Math.pow(10, dp);
  return Math.round(x * f) / f;
}

// Turn an inch text like '1 1/8"' or '5/8' or '0.75' into a decimal number of inches.
function parseInchText(text) {
  const s = String(text).replace(/["in]/g, '').trim();
  let total = 0;
  for (const part of s.split(/\s+/)) {
    if (part.includes('/')) {
      const [a, b] = part.split('/').map(Number);
      total += a / b;
    } else if (part !== '') {
      total += Number(part);
    }
  }
  return total;
}

// Bolt size text -> nominal diameter in mm. 'M16' -> 16, '5/8"' -> 15.875
function boltDiameterMm(boltText) {
  if (!boltText) return null;
  const s = String(boltText).trim().toUpperCase();
  if (s.startsWith('M')) return Number(s.slice(1));
  return parseInchText(s) * MM_PER_INCH;
}

// Show a decimal inch value as a nice fraction, e.g. 8.5 -> '8 1/2"'
function inchFraction(inches, denominator = 16) {
  let whole = Math.floor(inches + 1e-9);
  let num = Math.round((inches - whole) * denominator);
  if (num === denominator) { whole += 1; num = 0; }
  if (num === 0) return `${whole}"`;
  let den = denominator;
  while (num % 2 === 0) { num /= 2; den /= 2; }   // simplify 8/16 -> 1/2
  return whole ? `${whole} ${num}/${den}"` : `${num}/${den}"`;
}

/* ---------------- bolt circle geometry ----------------
 * Bolts are equally spaced on the pitch circle (PCD). Two adjacent bolt
 * centres and the circle centre make an isosceles triangle with angle
 * 360/n at the centre, so the straight-line (chord) distance c between
 * adjacent bolts is:   c = PCD × sin(180° / n)
 * and so:              PCD = c / sin(180° / n)
 */
function pcdFromChord(chord, n) {
  return chord / Math.sin(Math.PI / n);
}
function chordFromPcd(pcd, n) {
  return pcd * Math.sin(Math.PI / n);
}

/* ---------------- 1. expand the data tables ----------------
 * Turns each compact row like [100, 220, 180, 8, 18, 'M16', ...] into an
 * object { dn:100, od:220, pcd:180, ... } with every length in mm.
 */
function expandTables(tables) {
  const flanges = [];
  for (const table of tables) {
    const toMm = table.unit === 'in' ? MM_PER_INCH : 1;
    for (const row of table.rows) {
      // Pair each value with its column name.
      const r = {};
      table.columns.forEach((col, i) => { r[col] = row[i]; });

      const sizeKey = r.dn;   // rowNotes / unverified etc. are keyed by DN
      const len = (v) => (v === null || v === undefined ? null : v * toMm);

      // Collect every thickness column (t1, t2, t3...) that has a value.
      const thickness = [];
      for (const key of Object.keys(table.thicknessLabels || {})) {
        if (r[key] !== null && r[key] !== undefined) {
          thickness.push({ label: table.thicknessLabels[key], mm: len(r[key]) });
        }
      }

      const notes = [...(table.notes || [])];
      if (table.rowNotes && table.rowNotes[sizeKey]) notes.unshift(table.rowNotes[sizeKey]);
      const flags = [];
      if (table.unverified && table.unverified._all) flags.push(table.unverified._all);
      if (table.unverified && table.unverified[sizeKey]) flags.push(table.unverified[sizeKey]);

      const sizeLabel = r.nps ? `${r.nps}"` : `DN${r.dn}`;
      flanges.push({
        id: `${table.id}_${r.nps || r.dn}`,
        tableId: table.id,
        family: table.family,
        rating: table.rating,
        material: table.material,
        unit: table.unit,                    // unit of the original table
        aliases: table.aliases || [],
        dn: r.dn,
        nps: r.nps || null,
        sizeLabel,
        label: `${table.family} ${table.rating} ${sizeLabel}` + (r.nps ? ` (≈DN${r.dn})` : ''),
        od: len(r.od),
        odAlt: table.altOD && table.altOD[sizeKey] ? [table.altOD[sizeKey]] : [],  // altOD always in mm
        pcd: len(r.pcd),
        n: r.n,
        nAlt: (table.altBoltCount && table.altBoltCount[sizeKey]) || [],
        hole: len(r.hole),
        bolt: r.bolt,
        boltDia: boltDiameterMm(r.bolt),
        thickness,
        rf: len(r.rf),
        pipeOD: len(r.pipeOD),
        notes,
        flags,
        sources: table.sources || [],
      });
    }
  }
  return flanges;
}

/* ---------------- 2. tolerances ----------------
 * How far a site measurement can be from the book value and still count
 * as a good match. Tape-measuring a painted, corroded flange is not
 * precise, so these are deliberately generous. The "tolerance" setting in
 * the app multiplies all of them (tight = 0.6, normal = 1, loose = 1.6).
 */
const DEFAULT_TOL = {
  od:     (v) => 3 + 0.005 * v,     // ±3 mm plus 0.5 % (big flanges are harder to measure)
  pcd:    (v) => 2 + 0.003 * v,     // ±2 mm plus 0.3 %
  chord:  (v) => 2 + 0.003 * v,     // ±2 mm between adjacent bolt centres
  hole:   () => 1.5,                // ±1.5 mm
  bolt:   () => 1.2,                // ±1.2 mm (M16 vs 5/8" = 0.1 mm apart, so these stay ambiguous)
  rf:     (v) => 3 + 0.005 * v,
  pipeOD: (v) => 2.5 + 0.01 * v,
  // Thickness is lopsided: corrosion makes a flange THINNER (allow 4 mm),
  // paint / raised face / gasket remains make it THICKER (allow 3 mm).
  thicknessUnder: () => 4,
  thicknessOver:  () => 3,
};

// How much each measurement counts towards the overall score.
const WEIGHTS = { od: 3, pcd: 4, chord: 4, n: 4, hole: 2, bolt: 2, thickness: 1, rf: 1, pipeOD: 1.5 };

/* Score how close a measured value is to an expected value.
 *   ratio = |difference| / tolerance
 *   inside the tolerance (ratio <= 1): 1.0 falling gently to 0.7
 *   outside: falls on to 0 at three times the tolerance
 */
function closeness(diff, tol) {
  const r = Math.abs(diff) / tol;
  if (r <= 1) return 1 - 0.3 * r * r;
  return Math.max(0, 0.7 - 0.35 * (r - 1));
}
function statusFrom(diff, tol) {
  const r = Math.abs(diff) / tol;
  return r <= 1 ? 'good' : r <= 2 ? 'close' : 'bad';
}

/* ---------------- 3. score ONE flange ----------------
 * m = measurements in mm (any may be missing):
 *   { od, pcd, chord, n, hole, boltDia, thickness, rf, pipeOD }
 * Returns { score 0-100, checks: [...] } where each check explains one
 * comparison, so the app can say WHY a flange matched or didn't.
 */
function scoreFlange(f, m, tolFactor = 1) {
  const checks = [];
  let total = 0, weightSum = 0;

  // Generic compare: try the main value and any alternatives, keep the best.
  function compare(field, name, measured, expectedList, tolFn) {
    const list = expectedList.filter((v) => v !== null && v !== undefined);
    if (measured === undefined || measured === null || isNaN(measured)) return;
    if (list.length === 0) {
      checks.push({ field, name, measured, expected: null, status: 'na', text: `${name}: no standard value to compare` });
      return;
    }
    let best = null;
    for (const exp of list) {
      const diff = measured - exp;
      const tol = tolFn(exp) * tolFactor;
      const s = closeness(diff, tol);
      if (!best || s > best.s) best = { exp, diff, tol, s };
    }
    total += WEIGHTS[field] * best.s;
    weightSum += WEIGHTS[field];
    const st = statusFrom(best.diff, best.tol);
    checks.push({
      field, name, measured, expected: best.exp, diff: best.diff, tol: best.tol, status: st,
      text: `${name}: measured ${round(measured)} mm, standard ${round(best.exp)} mm ` +
            `(${best.diff >= 0 ? '+' : ''}${round(best.diff)} mm, tolerance ±${round(best.tol)})`,
    });
  }

  compare('od', 'Outside diameter', m.od, [f.od, ...f.odAlt], DEFAULT_TOL.od);

  // Bolt count: either right or wrong. Alternatives (e.g. DN65 4 or 8) score 0.9.
  let boltCountWrong = false;
  if (m.n) {
    let s = 0, status = 'bad', text;
    if (m.n === f.n) { s = 1; status = 'good'; text = `Bolt count: ${m.n} matches`; }
    else if (f.nAlt.includes(m.n)) { s = 0.9; status = 'good'; text = `Bolt count: ${m.n} is an allowed alternative (standard lists ${f.n})`; }
    else { boltCountWrong = true; text = `Bolt count: measured ${m.n}, standard has ${f.n}`; }
    total += WEIGHTS.n * s; weightSum += WEIGHTS.n;
    checks.push({ field: 'n', name: 'Bolt count', measured: m.n, expected: f.n, status, text });
  }

  // PCD: use the measured PCD if given. If only the chord (adjacent bolt
  // centres) is given, compare chords directly, using the measured bolt
  // count if we have it, otherwise this flange's own bolt count.
  if (m.pcd) {
    compare('pcd', 'PCD', m.pcd, [f.pcd], DEFAULT_TOL.pcd);
  } else if (m.chord) {
    const nUsed = m.n || f.n;
    const expectedChord = chordFromPcd(f.pcd, nUsed);
    compare('chord', `Adjacent bolt centres (${nUsed} bolts)`, m.chord, [expectedChord], DEFAULT_TOL.chord);
    const c = checks[checks.length - 1];
    c.text += ` → PCD from chord = ${round(pcdFromChord(m.chord, nUsed))} mm vs ${round(f.pcd)} mm`;
  }

  compare('hole', 'Bolt hole', m.hole, [f.hole], DEFAULT_TOL.hole);
  compare('bolt', 'Bolt diameter', m.boltDia, [f.boltDia], DEFAULT_TOL.bolt);

  // Thickness: compare with the nearest of the listed flange-type thicknesses,
  // using the lopsided tolerance (thinner allowed more than thicker).
  if (m.thickness) {
    if (f.thickness.length === 0) {
      checks.push({ field: 'thickness', name: 'Thickness', status: 'na', text: 'Thickness: no standard value to compare' });
    } else {
      let best = null;
      for (const t of f.thickness) {
        const diff = m.thickness - t.mm;
        const tol = (diff < 0 ? DEFAULT_TOL.thicknessUnder() : DEFAULT_TOL.thicknessOver()) * tolFactor;
        const s = closeness(diff, tol);
        if (!best || s > best.s) best = { t, diff, tol, s };
      }
      total += WEIGHTS.thickness * best.s; weightSum += WEIGHTS.thickness;
      checks.push({
        field: 'thickness', name: 'Thickness', measured: m.thickness, expected: best.t.mm, diff: best.diff,
        status: statusFrom(best.diff, best.tol),
        text: `Thickness: measured ${round(m.thickness)} mm, nearest standard ${round(best.t.mm)} mm (${best.t.label}). ` +
              `Thickness varies by flange type and material, so it is only a weak clue.`,
      });
    }
  }

  compare('rf', 'Raised face diameter', m.rf, [f.rf], DEFAULT_TOL.rf);
  compare('pipeOD', 'Pipe OD', m.pipeOD, [f.pipeOD], DEFAULT_TOL.pipeOD);

  let score = weightSum ? (100 * total) / weightSum : 0;
  // A wrong bolt count is almost always decisive, so knock the score down hard.
  if (boltCountWrong) score *= 0.6;
  // Every measurement outside tolerance makes the whole match less believable:
  // 'close' (1-2 × tolerance) costs 7 %, 'bad' (over 2 × tolerance) costs 20 %.
  for (const c of checks) {
    if (c.field === 'n' || c.field === 'thickness') continue;   // already handled / weak clue
    if (c.status === 'close') score *= 0.93;
    if (c.status === 'bad') score *= 0.8;
  }
  return { score: round(score, 0), checks, fieldsCompared: weightSum };
}

/* ---------------- 4. identify: score everything ----------------
 * Returns the best matches, best first. Flanges with the same OD, PCD,
 * bolt count and hole size (e.g. PN10 and PN16 at DN100) are grouped,
 * because no tape measure can tell them apart.
 */
function identify(flanges, m, options = {}) {
  const tolFactor = options.tolFactor || 1;
  const minScore = options.minScore ?? 40;
  const maxResults = options.maxResults || 12;

  const anyInput = ['od', 'pcd', 'chord', 'n', 'hole', 'boltDia', 'thickness', 'rf', 'pipeOD']
    .some((k) => m[k] !== undefined && m[k] !== null && !isNaN(m[k]));
  if (!anyInput) return [];

  const scored = flanges
    .filter((f) => !options.families || options.families.includes(f.family))
    .map((f) => ({ flange: f, ...scoreFlange(f, m, tolFactor) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score || a.flange.dn - b.flange.dn);

  // Group flanges with identical mating dimensions (within 0.5 mm).
  const groups = [];
  for (const r of scored) {
    const g = groups.find((g) => sameDrilling(g.items[0].flange, r.flange) && Math.abs(g.items[0].score - r.score) <= 5);
    if (g) g.items.push(r);
    else groups.push({ items: [r] });
  }
  for (const g of groups) {
    g.best = g.items[0];
    g.twinNote = g.items.length > 1 ? twinExplanation(g.items.map((i) => i.flange)) : null;
  }
  return groups.slice(0, maxResults);
}

function sameDrilling(a, b) {
  // Same OD and PCD (within 0.5 mm) and same bolt count = they bolt together.
  // Holes may differ slightly (steel 18 mm vs ductile iron 19 mm for M16).
  const near = (x, y, t) => Math.abs(x - y) <= t;
  return near(a.od, b.od, 0.5) && near(a.pcd, b.pcd, 0.5) && a.n === b.n && near(a.hole, b.hole, 1.6);
}

// Explain how (or whether) you can tell identical-drilling flanges apart.
function twinExplanation(list) {
  const names = list.map((f) => `${f.family} ${f.rating}`).join(', ');
  const thick = list.map((f) => f.thickness.map((t) => round(t.mm)).join('/') || '–');
  const allSameThickness = thick.every((t) => t === thick[0]);
  const holes = [...new Set(list.map((f) => round(f.hole)))];
  let text = `These have the same outside diameter, PCD and bolt count: ${names}. ` +
             `They will bolt together, and a tape measure cannot tell them apart.`;
  if (holes.length > 1) {
    text += ` Bolt holes differ slightly (${list.map((f) => `${f.family} ${f.rating}: ${round(f.hole)} mm`).join('; ')}) — ` +
            `cast/ductile iron flanges have 1 mm bigger holes than steel, which can hint at the material.`;
  }
  if (!allSameThickness) {
    text += ` Their listed thicknesses differ (${list.map((f, i) => `${f.rating}: ${thick[i]} mm`).join('; ')}), ` +
            `which may help if the flange is in good condition.`;
  }
  text += ' To be sure, look for the PN or table marking cast or stamped on the flange, valve body or nameplate, ' +
          'check asset records or drawings, and if still unknown treat it as the LOWER rating.';
  return text;
}

/* ---------------- 5. bolt length and gasket ----------------
 * Rough guide only. Bolt length =
 *   2 × flange thickness + gasket (3 mm) + 2 washers + nut height + 2-3 threads showing
 * Nut height ≈ 0.8 d (ISO 4032), thread allowance ≈ 0.3 d.
 * Rounded UP to the next 5 mm (10 mm above 200 mm).
 */
function washerThickness(d) {
  if (d <= 12.5) return 2.5;
  if (d <= 20.5) return 3;
  if (d <= 30.5) return 4;
  return 5;
}
function boltLength(f, measuredThickness) {
  const d = f.boltDia;
  if (!d) return null;
  // Thickness to use: what was measured on site, else the thickest listed type (safe side).
  let t = measuredThickness || (f.thickness.length ? Math.max(...f.thickness.map((x) => x.mm)) : null);
  if (!t) return null;
  // ASME thicknesses exclude the 1.6 mm raised face, so add it back.
  if (f.family === 'ASME B16.5') t += 1.6;
  const gasket = 3, washer = washerThickness(d), nut = 0.8 * d, spare = 0.3 * d;
  const roundUp = (x) => (x > 200 ? Math.ceil(x / 10) * 10 : Math.ceil(x / 5) * 5);
  const bolt = roundUp(2 * t + gasket + 2 * washer + nut + spare);
  const stud = roundUp(2 * t + gasket + 2 * washer + 2 * (nut + spare));
  return { thicknessUsed: round(t), bolt, stud, d };
}

/* Gasket sizes.
 *  - IBC (inside bolt circle) flat gasket: sits inside the bolts.
 *    Its OD is about PCD − hole diameter (this matches EN 1514-1 for
 *    EN 1092 flanges, e.g. DN100 PN16: 180 − 18 = 162 mm).
 *  - Full face gasket: same OD as the flange, with bolt holes punched.
 *    Usual on flat-faced cast/ductile iron flanges in water.
 */
function gasketInfo(f) {
  const ibcOD = f.pcd - f.hole;
  const id = f.pipeOD ? f.pipeOD : null;
  return {
    ibcOD: round(ibcOD, 0),
    id: id ? round(id, 0) : null,
    fullFaceOD: round(f.od, 0),
    text: `IBC gasket ≈ ${round(ibcOD, 0)} mm OD` + (id ? ` × ${round(id, 0)} mm ID` : '') +
          `; full face gasket ${round(f.od, 0)} mm OD with ${f.n} × ${round(f.hole, 1)} mm holes on ${round(f.pcd, 1)} mm PCD. ` +
          (f.family === 'ASME B16.5' ? 'For ASME, buy to B16.21 for the exact size. ' : 'Exact sizes: EN 1514-1. ') +
          'For drinking water use a WRAS-approved EPDM gasket.',
  };
}

// Make the functions available to Node.js tests.
if (typeof module !== 'undefined') {
  module.exports = {
    MM_PER_INCH, round, parseInchText, boltDiameterMm, inchFraction,
    pcdFromChord, chordFromPcd, expandTables, scoreFlange, identify,
    sameDrilling, boltLength, gasketInfo, DEFAULT_TOL, WEIGHTS,
  };
}
