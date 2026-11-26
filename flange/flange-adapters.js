/* =====================================================================
 * flange-adapters.js  —  "ADAPTERS" MODE
 * ---------------------------------------------------------------------
 * Pick two flanges (A and B). The app says whether they bolt together,
 * and if not, which real conversion products bridge the pair.
 *
 * The file has two halves:
 *   1. PURE FUNCTIONS  — flange data in, verdict / HTML text out. No web
 *      page needed, so tests.js can check them in Node.
 *   2. SCREEN CODE     — initAdapters() wires the drop-downs and buttons.
 *
 * It re-uses flange-data.js (the flanges), flange-logic.js (helpers),
 * flange-drawing.js (drawOverlay) and flange-adapters-data.js (products).
 * Names here start with "ad" / "ADL" / "ADD" so they never clash with the
 * other files, which all share one page.
 * ===================================================================== */

const ADL = (typeof module !== 'undefined' && typeof round === 'undefined')
  ? require('./flange-logic.js')
  : { round, inchFraction, boltDiameterMm, MM_PER_INCH };
const ADD = (typeof module !== 'undefined' && typeof ADAPTER_PRODUCTS === 'undefined')
  ? require('./flange-adapters-data.js')
  : { ADAPTER_PRODUCTS, ADAPTER_GUIDANCE, ADAPTER_PRESETS, ADAPTER_CHECKED };

/* =====================================================================
 * 1. PURE FUNCTIONS
 * ===================================================================== */

function adEsc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function adGcd(x, y) { return y ? adGcd(y, x % y) : x; }

// How the PCDs of two flanges can differ before we call them "the same drilling".
const AD_SAME_PCD = 0.5;      // mm. Same as sameDrilling() in flange-logic.js.
const AD_TIGHT = 2;           // mm. Less spare room than this in the hole = marginal.

// Standard bolt sizes, in mm, for "the largest bolt that passes".
const AD_METRIC_BOLTS = [10, 12, 16, 20, 22, 24, 27, 30, 33, 36, 39, 42, 45, 48, 52, 56];
const AD_IMPERIAL_BOLTS = [0.5, 0.625, 0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5];   // inches

/* The biggest round bolt that fits through a hole in flange A AND the
 * matching hole in flange B. The two holes are circles whose centres are
 * `offset` mm apart (half the PCD difference, measured along the radius).
 * A bolt has to sit inside BOTH circles, i.e. inside the overlap ("lens").
 *   - one hole swallows the other  → the smaller hole's diameter
 *   - otherwise                    → (rA + rB − offset) as a diameter
 *   - circles do not touch         → 0                                   */
function lensMaxBolt(holeA, holeB, offset) {
  const rA = holeA / 2, rB = holeB / 2;
  if (offset >= rA + rB) return 0;
  if (offset <= Math.abs(rA - rB)) return 2 * Math.min(rA, rB);
  return rA + rB - offset;
}

/* Compare the drilling of two flanges.
 * Returns { status, ... }
 *   status 'direct'  same bolt count and PCD (within 0.5 mm): bolt up directly
 *          'fit'     same bolt count, PCD differs, but a bolt still goes through both
 *                    sets of holes (maybe a smaller bolt, maybe a tight fit)
 *          'adapter' bolt pattern differs: a converter or dual-drilled part is needed
 *   other fields: sameN, dPcd, offset, dOD, maxBolt, chosenBolt, chosenLabel,
 *                 largestMetric, largestImperial, undersized, tight, partial          */
