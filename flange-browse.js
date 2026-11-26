/* =====================================================================
 * flange-browse.js  —  "BROWSE STANDARDS" MODE
 * ---------------------------------------------------------------------
 * A reference catalogue: pick a standard (e.g. EN 1092-1 PN16 or
 * BS 10 Table D), pick a size, and see every dimension, the drawing,
 * flanges with the same drilling, and the whole range in one table.
 *
 * The file has two halves:
 *   1. PURE FUNCTIONS  — take flange data in, give text/HTML out.
 *      No web page needed, so tests.js can check them in Node.
 *   2. SCREEN CODE     — initBrowse() wires the drop-downs and buttons
 *      on the page to those functions. Only runs in a browser.
 *
 * It re-uses the data from flange-data.js and the helpers in
 * flange-logic.js (round, inchFraction, chordFromPcd, boltLength ...)
 * and drawFlange() from flange-drawing.js. Nothing is copied.
 * ===================================================================== */

// In a browser, flange-logic.js has already been loaded, so its functions
// are simply there. In Node (the tests) we have to require() them.
const BL = (typeof module !== 'undefined' && typeof round === 'undefined')
  ? require('./flange-logic.js')
  : { round, inchFraction, chordFromPcd, boltLength, gasketInfo, sameDrilling, MM_PER_INCH };

/* =====================================================================
 * 1. PURE FUNCTIONS
 * ===================================================================== */

// The order standards appear in the first drop-down, grouped by family.
// UK water favourites (EN PN16/PN10, BS 10 Table D) come near the top.
const BROWSE_GROUPS = [
  { label: 'EN 1092-1 steel (BS 4504 / DIN)', family: 'EN 1092-1' },
  { label: 'EN 1092-2 ductile / cast iron',  family: 'EN 1092-2' },
  { label: 'BS 10 (old imperial UK)',         family: 'BS 10' },
  { label: 'ASME B16.5 (American)',           family: 'ASME B16.5' },
];

// Quick-pick buttons shown above the drop-downs (most used in UK water).
const BROWSE_QUICK = [
  { id: 'EN1092-1_PN16', text: 'PN16' },
  { id: 'EN1092-1_PN10', text: 'PN10' },
  { id: 'BS10_D',        text: 'Table D' },
  { id: 'BS10_E',        text: 'Table E' },
  { id: 'ASME_150',      text: 'Class 150' },
];

const BROWSE_DEFAULT = { tableId: 'EN1092-1_PN16', flangeId: 'EN1092-1_PN16_100' };

// Make text safe to put inside HTML (stops "<" breaking the page).
function bEsc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Length in mm -> "220 mm", plus "(8 11/16")" for imperial standards or
// when the user ticked "show inches".
function bFmt(mm, f, showInch, dp = 1) {
  if (mm === null || mm === undefined) return '—';
  let s = `${BL.round(mm, dp)} mm`;
  if (showInch || f.unit === 'in') s += ` <span class="rsub">(${BL.inchFraction(mm / BL.MM_PER_INCH)})</span>`;
  return s;
}

// List of standards for drop-down 1: [{ group, items:[{id, text}] }]
function browseStandards(tables) {
  return BROWSE_GROUPS.map((g) => ({
    group: g.label,
    items: tables.filter((t) => t.family === g.family).map((t) => ({ id: t.id, text: `${t.family} ${t.rating}` })),
  })).filter((g) => g.items.length);
}

// Every size in one standard, smallest first (drop-down 2 and the table).
function browseSizes(flanges, tableId) {
  return flanges.filter((f) => f.tableId === tableId).sort((a, b) => a.dn - b.dn);
}

// When you switch standard, keep the "same" size if it exists there,
// otherwise the nearest DN. E.g. PN16 DN100 -> Table D 4" (≈DN100).
function nearestSize(flanges, tableId, dn) {
  const sizes = browseSizes(flanges, tableId);
  if (!sizes.length) return null;
  return sizes.reduce((best, f) => (Math.abs(f.dn - dn) < Math.abs(best.dn - dn) ? f : best), sizes[0]);
}

