/* =====================================================================
 * flange-drawing.js  —  THE FLANGE DRAWING (SVG)
 * ---------------------------------------------------------------------
 * drawFlange(flange, options) returns the text of an SVG picture:
 *   1. a FACE VIEW (looking straight at the flange) drawn to scale:
 *      outside diameter, raised face, bore, dashed PCD circle and the
 *      right number of bolt holes at the right size and spacing;
 *   2. a SIDE VIEW of a bolted joint: this flange, a gasket, a dashed
 *      mating flange and a bolt + nut, with thickness and bolt length.
 *
 * SVG is just text describing shapes, e.g.
 *     <circle cx="100" cy="100" r="50" />
 * so we build one long string and the page puts it on screen with
 * element.innerHTML = drawFlange(...). Because it is only a string,
 * the tests can run it in Node.js and count the bolt holes.
 *
 * Coordinates: SVG's (0,0) is the TOP-LEFT corner and y goes DOWN.
 * Everything is drawn in "drawing units" inside a viewBox 640 wide;
 * the browser then scales the whole picture to fit the screen.
 *
 * Helper names start with "fd" so they never clash with the helpers
 * in flange-logic.js (all the files share one page).
 * ===================================================================== */

const FD = {
  width: 640,        // viewBox width (drawing units)
  cx: 320,           // centre of the face view
  R: 185,            // radius the flange OD is drawn at
  font: 19,          // normal label size
  colours: { good: '#1a8a4a', close: '#c98a00', bad: '#c0392b', ink: '#1d2733', muted: '#5d6b7a',
             metal: '#d9e0e8', face: '#c4ced9', edge: '#4a5866', dim: '#0b5cad', highlight: '#d35400' },
};

/* ---------- tiny helpers ---------- */
function fdRound(x, dp = 1) { const f = Math.pow(10, dp); return Math.round(x * f) / f; }

// Decimal inches -> '8 1/2"' (nearest 1/16)
function fdInch(inches) {
  let whole = Math.floor(inches + 1e-9);
  let num = Math.round((inches - whole) * 16), den = 16;
  if (num === 16) { whole += 1; num = 0; }
  if (num === 0) return `${whole}"`;
  while (num % 2 === 0) { num /= 2; den /= 2; }
  return whole ? `${whole} ${num}/${den}"` : `${num}/${den}"`;
}

// Rough width of a line of text in drawing units (average character ≈ 0.56 × font size).
function fdWidth(line) { return String(line.text).length * (line.size || FD.font) * (line.bold ? 0.6 : 0.56); }

// Escape text so characters like < or & can't break the SVG.
function fdEsc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// A length for a label: '220 mm' or '228.6 mm (9")' when inches are wanted.
function fdLen(mm, inch, dp = 1) {
  if (mm === null || mm === undefined) return '—';
  return `${fdRound(mm, dp)} mm` + (inch ? ` (${fdInch(mm / 25.4)})` : '');
}

/* Text with a white halo (paint-order: stroke) so it stays readable
 * when it sits on top of lines or the grey metal.
 * lines = array of { text, colour, bold, size } drawn one under another. */
function fdText(x, y, lines, anchor = 'middle') {
  return lines.filter(Boolean).map((l, i) => {
    const size = l.size || FD.font;
    return `<text x="${x}" y="${y + i * (FD.font + 4)}" text-anchor="${anchor}" font-size="${size}"` +
      ` font-weight="${l.bold ? 700 : 400}" fill="${l.colour || FD.colours.ink}"` +
      ` style="paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round">${fdEsc(l.text)}</text>`;
  }).join('');
}

// A dimension line with an arrowhead at each end (marker defined in <defs>).
function fdDim(x1, y1, x2, y2, colour = FD.colours.dim) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colour}" stroke-width="1.6"` +
    ` marker-start="url(#fdArrow)" marker-end="url(#fdArrow)"/>`;
}
function fdLine(x1, y1, x2, y2, colour = FD.colours.muted, extra = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colour}" stroke-width="1.2" ${extra}/>`;
}