function compareDrilling(a, b) {
  const sameN = a.n === b.n;
  const dPcd = Math.abs(a.pcd - b.pcd);
  const offset = dPcd / 2;
  const r = {
    sameN, dPcd, offset, dOD: Math.abs(a.od - b.od),
    holeDiff: Math.abs(a.hole - b.hole),
    maxBolt: null, chosenBolt: null, chosenLabel: null, largestMetric: null, largestImperial: null,
    undersized: false, tight: false, partial: 0, status: 'adapter',
  };
  if (sameN) {
    r.maxBolt = lensMaxBolt(a.hole, b.hole, offset);
    const metric = AD_METRIC_BOLTS.filter((d) => d <= r.maxBolt + 1e-6).pop();
    const imperial = AD_IMPERIAL_BOLTS.filter((i) => i * ADL.MM_PER_INCH <= r.maxBolt + 1e-6).pop();
    r.largestMetric = metric ? `M${metric}` : null;
    r.largestImperial = imperial ? ADL.inchFraction(imperial) : null;
  }
  if (sameN && dPcd <= AD_SAME_PCD) {
    r.status = 'direct';
    r.maxBolt = Math.min(a.hole, b.hole);
    r.chosenBolt = Math.min(a.boltDia, b.boltDia);
    r.chosenLabel = a.boltDia <= b.boltDia ? a.bolt : b.bolt;
    return r;
  }
  if (sameN) {
    // Which of the two flanges' own bolt sizes still goes through both holes? Take the larger.
    const own = [{ d: a.boltDia, label: a.bolt }, { d: b.boltDia, label: b.bolt }]
      .filter((x) => x.d <= r.maxBolt + 1e-6).sort((x, y) => y.d - x.d);
    if (own.length) {
      r.status = 'fit';
      r.chosenBolt = own[0].d;
      r.chosenLabel = own[0].label;
      r.undersized = own[0].d < Math.max(a.boltDia, b.boltDia) - 0.01;
      r.tight = r.maxBolt - own[0].d < AD_TIGHT;
    }
  }
  if (r.status === 'adapter') {
    // Different bolt count: how many holes could line up if one flange is rotated?
    // (gcd of the two counts), and only if the bolt circles are close enough.
    const g = adGcd(a.n, b.n);
    const lens = lensMaxBolt(a.hole, b.hole, offset);
    if (!sameN && g >= 2 && lens >= Math.min(a.boltDia, b.boltDia) - 1e-6) r.partial = g;
  }
  return r;
}

// Length in mm (+ inches for imperial standards), plain text.
function adLen(mm, f, dp = 1) {
  if (mm === null || mm === undefined) return '—';
  const s = `${ADL.round(mm, dp)}`;
  return f && f.unit === 'in' ? `${s} (${ADL.inchFraction(mm / ADL.MM_PER_INCH)})` : s;
}

// The side-by-side table: OD, PCD, bolts, hole, bolt size. Rows that differ are highlighted.
function adTableHTML(a, b) {
  const rows = [
    ['Size', a.sizeLabel + (a.nps ? ` (≈DN${a.dn})` : ''), b.sizeLabel + (b.nps ? ` (≈DN${b.dn})` : ''), false, false],
    ['Outside Ø (OD)', adLen(a.od, a), adLen(b.od, b), a.od, b.od],
    ['PCD', adLen(a.pcd, a), adLen(b.pcd, b), a.pcd, b.pcd],
    ['Number of bolts', a.n, b.n, a.n, b.n],
    ['Bolt hole Ø', adLen(a.hole, a), adLen(b.hole, b), a.hole, b.hole],
    ['Bolt size', adEsc(a.bolt), adEsc(b.bolt), a.boltDia, b.boltDia],
  ];
  const diff = (x, y) => x !== false && Math.abs(x - y) > 0.5;
  return `<div class="scroll"><table class="data cmp adcmp"><thead><tr><th></th>
    <th style="color:#0b5cad">A: ${adEsc(a.family + ' ' + a.rating)}</th><th style="color:#d35400">B: ${adEsc(b.family + ' ' + b.rating)}</th></tr></thead><tbody>
    ${rows.map(([name, x, y, nx, ny]) => `<tr${diff(nx, ny) ? ' class="diff"' : ''}><th>${name}</th><td>${x}</td><td>${y}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="note">All lengths in mm. Highlighted rows differ (by more than 0.5 mm). Bolt sizes are the standard's nominal size.</div>`;
}