// Step to the previous (-1) or next (+1) size, stopping at the ends.
function stepSize(flanges, flangeId, step) {
  const f = flanges.find((x) => x.id === flangeId);
  if (!f) return null;
  const sizes = browseSizes(flanges, f.tableId);
  const i = sizes.indexOf(f) + step;
  return sizes[Math.max(0, Math.min(sizes.length - 1, i))];
}

// Other flanges (any standard) that bolt straight on: same OD, PCD, bolt count.
function sameDrillingAs(flanges, f) {
  return flanges.filter((x) => x.id !== f.id && BL.sameDrilling(x, f));
}

// The classic trap: same number of bolts and a PCD within 4 mm, but NOT
// the same drilling (e.g. BS 10 Table E 4" on 177.8 PCD vs PN16 DN100 on
// 180). They look the same on site but the bolts won't line up properly.
function lookAlikes(flanges, f) {
  return flanges.filter((x) => x.id !== f.id && x.n === f.n &&
    Math.abs(x.pcd - f.pcd) <= 4 && !BL.sameDrilling(x, f));
}

// Small clickable chips for a list of flanges (tap = compare with it).
function chipList(list) {
  return list.map((x) => `<button type="button" class="drawbtn" data-cmp="${bEsc(x.id)}">${bEsc(x.label)}</button>`).join('');
}