/* The second line of a label: what the user measured, coloured by how
 * well it matched. Uses the "checks" made by scoreFlange() in flange-logic.js. */
const FD_MARK = { good: '✓', close: '~', bad: '✗' };
function fdMeasured(check, inch) {
  if (!check || check.measured === undefined || check.status === 'na') return null;
  return {
    text: `site ${fdLen(check.measured, inch)} ${FD_MARK[check.status] || ''}`,
    colour: FD.colours[check.status] || FD.colours.muted,
    size: FD.font - 2,
  };
}

/* Raised face height f1 (mm). ASME B16.5 Class 150/300: 1/16" = 1.6 mm.
 * EN 1092-1:2018 Table 8 gives f1 = 2 mm (DN10-32), 3 mm (DN40-250),
 * 4 mm (DN300-500), 5 mm (DN600 and up). BS 10 flanges are usually flat
 * faced. Returns null when not known. */
function fdRaisedFaceHeight(f) {
  if (!f.rf) return null;
  if (f.family === 'ASME B16.5') return 1.6;
  if (f.family.startsWith('EN 1092')) {
    if (f.dn <= 32) return 2;
    if (f.dn <= 250) return 3;
    if (f.dn <= 500) return 4;
    return 5;
  }
  return null;
}

// Short name for a thickness type, for labels.
function fdShortType(label) {
  if (/Plate/i.test(label)) return 'plate flange';
  if (/Weld neck/i.test(label)) return 'weld neck';
  if (/Blind/i.test(label)) return 'blind';
  if (/iron/i.test(label)) return 'iron';
  return 'flange';
}

/* Hole angles. Bolt holes always STRADDLE the vertical and horizontal
 * centre lines (no hole sits on 12 o'clock). Measured clockwise from
 * 12 o'clock, hole i is at (i + 0.5) × 360°/n. */
function fdHoleAngles(n) {
  const a = [];
  for (let i = 0; i < n; i++) a.push(((i + 0.5) * 2 * Math.PI) / n);
  return a;
}

/* =====================================================================
 * drawFlange(f, options)
 *   f        a flange object from expandTables() (all lengths in mm)
 *   options  { checks: [...] from scoreFlange (to show site values),
 *              showInch: true/false,
 *              bolt: result of boltLength() (optional),
 *              compact: true on a phone — bigger text, smaller flange,
 *                       so labels stay readable when the picture shrinks }
 * Returns an SVG string.
 * ===================================================================== */