// The big verdict box and the reasons under it.
function adVerdictHTML(a, b, fit) {
  const names = `${adEsc(a.label)} and ${adEsc(b.label)}`;
  const pcdText = `PCD ${ADL.round(a.pcd)} mm vs ${ADL.round(b.pcd)} mm (${ADL.round(fit.dPcd, 1)} mm apart: the holes sit ${ADL.round(fit.offset, 1)} mm off-centre)`;
  const lines = [];
  let box;
  if (fit.status === 'direct') {
    box = `<div class="vgood">✓ Identical drilling — these bolt together directly.</div>`;
    lines.push(`Same bolt count (${a.n}) and PCD (${ADL.round(a.pcd)} mm).`);
    if (fit.holeDiff > 0.5) lines.push(`Hole sizes differ a little (Ø${ADL.round(a.hole)} vs Ø${ADL.round(b.hole)} mm). Use bolts that suit the smaller hole (${adEsc(fit.chosenLabel)}).`);
    if (fit.dOD > 0.5) lines.push(`The outside diameters differ (${ADL.round(a.od)} vs ${ADL.round(b.od)} mm), but the bolt holes still line up.`);
    lines.push('Check the faces and the gasket too (raised face against flat face, thickness).');
  } else if (fit.status === 'fit') {
    box = `<div class="vfit">~ ${fit.tight ? 'Bolts only just fit' : 'Bolts will fit'} — different hole size or bolt size${fit.tight ? ' (marginal)' : ''}.</div>`;
    lines.push(`Same bolt count (${a.n}), but ${pcdText}.`);
    lines.push(`The largest bolt that goes through both sets of holes is Ø${ADL.round(fit.maxBolt, 1)} mm: ${[fit.largestMetric, fit.largestImperial].filter(Boolean).map(adEsc).join(' or ')}.`);
    if (fit.undersized) lines.push(`That is smaller than the bolt one of the flanges is designed for (${adEsc(a.bolt)} on A, ${adEsc(b.bolt)} on B). The joint is limited to the weaker bolting.`);
    if (fit.tight) lines.push(`Only ${ADL.round(fit.maxBolt - fit.chosenBolt, 1)} mm to spare, so the bolts will bear hard on one side of the holes and the flange faces will not centre. Most UK water companies would specify a converter here: see the products below.`);
    lines.push('A full-face gasket will not suit both patterns. Use a ring gasket. Check the pressure rating of the older flange and with the asset owner before relying on this.');
  } else {
    box = `<div class="vbad">✗ Not compatible — an adapter is needed.</div>`;
    const why = [];
    if (!fit.sameN) why.push(`${a.n} bolts vs ${b.n} bolts`);
    if (fit.dPcd > AD_SAME_PCD) why.push(pcdText);
    if (fit.sameN && fit.maxBolt !== null && fit.maxBolt < Math.min(a.boltDia, b.boltDia)) {
      why.push(`even the smaller flange's bolt (${adEsc(a.boltDia <= b.boltDia ? a.bolt : b.bolt)}, Ø${ADL.round(Math.min(a.boltDia, b.boltDia), 1)} mm) will not go through both holes (the overlap is only Ø${ADL.round(fit.maxBolt, 1)} mm)`);
    }
    lines.push(why.join('; ') + '.');
    if (fit.partial) lines.push(`Turning one flange, only ${fit.partial} of the ${Math.max(a.n, b.n)} holes would line up. That is not enough for a pressure joint.`);
  }
  return box + `<ul class="why">${lines.map((l) => `<li class="${fit.status === 'direct' ? 'good' : fit.status === 'fit' ? 'close' : 'bad'}">${l}</li>`).join('')}</ul>`;
}

/* ---------------- products ---------------- */

