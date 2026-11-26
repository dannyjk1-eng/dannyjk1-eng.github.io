/* =====================================================================
 * pipe-logic.js  —  THE SUMS AND LOOK-UPS  (Pipe Reference app)
 * ---------------------------------------------------------------------
 * No screen code here. Everything sits in ONE global, PipeLogic, so this
 * file can share a page with Flange ID. Works in the browser and in Node
 * (tests.js) — in Node it loads pipe-data.js itself.
 * ===================================================================== */
const PipeLogic = (() => {
  const D = (typeof PIPE_DATA !== 'undefined') ? PIPE_DATA : require('./pipe-data.js').PIPE_DATA;

  const MAT = Object.fromEntries(D.materials.map((m) => [m.id, m]));
  const MAT_ORDER = D.materials.map((m) => m.id);
  const SERIES = Object.fromEntries(D.series.map((s) => [s.id, s]));
  const round = (x, dp = 1) => Math.round(x * 10 ** dp) / 10 ** dp;

  // Reference DN ladder used for "similar OD" — steel EN 10220 ODs.
  const REF = D.series.find((s) => s.id === 'EN10220').rows.map((r) => ({ dn: r[0], od: r[1] }));
  function similarDN(od) {
    let best = null;
    for (const r of REF) {
      const diff = Math.abs(r.od - od) / r.od;
      if (diff <= 0.10 && (!best || diff < best.diff)) best = { dn: r.dn, diff };
    }
    return best ? best.dn : null;
  }

  function liningFor(dn) {
    const b = D.liningEN545.find(([a, z]) => dn >= a && dn <= z);
    return b ? b[2] : null;
  }

  /* ---------- flatten every series into simple rows ---------- */
  function buildRows() {
    const out = [];
    for (const s of D.series) {
      const c = s.columns;
      for (const r of s.rows) {
        const v = Object.fromEntries(c.map((k, i) => [k, r[i]]));
        let dn = v.dn ?? null, dnBasis = dn != null ? 'nominal' : null;
        if (dn == null) {
          if (s.material === 'pe' && D.peDnEquiv[v.od]) { dn = D.peDnEquiv[v.od]; dnBasis = 'matching'; }
          else { dn = similarDN(v.od); dnBasis = dn != null ? 'similar' : null; }
        }
        const key = c.includes('dn') ? v.dn : v.od;
        const flag = (s.unverified && s.unverified[key]) || null;
        const wall = v.wall ?? null;
        const bore = wall != null ? round(v.od - 2 * wall, 2) : null;
        out.push({
          key: s.id + ':' + key, seriesId: s.id, material: s.material, standard: s.standard, cls: s.cls, label: s.label,
          dn, dnBasis, nps: v.nps || null, od: v.od, wall, id: bore, wallBasis: wall != null ? s.wallBasis : null,
          lining: s.lining === 'en545' && dn ? liningFor(dn) : null, flag, sources: s.sources,
        });
      }
    }
    return out;
  }
  const ROWS = buildRows();

  const sortRows = (a, b) => MAT_ORDER.indexOf(a.material) - MAT_ORDER.indexOf(b.material) || a.od - b.od
    || (a.wall ?? 0) - (b.wall ?? 0);

  /** All DNs that have at least one row (any basis), 15–1200. */
  function dnList() {
    return [...new Set(ROWS.map((r) => r.dn).filter((d) => d != null && d >= 15 && d <= 1200))].sort((a, b) => a - b);
  }

  /** Rows for one DN. opts.basis: 'all' (default) or 'nominal' (hide similar/matching plastic rows). */
  function rowsForDN(dn, opts = {}) {
    return ROWS.filter((r) => r.dn === dn && (opts.basis !== 'nominal' || r.dnBasis === 'nominal')).sort(sortRows);
  }

  /** Suitability rating for a material and service key → [rating, note] or null. */
  function suit(materialId, service) {
    const m = MAT[materialId];
    return (m && m.suit[service]) || null;
  }

  /** Filter rows. f = { material, service, level ('good'|'possible'), q, odMin, odMax } */
  function filterRows(rows, f = {}) {
    const q = (f.q || '').trim().toLowerCase();
    const num = q && !isNaN(+q) ? +q : null;
    return rows.filter((r) => {
      if (f.material && r.material !== f.material) return false;
      if (f.service) {
        const s = suit(r.material, f.service);
        if (!s) return false;
        if (s[0] === 'bad') return false;
        if ((f.level || 'good') === 'good' && s[0] !== 'good') return false;
      }
      if (num != null) {
        const near = Math.abs(r.od - num) <= Math.max(1, num * 0.02);
        if (!(near || r.dn === num)) return false;
      } else if (q) {
        const hay = [r.standard, r.cls, r.label, MAT[r.material].name, r.nps || ''].join(' ').toLowerCase();
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    }).sort(sortRows);
  }

  /* ---------- couplings ---------- */
  const EDGE = 1.0; // mm — "near the edge of the range, measure carefully"

  /** Which couplings / flange adaptors take this OD? materialId adds the maker's rating. */
  function matchCouplings(od, materialId) {
    const out = [];
    for (const c of D.couplings) {
      for (const r of c.ranges) {
        const [label, min, max, extra] = r;
        const hit = c.kind === 'exact' ? Math.abs(od - min) <= 0.5 : od >= min && od <= max;
        if (!hit) continue;
        const rating = materialId ? (c.materials[materialId] || ['unlisted', 'Not listed by the maker for this pipe material.']) : null;
        const nearEdge = c.kind === 'wide' && (od - min < EDGE || max - od < EDGE);
        out.push({ coupling: c, label, min, max, extra: extra || null, rating, nearEdge });
      }
    }
    const rank = { good: 0, caution: 1, unlisted: 2, bad: 3 };
    return out.sort((a, b) => (a.rating ? rank[a.rating[0]] - rank[b.rating[0]] : 0)
      || (a.coupling.type === b.coupling.type ? 0 : a.coupling.type === 'coupling' ? -1 : 1));
  }

  /**
   * Two different pipes. Returns { diff, sameRange[], stepped[], adaptorPair{a[],b[]} }.
   *   sameRange — one wide-range COUPLING whose single range covers both ODs
   *   stepped   — Teekay Axiflex stepped coupling band that can take the step
   *   adaptorPair — flange adaptors that fit each pipe (bolt two together)
   */
  function twoPipe(od1, mat1, od2, mat2) {
    const lo = Math.min(od1, od2), hi = Math.max(od1, od2), diff = round(hi - lo, 2);
    const sameRange = [];
    for (const c of D.couplings) {
      if (c.type !== 'coupling') continue;
      for (const r of c.ranges) {
        const [label, min, max] = r;
        if (c.kind !== 'exact' && lo >= min && hi <= max) {
          sameRange.push({ coupling: c, label, min, max,
            ratingA: c.materials[mat1] || ['unlisted', 'Not listed by the maker.'],
            ratingB: c.materials[mat2] || ['unlisted', 'Not listed by the maker.'] });
        }
      }
    }
    const st = D.steppedTeekay, stepped = [];
    if (diff > 0) {
      const band = st.bands.find(([a, z]) => lo >= a && lo <= z);
      if (band && diff <= band[2]) {
        stepped.push({ coupling: st, band, okA: st.materials.includes(mat1), okB: st.materials.includes(mat2) });
      }
    }
    const fa = (od, mat) => matchCouplings(od, mat).filter((m) => m.coupling.type === 'flangeAdaptor');
    return { lo, hi, diff, sameRange, stepped, adaptorPair: { a: fa(od1, mat1), b: fa(od2, mat2) } };
  }

  /** Coverage summary for the README / report. */
  function coverage() {
    const byMat = {};
    for (const r of ROWS) {
      const m = (byMat[r.material] ||= { rows: 0, dns: new Set(), flags: 0 });
      m.rows++; if (r.dn) m.dns.add(r.dn); if (r.flag) m.flags++;
    }
    return Object.fromEntries(Object.entries(byMat).map(([k, v]) => [k, { rows: v.rows, dns: v.dns.size, flags: v.flags }]));
  }

  return { data: D, MAT, SERIES, ROWS, similarDN, liningFor, dnList, rowsForDN, suit, filterRows,
    matchCouplings, twoPipe, coverage, round };
})();

if (typeof module !== 'undefined') module.exports = { PipeLogic };