function drawFlange(f, options = {}) {
  const C = FD.colours;
  const checks = {};
  for (const c of options.checks || []) checks[c.field] = c;
  const inch = f.unit === 'in' || !!options.showInch;

  // Size settings. The phone ("compact") version uses bigger text.
  FD.font = options.compact ? 25 : 19;
  FD.R = options.compact ? 160 : 185;
  const F = FD.font, LH = F + 4;            // font size and line height
  const small = F - 3, tiny = F - 5;
  const { cx, R } = FD;
  const s = R / (f.od / 2);                 // scale: drawing units per mm
  const out = [];                           // pieces of SVG, joined at the end

  /* ---------- title ---------- */
  const size = f.nps ? `${f.nps}" (≈DN${f.dn})` : `DN${f.dn}`;
  const title = `${f.family}  ${f.rating}  ${size}`;
  const titleSize = Math.min(F + 6, Math.floor(1050 / title.length));   // shrink long titles to fit
  out.push(fdText(cx, F + 12, [{ text: title, bold: true, size: titleSize }]));
  out.push(fdText(cx, F + 12 + LH + 4, [{ text: `${f.material} · drawn to scale`, colour: C.muted, size: tiny }]));

  /* ---------- FACE VIEW ----------
   * The chord label sits above the circle, so work out its height first. */
  const chordMm = f.pcd * Math.sin(Math.PI / f.n);
  const chordLines = [
    { text: fdLen(chordMm, inch), colour: C.highlight, bold: true },
    { text: 'adjacent bolt centres', colour: C.highlight, size: small },
    fdMeasured(checks.chord, inch),
  ].filter(Boolean);
  const topOfFace = F + 12 + 2 * LH + 14 + chordLines.length * LH + 10;
  const cy = topOfFace + R;
  const pcdR = (f.pcd / 2) * s;
  const holeR = Math.max(2.5, (f.hole / 2) * s);
  const rfR = f.rf ? (f.rf / 2) * s : null;
  const boreR = f.pipeOD ? (f.pipeOD / 2) * s : null;

  // Flange body (grey disc), raised face (darker ring) and bore (white hole)
  out.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.metal}" stroke="${C.edge}" stroke-width="2"/>`);
  if (rfR) out.push(`<circle cx="${cx}" cy="${cy}" r="${rfR}" fill="${C.face}" stroke="${C.edge}" stroke-width="1.2"/>`);
  if (boreR) out.push(`<circle cx="${cx}" cy="${cy}" r="${boreR}" fill="#fff" stroke="${C.edge}" stroke-width="1.5"/>`);

  // Centre lines (long-dash-dot, as on an engineering drawing)
  out.push(fdLine(cx - R - 12, cy, cx + R + 12, cy, C.muted, 'stroke-dasharray="14 4 3 4"'));
  out.push(fdLine(cx, cy - R - 8, cx, cy + R + 12, C.muted, 'stroke-dasharray="14 4 3 4"'));

  // PCD: dashed circle through the bolt-hole centres
  out.push(`<circle cx="${cx}" cy="${cy}" r="${pcdR}" fill="none" stroke="${C.dim}" stroke-width="1.4" stroke-dasharray="7 5"/>`);

  // Bolt holes. Each gets class="bolt-hole" so the tests can count them.
  const angles = fdHoleAngles(f.n);
  const holeXY = angles.map((a) => [cx + pcdR * Math.sin(a), cy - pcdR * Math.cos(a)]);
  for (const [x, y] of holeXY) {
    out.push(`<circle class="bolt-hole" cx="${fdRound(x, 2)}" cy="${fdRound(y, 2)}" r="${fdRound(holeR, 2)}" fill="#fff" stroke="${C.edge}" stroke-width="1.5"/>`);
  }

  // --- Chord: the two holes either side of 12 o'clock, joined by a line,
  //     with its label centred above the flange.
  const [x1, y1] = holeXY[f.n - 1], [x2, y2] = holeXY[0];
  out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.highlight}" stroke-width="2.5"/>`);
  out.push(fdText(cx, topOfFace - 10 - (chordLines.length - 1) * LH, chordLines));

  // --- PCD dimension: straight across the centre, end to end on the dashed circle
  out.push(fdDim(cx - pcdR, cy, cx + pcdR, cy));
  out.push(fdText(cx, cy - 10, [{ text: `PCD ${fdLen(f.pcd, inch)}`, colour: C.dim, bold: true }]));
  const mPcd = fdMeasured(checks.pcd, inch);
  if (mPcd) out.push(fdText(cx, cy + F + 6, [mPcd]));

  // --- Bolt holes callout: top-right corner, leader to the hole nearest 2 o'clock.
  //     Bolt count and hole size from site are merged into one coloured line.
  let hi = 0, best = 9;
  angles.forEach((a, i) => { const d = Math.abs(a - Math.PI / 3); if (d < best) { best = d; hi = i; } });
  const [hx, hy] = holeXY[hi];
  const labX = FD.width - 6, labY = cy - R + 4;
  // Site values: bolt count and hole size merged into one coloured line,
  // coloured by the worse of the two.
  const parts = [checks.n, checks.hole].filter((c) => c && c.status !== 'na');
  let site = null;
  if (parts.length) {
    const worst = parts.some((c) => c.status === 'bad') ? 'bad' : parts.some((c) => c.status === 'close') ? 'close' : 'good';
    const what = [checks.n ? `${checks.n.measured}` : null, checks.hole ? `Ø${fdRound(checks.hole.measured)}` : null].filter(Boolean);
    const txt = `site ${what.join(' × ')}${checks.n && !checks.hole ? ' bolts' : ''} ${FD_MARK[worst]}`;
    site = { text: txt, colour: C[worst], size: small };
  }
  const holeLines = [
    { text: `${f.n} × Ø${fdRound(f.hole)}`, bold: true },
    { text: `holes, ${f.bolt}` + (inch ? ` (Ø${fdInch(f.hole / 25.4)})` : ''), size: small },
    site,
  ].filter(Boolean);
  // Leader ends just left of the widest label line, level with the first line.
  const labW = Math.max(...holeLines.map(fdWidth));
  out.push(fdLine(hx + holeR * 0.7, hy - holeR * 0.7, labX - labW - 6, labY - F * 0.3, C.ink));
  out.push(fdText(labX, labY, holeLines, 'end'));

  // --- Raised face callout: bottom-left corner
  const lowY = cy + R - 2 * LH + 6;
  if (rfR) {
    const a = (225 * Math.PI) / 180;
    const px = cx + rfR * Math.sin(a), py = cy - rfR * Math.cos(a);
    out.push(fdLine(px, py, 6 + 4.6 * F, lowY + 6, C.ink));
    out.push(fdText(6, lowY, [
      { text: 'Raised face', size: small, colour: C.muted },
      { text: `Ø${fdLen(f.rf, inch, 0)}`, bold: true },
      fdMeasured(checks.rf, inch),
    ], 'start'));
  }

  // --- Bore / pipe OD callout: bottom-right corner
  if (boreR) {
    const a = (135 * Math.PI) / 180;
    const px = cx + boreR * Math.sin(a), py = cy - boreR * Math.cos(a);
    out.push(fdLine(px, py, FD.width - 6 - 5 * F, lowY + 6, C.ink));
    out.push(fdText(FD.width - 6, lowY, [
      { text: 'Pipe OD', size: small, colour: C.muted },
      { text: `Ø${fdLen(f.pipeOD, inch)}`, bold: true },
      fdMeasured(checks.pipeOD, inch),
    ], 'end'));
  }

  // --- OD dimension below the face view, with extension lines
  const odY = cy + R + 26 + (checks.rf || checks.pipeOD ? LH : 0);
  out.push(fdLine(cx - R, cy + 4, cx - R, odY + 8));
  out.push(fdLine(cx + R, cy + 4, cx + R, odY + 8));
  out.push(fdDim(cx - R, odY, cx + R, odY));
  const odLines = [
    { text: `OD ${fdLen(f.od, inch)}` + (f.odAlt.length ? ` (or ${fdRound(f.odAlt[0])} DI)` : ''), bold: true, colour: C.dim },
    fdMeasured(checks.od, inch),
  ].filter(Boolean);
  out.push(fdText(cx, odY + F + 6, odLines));

  /* ---------- SIDE VIEW (bolted joint) ----------
   * Same scale as the face view, so thickness looks right next to the OD.
   * Top to bottom: bolt head, THIS flange, gasket, mating flange (dashed), nut.
   * The joint face (raised face) of each flange faces the gasket. */
  let y = odY + F + 6 + odLines.length * LH + 22;
  out.push(fdText(cx, y, [{ text: 'Side view: bolted joint, mating flange dashed', colour: C.muted, size: small }]));
  y += LH + 4;

  // Which thickness to draw: the one nearest the site measurement, else
  // weld neck / iron / the first listed.
  let tEntry = null;
  if (checks.thickness && checks.thickness.expected) tEntry = f.thickness.find((t) => t.mm === checks.thickness.expected);
  if (!tEntry) tEntry = f.thickness.find((t) => /Weld neck|iron|Flange thickness/i.test(t.label)) || f.thickness[0] || null;
  const tKnown = !!tEntry;
  const tMm = tKnown ? tEntry.mm : f.od * 0.08;      // stand-in if the table has no thickness
  const rfh = fdRaisedFaceHeight(f);
  // EN thickness includes the raised face; ASME thickness excludes it.
  const bodyMm = f.family === 'ASME B16.5' ? tMm : tMm - (rfh || 0);
  const gasketMm = 3;
  const d = f.boltDia;
  const headMm = 0.65 * d, nutMm = 0.8 * d;
  const boltLenMm = options.bolt ? options.bolt.bolt : null;

  const px = (mm) => mm * s;                   // mm -> drawing units
  const left = cx - R, wide = 2 * R;
  const rfLeft = rfR ? cx - rfR : null, rfWide = rfR ? 2 * rfR : null;
  // In side view the outermost bolts are seen at ±PCD/2 × cos(180°/n) from the centre.
  const boltXs = [cx - pcdR * Math.cos(Math.PI / f.n), cx + pcdR * Math.cos(Math.PI / f.n)];
  const boltW = px(d);

  const yHead = y;
  const yA = yHead + px(headMm);               // top (back) of this flange
  const yAface = yA + px(bodyMm);              // start of its raised face
  const yG = yAface + px(rfh || 0);            // top of gasket
  const yB = yG + px(gasketMm);                // mating raised face
  const yBbody = yB + px(rfh || 0);
  const yBend = yBbody + px(bodyMm);           // back of mating flange
  const yNutEnd = yBend + px(nutMm);
  const yBoltEnd = boltLenMm ? yA + px(boltLenMm) : yNutEnd + px(0.3 * d);

  // This flange (solid) and its raised face
  out.push(`<rect x="${left}" y="${yA}" width="${wide}" height="${px(bodyMm)}" fill="${C.metal}" stroke="${C.edge}" stroke-width="2" ${tKnown ? '' : 'stroke-dasharray="6 4"'}/>`);
  if (rfh) out.push(`<rect x="${rfLeft}" y="${yAface}" width="${rfWide}" height="${px(rfh)}" fill="${C.face}" stroke="${C.edge}" stroke-width="1.5"/>`);
  // Gasket (dark band) — inside the bolts: spans the raised face, or up to the bolts
  const gW = rfR ? rfWide : (boltXs[1] - boltXs[0] - boltW);
  out.push(`<rect x="${cx - gW / 2}" y="${yG}" width="${gW}" height="${px(gasketMm)}" fill="#333"/>`);
  // Mating flange (dashed outline)
  if (rfh) out.push(`<rect x="${rfLeft}" y="${yB}" width="${rfWide}" height="${px(rfh)}" fill="none" stroke="${C.muted}" stroke-dasharray="5 4"/>`);
  out.push(`<rect x="${left}" y="${yBbody}" width="${wide}" height="${px(bodyMm)}" fill="none" stroke="${C.muted}" stroke-width="1.5" stroke-dasharray="6 4"/>`);
  // Bore as hidden (dashed) lines through this flange
  if (boreR) for (const bx of [cx - boreR, cx + boreR]) out.push(fdLine(bx, yA, bx, yG, C.edge, 'stroke-dasharray="4 3"'));
  // Bolts: head, shank, nut
  for (const bx of boltXs) {
    out.push(`<rect x="${bx - boltW * 0.8}" y="${yHead}" width="${boltW * 1.6}" height="${px(headMm)}" fill="#8a96a3" stroke="${C.edge}"/>`);
    out.push(`<rect x="${bx - boltW / 2}" y="${yA}" width="${boltW}" height="${yBoltEnd - yA}" fill="#aab4bf" stroke="${C.edge}"/>`);
    out.push(`<rect x="${bx - boltW * 0.8}" y="${yBend}" width="${boltW * 1.6}" height="${px(nutMm)}" fill="#8a96a3" stroke="${C.edge}"/>`);
  }

  // Thickness dimension (left side)
  const tx = left - 14;
  out.push(fdLine(left - 4, yA, tx - 6, yA));
  out.push(fdLine(left - 4, yG, tx - 6, yG));
  out.push(fdDim(tx, yA, tx, yG));
  const tLines = (tKnown
    ? [{ text: `t ${fdLen(tMm, false)}`, bold: true }, { text: fdShortType(tEntry.label), size: tiny, colour: C.muted },
       inch ? { text: fdInch(tMm / 25.4), size: tiny, colour: C.muted } : null]
    : [{ text: 'thickness', size: small }, { text: 'not in table', size: tiny, colour: C.muted }]);
  const mt = fdMeasured(checks.thickness, false);
  if (mt) tLines.push({ ...mt, text: mt.text.replace(' mm', ''), size: tiny });
  out.push(fdText(tx - 8, yA + F * 0.4, tLines.filter(Boolean), 'end'));

  // Bolt length dimension (right side)
  const bxr = cx + R + 14;
  out.push(fdLine(boltXs[1] + boltW, yA, bxr + 6, yA));
  out.push(fdLine(boltXs[1] + boltW, yBoltEnd, bxr + 6, yBoltEnd));
  out.push(fdDim(bxr, yA, bxr, yBoltEnd));
  const bLines = [
    { text: boltLenMm ? `${f.bolt}×${boltLenMm}` : f.bolt, bold: true },
    { text: boltLenMm ? 'bolt (est.)' : 'length n/a', size: tiny, colour: C.muted },
    options.bolt ? { text: `stud ${options.bolt.stud}`, size: tiny, colour: C.muted } : null,
    checks.bolt && checks.bolt.status !== 'na'
      ? { text: `site Ø${fdRound(checks.bolt.measured)} ${FD_MARK[checks.bolt.status]}`, colour: C[checks.bolt.status], size: tiny } : null,
  ].filter(Boolean);
  out.push(fdText(bxr + 8, yA + F * 0.4, bLines, 'start'));

  // Captions under the side view (below whichever is lower: drawing or side labels)
  const labelsBottom = yA + F * 0.4 + (Math.max(tLines.filter(Boolean).length, bLines.length) - 1) * LH;
  let yc = Math.max(yBoltEnd, yNutEnd, labelsBottom) + LH + 12;
  const caps = [];
  if (rfh) caps.push(`Raised face Ø${fdRound(f.rf, 0)} × ${rfh} mm` + (f.family === 'ASME B16.5' ? ' (1/16")' : ' (EN 1092-1 f1)'));
  else caps.push('Flat face shown (no raised face height known)');
  if (f.thickness.length > 1) caps.push('Other types: ' + f.thickness.filter((t) => t !== tEntry).map((t) => `${fdShortType(t.label)} ${fdRound(t.mm)}`).join(', ') + ' mm');
  caps.push('3 mm gasket · bolt length is an estimate');
  out.push(fdText(cx, yc, caps.map((t) => ({ text: t, size: tiny, colour: C.muted }))));
  yc += caps.length * LH + 8;

  // Colour key
  const key = [['good', 'in tolerance'], ['close', 'close'], ['bad', 'outside']];
  const keyW = [7.2 * tiny, 4 * tiny, 4.5 * tiny];
  let kx = cx - (keyW[0] + keyW[1] + keyW[2]) / 2;
  key.forEach(([st, txt], i) => {
    out.push(`<circle cx="${kx}" cy="${yc - tiny * 0.35}" r="${tiny * 0.35}" fill="${C[st]}"/>`);
    out.push(fdText(kx + tiny * 0.7, yc, [{ text: txt, size: tiny, colour: C.muted }], 'start'));
    kx += keyW[i];
  });
  const height = Math.ceil(yc + 16);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FD.width} ${height}" class="flange-drawing"` +
    ` role="img" aria-label="Drawing of ${fdEsc(f.label)}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">` +
    `<defs><marker id="fdArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
    `<path d="M0,1 L10,5 L0,9 z" fill="${C.dim}"/></marker></defs>` +
    `<rect width="100%" height="100%" fill="#fff"/>` + out.join('') + `</svg>`;
}

/* =====================================================================
 * drawOverlay(a, b, options)  —  TWO FLANGES' BOLT CIRCLES ON TOP OF EACH OTHER
 * ---------------------------------------------------------------------
 * Used by the "Adapters" tab. Flange A is drawn in blue, flange B in
 * orange, both centred and to the same scale, so a mismatch in PCD or
 * bolt count is visible at a glance. Holes are semi-transparent: where a
 * blue and an orange hole overlap you can see how much room a bolt has.
 * When both flanges have the same number of bolts, a zoomed inset shows
 * ONE hole pair with the largest bolt that passes through both.
 *   a, b      flange objects from expandTables() (all lengths in mm)
 *   options   { compact: true on a phone (bigger text),
 *               fit: result of compareDrilling() (draws the bolt in the inset) }
 * Returns an SVG string.
 * ===================================================================== */
const FD_A = '#0b5cad', FD_B = '#d35400', FD_BOLT = '#1a8a4a';

function drawOverlay(a, b, options = {}) {
  const C = FD.colours;
  FD.font = options.compact ? 25 : 19;
  FD.R = options.compact ? 160 : 185;
  const F = FD.font, LH = F + 4, small = F - 3, tiny = F - 5;
  const { cx, R } = FD;
  const out = [];
  const s = R / (Math.max(a.od, b.od) / 2);              // one scale for both flanges

  // Legend (the two flange names, in their colours)
  const nameOf = (f) => `${f.family} ${f.rating} ${f.nps ? `${f.nps}"` : `DN${f.dn}`}`;
  const lg = (tag, f, colour) => ({ text: `${tag}  ${nameOf(f)}`, colour, bold: true, size: Math.min(F + 2, Math.floor(1000 / (nameOf(f).length + 4))) });
  out.push(fdText(cx, F + 12, [lg('● A', a, FD_A), lg('● B', b, FD_B)]));

  const topOfFace = F + 12 + 2 * LH + 14;
  const cy = topOfFace + R;
  const odRa = (a.od / 2) * s, odRb = (b.od / 2) * s;
  const pcdRa = (a.pcd / 2) * s, pcdRb = (b.pcd / 2) * s;
  const holeRa = Math.max(2.5, (a.hole / 2) * s), holeRb = Math.max(2.5, (b.hole / 2) * s);

  // Bodies: A solid light blue, B as an orange dashed outline
  out.push(`<circle cx="${cx}" cy="${cy}" r="${fdRound(odRa, 2)}" fill="#e3edf8" stroke="${FD_A}" stroke-width="2"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="${fdRound(odRb, 2)}" fill="none" stroke="${FD_B}" stroke-width="2" stroke-dasharray="9 5"/>`);
  out.push(fdLine(cx - R - 12, cy, cx + R + 12, cy, C.muted, 'stroke-dasharray="14 4 3 4"'));
  out.push(fdLine(cx, cy - R - 8, cx, cy + R + 12, C.muted, 'stroke-dasharray="14 4 3 4"'));
  // Bolt circles
  out.push(`<circle cx="${cx}" cy="${cy}" r="${fdRound(pcdRa, 2)}" fill="none" stroke="${FD_A}" stroke-width="1.4" stroke-dasharray="7 5"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="${fdRound(pcdRb, 2)}" fill="none" stroke="${FD_B}" stroke-width="1.4" stroke-dasharray="3 4"/>`);
  // Holes (class names let the tests count them)
  const holes = (f, pcdR, holeR, colour, cls) => fdHoleAngles(f.n).map((ang) =>
    `<circle class="${cls}" cx="${fdRound(cx + pcdR * Math.sin(ang), 2)}" cy="${fdRound(cy - pcdR * Math.cos(ang), 2)}"` +
    ` r="${fdRound(holeR, 2)}" fill="${colour}" fill-opacity="0.28" stroke="${colour}" stroke-width="1.6"/>`).join('');
  out.push(holes(a, pcdRa, holeRa, FD_A, 'bolt-hole-a'));
  out.push(holes(b, pcdRb, holeRb, FD_B, 'bolt-hole-b'));

  // PCD labels: A on the vertical centre line at the top, B at the bottom (halo keeps them readable)
  out.push(fdText(cx, cy - pcdRa + F * 0.35, [{ text: `PCD ${fdRound(a.pcd)}`, colour: FD_A, bold: true, size: small }]));
  out.push(fdText(cx, cy + pcdRb + F * 0.15, [{ text: `PCD ${fdRound(b.pcd)}`, colour: FD_B, bold: true, size: small }]));

  // Values under the face view
  let y = cy + R + 30;
  const vals = (tag, f, colour) => ({ text: `${tag}: OD ${fdRound(f.od)} · PCD ${fdRound(f.pcd)} · ${f.n} × Ø${fdRound(f.hole)} (${f.bolt})`, colour, size: small, bold: true });
  out.push(fdText(cx, y, [vals('A', a, FD_A), vals('B', b, FD_B)]));
  y += 2 * LH + 6;

  // Zoomed inset: one hole pair (only when the bolt counts match, so the holes pair up)
  if (a.n === b.n) {
    const dRad = Math.abs(a.pcd - b.pcd) / 2;               // how far apart the hole centres are
    const rA = a.hole / 2, rB = b.hole / 2;
    const z = 66 / (Math.max(rA, rB) + dRad / 2);           // zoom factor
    const mid = (a.pcd + b.pcd) / 4;                        // radial position midway between the two holes
    const insetCy = y + 12 + Math.max(rA, rB) * z + dRad * z / 2 + 8;
    const xa = cx + (a.pcd / 2 - mid) * z, xb = cx + (b.pcd / 2 - mid) * z;
    out.push(fdText(cx, y, [{ text: `Zoom ×${fdRound(z / s, 0)}: one hole pair  (flange centre ← → outside edge)`, colour: C.muted, size: tiny }]));
    out.push(`<circle cx="${fdRound(xa, 2)}" cy="${insetCy}" r="${fdRound(rA * z, 2)}" fill="${FD_A}" fill-opacity="0.22" stroke="${FD_A}" stroke-width="2"/>`);
    out.push(`<circle cx="${fdRound(xb, 2)}" cy="${insetCy}" r="${fdRound(rB * z, 2)}" fill="${FD_B}" fill-opacity="0.22" stroke="${FD_B}" stroke-width="2"/>`);
    const fit = options.fit;
    if (fit && fit.maxBolt > 0) {
      // largest bolt that passes through both holes, sitting in the overlap of the two circles
      const left = Math.max(xa - rA * z, xb - rB * z), right = Math.min(xa + rA * z, xb + rB * z);
      const boltD = fit.chosenBolt || fit.maxBolt;
      const bx = (left + right) / 2;
      out.push(`<circle class="bolt-pass" cx="${fdRound(bx, 2)}" cy="${insetCy}" r="${fdRound((boltD / 2) * z, 2)}" fill="${FD_BOLT}" fill-opacity="0.35" stroke="${FD_BOLT}" stroke-width="2"/>`);
    }
    y = insetCy + Math.max(rA, rB) * z + 22;
    const capLines = [
      { text: `A hole Ø${fdRound(a.hole)} · B hole Ø${fdRound(b.hole)} · centres ${fdRound(dRad, 1)} mm apart`, colour: C.muted, size: tiny },
    ];
    if (fit && fit.maxBolt > 0) {
      capLines.push({ text: `Largest bolt through both holes: Ø${fdRound(fit.maxBolt, 1)} mm (green = ${fit.chosenLabel || 'that bolt'})`, colour: FD_BOLT, size: tiny, bold: true });
    }
    out.push(fdText(cx, y, capLines));
    y += capLines.length * LH + 4;
  } else {
    out.push(fdText(cx, y, [
      { text: `${a.n} bolts vs ${b.n} bolts: the holes cannot pair up`, colour: FD_B, size: small, bold: true },
    ]));
    y += LH + 4;
  }
  const height = Math.ceil(y + 14);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FD.width} ${height}" class="flange-drawing flange-overlay"` +
    ` role="img" aria-label="Bolt circles of ${fdEsc(nameOf(a))} and ${fdEsc(nameOf(b))} overlaid"` +
    ` font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"><rect width="100%" height="100%" fill="#fff"/>` +
    out.join('') + `</svg>`;
}

if (typeof module !== 'undefined') module.exports = { drawFlange, drawOverlay, fdHoleAngles, fdRaisedFaceHeight };