// Does flange f match the bolt pattern of reference flange g? (bolt count, PCD, hole size)
function adSideMatch(f, g) {
  return !!g && f.n === g.n && Math.abs(f.pcd - g.pcd) <= 0.6 && Math.abs(f.hole - g.hole) <= 1.6;
}
// Does a multi-drilled flange (a list of flange ids) have holes for f? (bolt count and PCD only)
function adHolesFor(ids, f, byId) {
  return (ids || []).some((id) => { const g = byId.get(id); return g && g.n === f.n && Math.abs(g.pcd - f.pcd) <= 0.6; });
}
function adById(flanges) { return new Map(flanges.map((f) => [f.id, f])); }

/* Every product that bridges flanges a and b.
 * Returns a list of { product, certainty: 'yes'|'maybe', items: [{ ref, note, flag }] },
 * converters first, then dual-drilled parts, then made-to-order. */
function findAdapterProducts(a, b, flanges, products = ADD.ADAPTER_PRODUCTS) {
  const byId = adById(flanges);
  const out = [];
  for (const p of products) {
    const items = [];
    let certainty = 'yes';
    if (p.kind === 'converter') {
      for (const pr of p.pairs) {
        const ga = byId.get(pr.a), gb = byId.get(pr.b);
        if ((adSideMatch(a, ga) && adSideMatch(b, gb)) || (adSideMatch(a, gb) && adSideMatch(b, ga))) {
          items.push({ ref: pr.ref, note: pr.note, flag: pr.flag || null });
        }
      }
    } else if (p.kind === 'dual') {
      for (const set of p.sets) {
        const ya = adHolesFor(set.yes, a, byId), yb = adHolesFor(set.yes, b, byId);
        const ma = ya || adHolesFor(set.maybe, a, byId), mb = yb || adHolesFor(set.maybe, b, byId);
        if (ya && yb) items.push({ ref: set.label, note: '', flag: null });
        else if (ma && mb) { items.push({ ref: set.label, note: 'possible: not confirmed on the datasheet', flag: 'Table D drilling at this size is not confirmed by the datasheet.' }); certainty = 'maybe'; }
      }
      if (items.length && items.every((i) => i.flag)) certainty = 'maybe'; else certainty = 'yes';
    } else if (p.kind === 'bespoke') {
      const okTable = p.tables.includes(a.tableId) && p.tables.includes(b.tableId);
      const inRange = (f) => !p.dn || (f.dn >= p.dn[0] && f.dn <= p.dn[1] && !(p.exceptDN || []).includes(f.dn));
      if (okTable && inRange(a) && inRange(b) && (!p.sameDN || a.dn === b.dn)) items.push({ ref: 'Made to order', note: '', flag: null });
    }
    if (items.length) out.push({ product: p, certainty, items });
  }
  const rank = { converter: 0, dual: 1, bespoke: 2 };
  return out.sort((x, y) => rank[x.product.kind] - rank[y.product.kind]);
}

const AD_KIND_TEXT = {
  converter: 'Flange-to-flange converter (stock sizes)',
  dual: 'Dual-drilled: bolts to either flange (use instead of a converter)',
  bespoke: 'Made to order',
};

function adProductsHTML(matches, a, b) {
  if (!matches.length) {
    return `<div class="note">No listed product bridges this exact pair. A bespoke converter or an adaptor spool can still be made: ask a supplier such as European Pipeline Engineering, AVK UK or Cascade (see general options below).</div>`;
  }
  return matches.map((m) => {
    const p = m.product;
    const flags = [...p.flags, ...m.items.filter((i) => i.flag).map((i) => i.flag)];
    return `<div class="result adprod">
      <div class="rhead"><div><div class="rtitle">${adEsc(p.maker)} — ${adEsc(p.name)}</div>
        <div class="rsub">${adEsc(AD_KIND_TEXT[p.kind])}${m.certainty === 'maybe' ? ' · <b>possible ⚠</b>' : ''}</div></div></div>
      ${m.items.filter((i) => p.kind !== 'bespoke').map((i) => `<div class="twin"><b>${adEsc(i.ref)}</b>${i.note ? `<br>${adEsc(i.note)}` : ''}</div>`).join('')}
      <div class="note">${adEsc(p.summary)}</div>
      <table class="spec">
        <tr><th>Pressure</th><td>${adEsc(p.pressure)}</td></tr>
        <tr><th>Sizes</th><td>${adEsc(p.sizes)}</td></tr>
      </table>
      ${flags.map((fl) => `<div class="flag">⚠ ${adEsc(fl)}</div>`).join('')}
      <div class="note">Source${p.sources.length > 1 ? 's' : ''}: ${p.sources.map((u) => `<a href="${adEsc(u)}" target="_blank" rel="noopener">${adEsc(u.replace(/^https?:\/\/(www\.)?/, '').split('/').slice(0, 2).join('/') + (u.endsWith('.pdf') ? ' (datasheet)' : ''))}</a>`).join(' · ')}</div>
    </div>`;
  }).join('');
}