// The full details card for one flange (HTML text).
function browseDetailsHTML(f, flanges, showInch = false) {
  const bl = BL.boltLength(f);                 // no site thickness: uses the thickest type
  const gk = BL.gasketInfo(f);
  const chord = BL.chordFromPcd(f.pcd, f.n);
  const twins = sameDrillingAs(flanges, f);
  const alikes = lookAlikes(flanges, f);
  const thick = f.thickness.map((t) => `${bFmt(t.mm, f, showInch)} – ${bEsc(t.label)}`).join('<br>') || '—';

  return `
  <div class="rtitle">${bEsc(f.label)}</div>
  <div class="rsub">${bEsc(f.material)}${f.aliases.length ? ' · also called ' + bEsc(f.aliases.slice(0, 3).join(', ')) : ''}</div>
  ${f.flags.map((fl) => `<div class="flag">⚠ Not fully verified: ${bEsc(fl)}</div>`).join('')}
  ${twins.length ? `<div class="twin"><b>Same drilling as</b> (they bolt together; tap one to compare):
      <div class="drawbtns">${chipList(twins)}</div></div>` : ''}
  ${alikes.length ? `<div class="flag"><b>Looks similar but is NOT the same drilling</b> (bolt count matches, PCD within 4 mm):
      <div class="drawbtns">${chipList(alikes)}</div></div>` : ''}
  <table class="spec">
    <tr><th>Nominal size</th><td>DN${f.dn}${f.nps ? ` / ${bEsc(f.nps)}"` : ''}</td></tr>
    <tr><th>Outside diameter (D)</th><td>${bFmt(f.od, f, showInch)}${f.odAlt.length ? ` or ${bFmt(f.odAlt[0], f, showInch)} (ductile iron)` : ''}</td></tr>
    <tr><th>PCD (K)</th><td>${bFmt(f.pcd, f, showInch)}</td></tr>
    <tr><th>Bolts</th><td><b>${f.n} × ${bEsc(f.bolt)}</b>${f.nAlt.length ? ` (or ${f.nAlt.join('/')} holes)` : ''}</td></tr>
    <tr><th>Bolt hole (L)</th><td>${bFmt(f.hole, f, showInch)}</td></tr>
    <tr><th>Adjacent bolt centres</th><td>${bFmt(chord, f, showInch)} <span class="rsub">= PCD × sin(180°/${f.n})</span></td></tr>
    <tr><th>Flange thickness</th><td>${thick}</td></tr>
    <tr><th>Raised face Ø (d1)</th><td>${f.rf ? bFmt(f.rf, f, showInch, 0) : '— (flat face)'}</td></tr>
    <tr><th>Pipe OD</th><td>${bFmt(f.pipeOD, f, showInch)}</td></tr>
    <tr><th>Bolt length (estimate)</th><td>${bl ? `${f.n} × ${bEsc(f.bolt)} × ${bl.bolt} mm bolts, or ${bl.stud} mm studs
        <div class="note">Flange to flange of the same type, ${bl.thicknessUsed} mm thick, 3 mm gasket. Check against the actual fitting.</div>` : '—'}</td></tr>
    <tr><th>Gasket (estimate)</th><td>${bEsc(gk.text)}</td></tr>
  </table>
  ${f.notes.map((n) => `<div class="note">• ${bEsc(n)}</div>`).join('')}
  <div class="note">Source: ${bEsc(f.sources.join('; '))}</div>`;
}

// The whole range for one standard as a compact table. The selected row
// gets class="sel"; every row carries data-id so a tap can select it.
function browseRangeHTML(flanges, tableId, selectedId) {
  const rows = browseSizes(flanges, tableId);
  if (!rows.length) return '<div class="empty">No sizes</div>';
  const inch = rows[0].unit === 'in';
  const c = (mm) => (mm === null || mm === undefined ? '—'
    : inch ? `${BL.round(mm)}<small>${BL.inchFraction(mm / BL.MM_PER_INCH)}</small>` : BL.round(mm));
  const head = ['Size', 'OD', 'PCD', 'Bolts', 'Hole', 'Chord', 'Thk', 'RF Ø'];
  return `<table class="data range"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${rows.map((f) => `<tr data-id="${bEsc(f.id)}"${f.id === selectedId ? ' class="sel"' : ''}>
      <td>${f.flags.length ? '⚠' : ''}${bEsc(f.sizeLabel)}</td><td>${c(f.od)}</td><td>${c(f.pcd)}</td>
      <td>${f.n}×${bEsc(f.bolt)}</td><td>${c(f.hole)}</td><td>${BL.round(BL.chordFromPcd(f.pcd, f.n))}</td>
      <td>${f.thickness.length ? BL.round(Math.max(...f.thickness.map((t) => t.mm))) : '—'}</td><td>${c(f.rf)}</td></tr>`).join('')}
  </tbody></table>`;
}

// Side-by-side comparison of two flanges. Values that differ get
// class="diff" (highlighted), and a one-line verdict says whether they
// will bolt together.
function compareHTML(a, b) {
  const num = (x) => (x === null || x === undefined ? null : x);
  const maxT = (f) => (f.thickness.length ? Math.max(...f.thickness.map((t) => t.mm)) : null);
  const rows = [
    ['Size', a.sizeLabel, b.sizeLabel, false],
    ['OD', num(a.od), num(b.od), true],
    ['PCD', num(a.pcd), num(b.pcd), true],
    ['Bolts', a.n, b.n, true],
    ['Bolt size', a.bolt, b.bolt, false],
    ['Hole Ø', num(a.hole), num(b.hole), true],
    ['Bolt centres', BL.chordFromPcd(a.pcd, a.n), BL.chordFromPcd(b.pcd, b.n), true],
    ['Thickness', maxT(a), maxT(b), true],
    ['Raised face Ø', num(a.rf), num(b.rf), true],
    ['Pipe OD', num(a.pipeOD), num(b.pipeOD), true],
  ];
  // Numbers count as "different" if more than 0.5 mm apart.
  const differs = (x, y, isNum) => (isNum && x !== null && y !== null ? Math.abs(x - y) > 0.5 : String(x) !== String(y));
  const show = (x, isNum) => (x === null ? '—' : isNum && typeof x === 'number' && !Number.isInteger(x) ? BL.round(x) : bEsc(x));

  // Verdict: does the bolt pattern line up?
  let verdict;
  if (BL.sameDrilling(a, b)) {
    verdict = `<div class="vgood">✓ Same drilling — these bolt together.${Math.abs(a.hole - b.hole) > 0.5 ? ' (Hole sizes differ slightly.)' : ''}</div>`;
  } else {
    const why = [];
    if (a.n !== b.n) why.push(`${a.n} vs ${b.n} bolts`);
    if (Math.abs(a.pcd - b.pcd) > 0.5) why.push(`PCD ${BL.round(a.pcd)} vs ${BL.round(b.pcd)} mm`);
    if (Math.abs(a.od - b.od) > 0.5) why.push(`OD ${BL.round(a.od)} vs ${BL.round(b.od)} mm`);
    if (!why.length) why.push('bolt holes differ');
    verdict = `<div class="vbad">✗ Not the same drilling: ${bEsc(why.join(', '))}.</div>`;
  }
  return `${verdict}
  <table class="data cmp"><thead><tr><th></th><th>${bEsc(a.family + ' ' + a.rating)}</th><th>${bEsc(b.family + ' ' + b.rating)}</th></tr></thead><tbody>
  ${rows.map(([name, x, y, isNum]) => `<tr${differs(x, y, isNum) ? ' class="diff"' : ''}><th>${name}</th><td>${show(x, isNum)}</td><td>${show(y, isNum)}</td></tr>`).join('')}
  </tbody></table>
  <div class="note">All values mm. Highlighted rows differ. Thickness = thickest listed type.</div>`;
}

/* =====================================================================
 * 2. SCREEN CODE (browser only)
 * ---------------------------------------------------------------------
 * state = what is selected. It is saved in localStorage so the app opens
 * where you left it next time.
 * ===================================================================== */
const BROWSE_KEY = 'flangeIdentifier.browse';

function loadBrowseState() {
  try { return JSON.parse(localStorage.getItem(BROWSE_KEY)) || {}; } catch (e) { return {}; }
}
function saveBrowseState(state) {
  try { localStorage.setItem(BROWSE_KEY, JSON.stringify(state)); } catch (e) { /* private mode: ignore */ }
}

// flanges = every flange (expandTables output), tables = FLANGE_TABLES.
function initBrowse(flanges, tables) {
  const $ = (id) => document.getElementById(id);
  const byId = (id) => flanges.find((f) => f.id === id);
  const saved = loadBrowseState();
  const state = {
    flangeId: byId(saved.flangeId) ? saved.flangeId : BROWSE_DEFAULT.flangeId,
    cmpId: byId(saved.cmpId) ? saved.cmpId : null,
    showInch: !!saved.showInch,
  };

  // Fill drop-down 1 (standards), grouped with <optgroup>.
  const stdOptions = browseStandards(tables).map((g) =>
    `<optgroup label="${bEsc(g.group)}">${g.items.map((i) => `<option value="${i.id}">${bEsc(i.text)}</option>`).join('')}</optgroup>`).join('');
  $('bStd').innerHTML = stdOptions;
  $('cStd').innerHTML = '<option value="">— nothing —</option>' + stdOptions;
  $('bQuick').innerHTML = BROWSE_QUICK.map((q) => `<button type="button" class="drawbtn" data-std="${q.id}">${q.text}</button>`).join('');
  $('bShowInch').checked = state.showInch;

  // Fill a size drop-down for one standard.
  function fillSizes(selectEl, tableId, selectedId) {
    selectEl.innerHTML = browseSizes(flanges, tableId).map((f) =>
      `<option value="${f.id}"${f.id === selectedId ? ' selected' : ''}>${bEsc(f.sizeLabel)}${f.nps ? ` (≈DN${f.dn})` : ''}${f.flags.length ? ' ⚠' : ''}</option>`).join('');
  }

  // Redraw everything from `state`. Called after every change.
  function render() {
    const f = byId(state.flangeId);
    $('bStd').value = f.tableId;
    fillSizes($('bSize'), f.tableId, f.id);
    const sizes = browseSizes(flanges, f.tableId);
    $('bPrev').disabled = sizes[0] === f;
    $('bNext').disabled = sizes[sizes.length - 1] === f;
    document.querySelectorAll('#bQuick .drawbtn').forEach((b) => b.classList.toggle('on', b.dataset.std === f.tableId));

    $('bDetails').innerHTML = browseDetailsHTML(f, flanges, state.showInch);

    // The drawing: same function as Identify mode, but no site values.
    $('bDrawing').innerHTML = drawFlange(f, {
      showInch: state.showInch, bolt: BL.boltLength(f), compact: $('bDrawing').clientWidth < 520,
    });

    // Range table, then scroll the box (not the page) to the selected row.
    $('bRange').innerHTML = browseRangeHTML(flanges, f.tableId, f.id);
    $('bRangeTitle').textContent = `${f.family} ${f.rating} — all sizes`;
    const box = $('bRange'), row = box.querySelector('tr.sel');
    if (row && (row.offsetTop < box.scrollTop + 30 || row.offsetTop > box.scrollTop + box.clientHeight - 30)) {
      box.scrollTop = row.offsetTop - box.clientHeight / 2;
    }

    // Compare (optional)
    const c = state.cmpId && byId(state.cmpId);
    $('cStd').value = c ? c.tableId : '';
    $('cSize').hidden = !c;
    if (c) {
      fillSizes($('cSize'), c.tableId, c.id);
      $('cOut').innerHTML = compareHTML(f, c);
    } else {
      $('cOut').innerHTML = '<div class="note">Pick a second standard to see two flanges side by side — e.g. PN16 against BS 10 Table D.</div>';
    }
    saveBrowseState(state);
  }

  // Exposed so index.html can redraw when the mode tab is opened / resized.
  initBrowse.render = render;
  initBrowse.select = (id) => { if (byId(id)) { state.flangeId = id; render(); } };

  // --- wire up the controls ---
  $('bStd').addEventListener('change', () => {
    state.flangeId = nearestSize(flanges, $('bStd').value, byId(state.flangeId).dn).id; render();
  });
  $('bQuick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-std]');
    if (b) { state.flangeId = nearestSize(flanges, b.dataset.std, byId(state.flangeId).dn).id; render(); }
  });
  $('bSize').addEventListener('change', () => { state.flangeId = $('bSize').value; render(); });
  $('bPrev').addEventListener('click', () => { state.flangeId = stepSize(flanges, state.flangeId, -1).id; render(); });
  $('bNext').addEventListener('click', () => { state.flangeId = stepSize(flanges, state.flangeId, +1).id; render(); });
  $('bShowInch').addEventListener('change', () => { state.showInch = $('bShowInch').checked; render(); });
  $('bRange').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) { state.flangeId = tr.dataset.id; render(); }
  });
  $('cStd').addEventListener('change', () => {
    const t = $('cStd').value;
    state.cmpId = t ? nearestSize(flanges, t, byId(state.flangeId).dn).id : null; render();
  });
  $('cSize').addEventListener('change', () => { state.cmpId = $('cSize').value; render(); });
  // "Same drilling as" / "looks similar" chips: tap = compare with that one.
  $('bDetails').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmp]');
    if (b) { state.cmpId = b.dataset.cmp; render(); $('cCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
}

// Make the pure functions available to the Node tests.
if (typeof module !== 'undefined') {
  module.exports = {
    browseStandards, browseSizes, nearestSize, stepSize, sameDrillingAs, lookAlikes,
    browseDetailsHTML, browseRangeHTML, compareHTML, BROWSE_DEFAULT,
  };
}