function adGuidanceHTML() {
  return `<div class="note">General options (not products). Sizes and ratings are not claimed here.</div>` +
    ADD.ADAPTER_GUIDANCE.map((g) => `<details class="adguide"><summary>${adEsc(g.title)}${g.flag ? ' ⚠' : ''}</summary>
      <div class="note">${adEsc(g.text)}</div>
      ${g.flag ? `<div class="flag">⚠ ${adEsc(g.flag)}</div>` : ''}
      ${(g.sources || []).map((u) => `<div class="note">Source: <a href="${adEsc(u)}" target="_blank" rel="noopener">${adEsc(u.replace(/^https?:\/\/(www\.)?/, '').split('/').slice(0, 2).join('/'))}</a></div>`).join('')}
    </details>`).join('');
}

// How many ⚠ the product list carries in total (products + pair flags + guidance). Used by the tests.
function adFlagCount(products = ADD.ADAPTER_PRODUCTS, guidance = ADD.ADAPTER_GUIDANCE) {
  let n = 0;
  for (const p of products) {
    n += p.flags.length;
    for (const pr of p.pairs || []) if (pr.flag) n++;
  }
  for (const g of guidance) if (g.flag) n++;
  return n;
}

// A sensible flange B for a given flange A: PN16 for old/American flanges,
// BS 10 Table D for PN10/PN16. The nearest DN is used.
function suggestPartner(flanges, a) {
  const targetTable = (a.family === 'EN 1092-1' || a.family === 'EN 1092-2') && (a.rating === 'PN10' || a.rating === 'PN16')
    ? 'BS10_D' : 'EN1092-1_PN16';
  const sizes = flanges.filter((f) => f.tableId === targetTable);
  return sizes.reduce((best, f) => (Math.abs(f.dn - a.dn) < Math.abs(best.dn - a.dn) ? f : best), sizes[0]);
}

/* =====================================================================
 * 2. SCREEN CODE (browser only)
 * ===================================================================== */
const AD_KEY = 'flangeIdentifier.adapters';
const AD_DEFAULT = { aId: 'BS10_D_6', bId: 'EN1092-1_PN16_150' };   // 6" Table D vs DN150 PN16

function adLoad() { try { return JSON.parse(localStorage.getItem(AD_KEY)) || {}; } catch (e) { return {}; } }
function adSave(s) { try { localStorage.setItem(AD_KEY, JSON.stringify(s)); } catch (e) { /* private mode: ignore */ } }

// flanges = every flange (expandTables output), tables = FLANGE_TABLES.
function initAdapters(flanges, tables) {
  const $ = (id) => document.getElementById(id);
  const byId = (id) => flanges.find((f) => f.id === id);
  const saved = adLoad();
  const state = {
    aId: byId(saved.aId) ? saved.aId : AD_DEFAULT.aId,
    bId: byId(saved.bId) ? saved.bId : AD_DEFAULT.bId,
  };
  const stdOptions = browseStandards(tables).map((g) =>
    `<optgroup label="${adEsc(g.group)}">${g.items.map((i) => `<option value="${i.id}">${adEsc(i.text)}</option>`).join('')}</optgroup>`).join('');
  ['adStdA', 'adStdB'].forEach((id) => { $(id).innerHTML = stdOptions; });

  $('adPresets').innerHTML = ADD.ADAPTER_PRESETS.map((g) =>
    `<div class="adgroup"><div class="rsub">${adEsc(g.group)}</div><div class="drawbtns">${g.items.map((it, i) =>
      `<button type="button" class="drawbtn" data-pa="${it.a}" data-pb="${it.b}">${adEsc(it.text)}</button>`).join('')}</div></div>`).join('');

  function fillSizes(sel, tableId, selectedId) {
    sel.innerHTML = flanges.filter((f) => f.tableId === tableId).sort((x, y) => x.dn - y.dn).map((f) =>
      `<option value="${adEsc(f.id)}"${f.id === selectedId ? ' selected' : ''}>${adEsc(f.sizeLabel)}${f.nps ? ` (≈DN${f.dn})` : ''}${f.flags.length ? ' ⚠' : ''}</option>`).join('');
  }
  function nearest(tableId, dn) {
    const sizes = flanges.filter((f) => f.tableId === tableId);
    return sizes.reduce((best, f) => (Math.abs(f.dn - dn) < Math.abs(best.dn - dn) ? f : best), sizes[0]);
  }

  function render() {
    const a = byId(state.aId), b = byId(state.bId);
    $('adStdA').value = a.tableId; fillSizes($('adSizeA'), a.tableId, a.id);
    $('adStdB').value = b.tableId; fillSizes($('adSizeB'), b.tableId, b.id);
    document.querySelectorAll('#adPresets .drawbtn').forEach((btn) =>
      btn.classList.toggle('on', btn.dataset.pa === a.id && btn.dataset.pb === b.id));

    const fit = compareDrilling(a, b);
    $('adVerdict').innerHTML = adVerdictHTML(a, b, fit);
    $('adTable').innerHTML = adTableHTML(a, b);
    $('adDrawing').innerHTML = drawOverlay(a, b, {
      compact: $('adDrawing').clientWidth < 520,
      fit: fit.status === 'adapter' ? null : { maxBolt: fit.maxBolt, chosenBolt: fit.chosenBolt, chosenLabel: fit.chosenLabel },
    });
    if (fit.status === 'direct') {
      $('adProducts').innerHTML = '<div class="note">No adapter needed for this pair. If you still want a conversion piece (for example to change size), pick two different sizes.</div>';
    } else {
      $('adProducts').innerHTML = adProductsHTML(findAdapterProducts(a, b, flanges), a, b);
    }
    adSave(state);
  }
  initAdapters.render = render;
  // Open with flange A chosen (from an Identify result); B is suggested.
  initAdapters.open = (id) => { if (byId(id)) { state.aId = id; state.bId = suggestPartner(flanges, byId(id)).id; render(); } };
  initAdapters.set = (aId, bId) => { if (byId(aId) && byId(bId)) { state.aId = aId; state.bId = bId; render(); } };
  $('adGuide').innerHTML = adGuidanceHTML();

  $('adStdA').addEventListener('change', () => { state.aId = nearest($('adStdA').value, byId(state.aId).dn).id; render(); });
  $('adStdB').addEventListener('change', () => { state.bId = nearest($('adStdB').value, byId(state.bId).dn).id; render(); });
  $('adSizeA').addEventListener('change', () => { state.aId = $('adSizeA').value; render(); });
  $('adSizeB').addEventListener('change', () => { state.bId = $('adSizeB').value; render(); });
  $('adSwap').addEventListener('click', () => { [state.aId, state.bId] = [state.bId, state.aId]; render(); });
  $('adPresets').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pa]');
    if (btn) { state.aId = btn.dataset.pa; state.bId = btn.dataset.pb; render(); }
  });
}

// Make the pure functions available to the Node tests.
if (typeof module !== 'undefined') {
  module.exports = {
    lensMaxBolt, compareDrilling, adTableHTML, adVerdictHTML, findAdapterProducts, adProductsHTML,
    adGuidanceHTML, adFlagCount, suggestPartner, adSideMatch, AD_DEFAULT,
  };
}
