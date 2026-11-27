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
        const mat = MAT[s.material];
        const flag = (s.unverified && s.unverified[key]) || null;
        const wall = v.wall ?? null;
        const bore = wall != null ? round(v.od - 2 * wall, 2) : null;
        out.push({
          key: s.id + ':' + key, seriesId: s.id, material: s.material, standard: s.standard, cls: s.cls, label: s.label,
          dn, dnBasis, nps: v.nps || null, nom: v.nom || null, od: v.od,
          family: mat.family, sub: mat.sub, galv: !!(s.finishes && s.finishes.includes('galvanised')), wall, id: bore, wallBasis: wall != null ? s.wallBasis : null,
          lining: s.lining === 'en545' && dn ? liningFor(dn) : null, flag, sources: s.sources,
          wallMax: (s.wallMax && s.wallMax[key] != null) ? s.wallMax[key] : null,
          wallNom: (s.wallNom && s.wallNom[key] != null) ? s.wallNom[key] : null,
          ukCommon: !!(s.ukCommon && s.ukCommon.ok), ukReason: (s.ukCommon && s.ukCommon.reason) || '',
        });
      }
    }
    return out;
  }
  const ROWS = buildRows();

  const sortRows = (a, b) => MAT_ORDER.indexOf(a.material) - MAT_ORDER.indexOf(b.material) || a.od - b.od
    || (a.wall ?? 0) - (b.wall ?? 0);

  /* ---------- material family filter (All / Plastics / Metals) ----------
   * family: 'all' | 'plastic' | 'metal'.  sub: 'all' or a sub-chip id
   * (plastic: pvc abs pe grp · metal: steel galv stainless iron).
   * 'other' materials (AC, clay, concrete) only show under All. */
  const FAMILY_DEFAULT = 'all';
  const FAMILY_IDS = D.families.map((f) => f.id);
  function inFamily(item, family, sub) {
    // item = a row, a material object or anything with family / sub (and galv for rows)
    if (!family || family === 'all') return true;
    if (item.family !== family) return false;
    if (!sub || sub === 'all') return true;
    if (sub === 'galv') return !!item.galv;
    return item.sub === sub;
  }
  const subIds = (family) => ((D.families.find((f) => f.id === family) || { subs: [] }).subs).map((x) => x.id);
  function materialsInFamily(family, sub) {
    return D.materials.filter((m) => inFamily(m, family, sub === 'galv' ? 'steel' : sub)).map((m) => m.id);
  }
  /** Does this coupling list at least one material of the family? (Hides e.g. PE-only couplings under Metals.) */
  function couplingInFamily(c, family, sub) {
    if (!family || family === 'all') return true;
    const ids = materialsInFamily(family, sub);
    return Object.keys(c.materials).some((k) => ids.includes(k) && c.materials[k][0] !== 'bad');
  }
  function familyGet(storage) {
    if (!storage || typeof storage.getItem !== 'function') return { family: FAMILY_DEFAULT, sub: 'all' };
    try {
      const f = JSON.parse(storage.getItem('pipeRef.family') ?? 'null');
      const sRaw = JSON.parse(storage.getItem('pipeRef.familySub') ?? 'null');
      const family = FAMILY_IDS.includes(f) ? f : FAMILY_DEFAULT;
      const sub = family !== 'all' && subIds(family).includes(sRaw) ? sRaw : 'all';
      return { family, sub };
    } catch (e) { return { family: FAMILY_DEFAULT, sub: 'all' }; }
  }
  function familySet(storage, family, sub) {
    const f = FAMILY_IDS.includes(family) ? family : FAMILY_DEFAULT;
    const sb = f !== 'all' && subIds(f).includes(sub) ? sub : 'all';
    storage.setItem('pipeRef.family', JSON.stringify(f));
    storage.setItem('pipeRef.familySub', JSON.stringify(sb));
    return { family: f, sub: sb };
  }
  function hiddenByFamily(rows, family, sub) {
    return rows.filter((r) => !inFamily(r, family, sub)).length;
  }


  /* ---------- plastic size designation (ISO 161-1 / ISO 1452) ----------
   * Metric thermoplastic pipe is designated by nominal outside diameter dn
   * (a “25 mm” or “d25” pipe has a 25 mm OD). That is not the same number as
   * steel/valve DN (ISO 6708): d25 ↔ DN20, d32 ↔ DN25. */
  const ISO161_DN = [16, 20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1200];

  /** Parse a typed size: 'd25', 'dn25', 'od 32', '25mm', '25'. */
  function parseSizeQuery(q) {
    const raw = String(q || '').trim();
    const s = raw.toLowerCase().replace(/[ø∅]/g, 'd').replace(/,/g, '.');
    if (!s) return { raw, num: null, kind: null };
    const m = s.match(/^(dn|od|dia|d)?\s*([0-9]+(?:\.[0-9]+)?)\s*(mm)?$/i);
    if (!m) return { raw, num: null, kind: null };
    const num = +m[2];
    const p = (m[1] || '').toLowerCase();
    const kind = p === 'dn' ? 'dn' : (p === 'd' || p === 'od' || p === 'dia' ? 'd' : 'bare');
    return { raw, num, kind };
  }

  /** Metric OD-designated plastic (not imperial inch, not GRP with a true DN). */
  function isOdPlastic(r) {
    return r.family === 'plastic' && !r.nps && r.dnBasis !== 'nominal';
  }

  /** Format an OD with one decimal, e.g. 25 → "25.0", 82.4 → "82.4". */
  function odTxt(od) {
    if (od == null || Number.isNaN(+od)) return '';
    return (Math.round(+od * 10) / 10).toFixed(1);
  }

  function plasticKind(r) {
    return r.material === 'absw' ? ' waste' : r.material === 'pvcw' ? ' soil' : r.material === 'pvcs' ? ' sewer' : '';
  }

  /** Human-readable size for a row. Plastic is never labelled “≈ DNxx”. */
  function sizeName(r) {
    const od = r.od;
    if (isOdPlastic(r)) {
      const kind = plasticKind(r);
      const usesNom = !!(r.nom && (Math.abs(parseFloat(r.nom) - od) > 0.15 || kind));
      const primary = usesNom && r.nom ? (r.nom + kind) : (`${Number.isInteger(od) ? od : od} mm` + kind);
      const long = usesNom && r.nom ? `${r.nom}${kind} (OD ${odTxt(od)})` : `${Number.isInteger(od) ? od : od} mm${kind} (OD ${odTxt(od)})`;
      return { primary, secondary: `OD ${odTxt(od)}`, long, d: od, steelDn: r.dn };
    }
    if (r.family === 'plastic' && r.nps) {
      const long = `${r.nps} (OD ${odTxt(od)})`;
      return { primary: r.nps, secondary: `OD ${odTxt(od)}`, long, d: od, steelDn: r.dn };
    }
    if (r.nps) {
      const long = `${r.nps} (${odTxt(od)} mm OD)` + (r.dn != null ? ` · DN${r.dn}` : '');
      return { primary: r.nps, secondary: r.dn != null ? `DN${r.dn}` : '', long, d: od, steelDn: r.dn };
    }
    const long = r.dn != null ? `DN${r.dn} (${odTxt(od)} mm OD)` : `${odTxt(od)} mm OD`;
    return { primary: r.dn != null ? `DN${r.dn}` : odTxt(od) + ' mm', secondary: '', long, d: od, steelDn: r.dn };
  }

  function sizeKeyForRow(r) {
    if (r.nps) return 'nps:' + r.nps;
    if (r.family === 'plastic' && r.dnBasis === 'nominal' && r.dn != null) return 'dn:' + r.dn;
    if (r.nom && Math.abs(parseFloat(r.nom) - r.od) > 0.15) return 'nom:' + parseFloat(r.nom);
    if (isOdPlastic(r)) return 'd:' + r.od;
    return r.dn != null ? 'dn:' + r.dn : 'd:' + r.od;
  }

  /** Picker list when Working on… Plastics. Groups: metric (by OD) and imperial (by bore). */
  function plasticSizeList(opts = {}) {
    const src = ROWS.filter((r) => r.family === 'plastic' && (!opts.ukOnly || r.ukCommon) && inFamily(r, opts.family || 'plastic', opts.sub));
    const metric = new Map(), imperial = new Map(), grp = new Map();
    for (const r of src) {
      if (r.nps) {
        const k = 'nps:' + r.nps;
        if (!imperial.has(k)) imperial.set(k, { value: k, kind: 'nps', nps: r.nps, od: r.od, dn: r.dn, sort: r.od,
          label: `${r.nps} (OD ${odTxt(r.od)})` });
        continue;
      }
      if (r.dnBasis === 'nominal' && r.dn != null) {
        const k = 'dn:' + r.dn;
        if (!grp.has(k)) grp.set(k, { value: k, kind: 'dn', num: r.dn, od: r.od, dn: r.dn, sort: r.od,
          label: `DN${r.dn} (${r.od} mm OD)` });
        continue;
      }
      if (r.nom && Math.abs(parseFloat(r.nom) - r.od) > 0.15) {
        const n = parseFloat(r.nom);
        const k = 'nom:' + n;
        if (!metric.has(k)) metric.set(k, { value: k, kind: 'nom', num: n, od: r.od, dn: r.dn, sort: r.od,
          label: `${r.nom}${plasticKind(r)} (OD ${odTxt(r.od)})` });
        continue;
      }
      const n = r.od;
      const k = 'd:' + n;
      if (!metric.has(k)) {
        const dlabel = Number.isInteger(n) ? String(n) : String(n);
        metric.set(k, { value: k, kind: 'd', num: n, od: n, dn: r.dn, sort: n,
          label: `${dlabel} mm (OD ${odTxt(n)})` });
      }
    }
    const met = [...metric.values()].sort((a, b) => a.sort - b.sort);
    const imp = [...imperial.values()].sort((a, b) => a.sort - b.sort);
    const g = [...grp.values()].sort((a, b) => a.sort - b.sort);
    return { metric: met, imperial: imp, grp: g, all: met.concat(imp, g) };
  }

  /** Rows whose plastic designation matches a picker value ('d:25', 'nps:1"', 'nom:32', 'dn:200'). */
  function rowsForPlasticSize(value, opts = {}) {
    const src = ROWS.filter((r) => r.family === 'plastic' && inFamily(r, opts.family || 'plastic', opts.sub));
    if (value == null || value === '') return [];
    const v = String(value);
    if (v.startsWith('nps:')) {
      const nps = v.slice(4);
      return src.filter((r) => r.nps === nps).sort(sortRows);
    }
    if (v.startsWith('nom:')) {
      const n = +v.slice(4);
      return src.filter((r) => r.nom && parseFloat(r.nom) === n).sort(sortRows);
    }
    if (v.startsWith('dn:')) {
      const n = +v.slice(3);
      return src.filter((r) => r.dn === n && r.dnBasis === 'nominal').sort(sortRows);
    }
    const n = v.startsWith('d:') ? +v.slice(2) : +v;
    if (Number.isNaN(n)) return [];
    return src.filter((r) => {
      if (r.nps) return false;
      if (r.dnBasis === 'nominal') return false;
      if (Math.abs(r.od - n) <= 0.05) return true;
      if (r.nom && parseFloat(r.nom) === n) return true;
      return false;
    }).sort(sortRows);
  }

  /** All DNs that have at least one row (any basis), 15–1200. opts.ukOnly hides DNs with only non-UK rows. */
  function dnList(opts = {}) {
    const src = ROWS.filter((r) => (!opts.ukOnly || r.ukCommon) && inFamily(r, opts.family, opts.sub));
    return [...new Set(src.map((r) => r.dn).filter((d) => d != null && d >= 15 && d <= 1200))].sort((a, b) => a - b);
  }

  /** Rows for one DN. opts.basis: 'all' (default) or 'nominal' (hide similar/matching plastic rows). */
  function rowsForDN(dn, opts = {}) {
    return ROWS.filter((r) => r.dn === dn && (opts.basis !== 'nominal' || r.dnBasis === 'nominal')
      && inFamily(r, opts.family, opts.sub)).sort(sortRows);
  }

  /** Suitability rating for a material and service key → [rating, note] or null. */
  function suit(materialId, service) {
    const m = MAT[materialId];
    return (m && m.suit[service]) || null;
  }

  /** Filter rows. f = { material, service, level ('good'|'possible'), q, ukOnly, family, sub } */
  function filterRows(rows, f = {}) {
    const q = (f.q || '').trim().toLowerCase();
    return rows.filter((r) => {
      if (f.ukOnly && !r.ukCommon) return false;
      if (!inFamily(r, f.family, f.sub)) return false;
      if (f.material && r.material !== f.material) return false;
      if (f.service) {
        const s = suit(r.material, f.service);
        if (!s) return false;
        if (s[0] === 'bad') return false;
        if ((f.level || 'good') === 'good' && s[0] !== 'good') return false;
      }
      if (q) {
        const parsed = parseSizeQuery(q);
        if (parsed.num != null) {
          const n = parsed.num;
          if (parsed.kind === 'd') {
            const near = Math.abs(r.od - n) <= 0.15;
            const nom = r.nom && parseFloat(r.nom) === n;
            if (!(near || nom)) return false;
          } else if (parsed.kind === 'dn') {
            if (r.dn !== n) return false;
          } else {
            const near = Math.abs(r.od - n) <= Math.max(1, n * 0.02);
            const nom = r.nom && parseFloat(r.nom) === n;
            if (!(near || r.dn === n || nom)) return false;
          }
        } else {
          const hay = [r.standard, r.cls, r.label, MAT[r.material].name, r.nps || '', r.nom || ''].join(' ').toLowerCase();
          if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
        }
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

  /* "Common in UK" filter — on by default. Persistence uses the same
   * pipeRef.ukCommon localStorage key as the screen code, so tests can
   * check that a toggle round-trip is stored and read back. */
  const UK_COMMON_DEFAULT = true;
  function ukCommonGet(storage) {
    if (!storage || typeof storage.getItem !== 'function') return UK_COMMON_DEFAULT;
    try {
      const v = storage.getItem('pipeRef.ukCommon');
      return v == null ? UK_COMMON_DEFAULT : JSON.parse(v);
    } catch (e) { return UK_COMMON_DEFAULT; }
  }
  function ukCommonSet(storage, on) {
    storage.setItem('pipeRef.ukCommon', JSON.stringify(!!on));
    return !!on;
  }
  function hiddenNonUk(rows, ukOnly) {
    return ukOnly ? rows.filter((r) => !r.ukCommon).length : 0;
  }


  /* ---------- Plastics tab ----------
   * groups(opts) -> [{ group, series[], sizes[] }]  opts = { system, make, ukOnly }
   * sizes[] = [{ od, nps, nom, dn, cells: { seriesId: row } }] sorted by OD. */
  function plasticGroups(opts = {}) {
    const out = [];
    for (const g of D.plastics.groups) {
      if (opts.system && opts.system !== 'all' && g.system !== opts.system) continue;
      if (opts.make && opts.make !== 'all' && g.make !== opts.make) continue;
      const ser = g.seriesIds.map((id) => SERIES[id]).filter((s) => !opts.ukOnly || (s.ukCommon && s.ukCommon.ok));
      if (!ser.length) continue;
      const map = new Map();
      for (const s of ser) for (const r of ROWS.filter((x) => x.seriesId === s.id)) {
        const k = r.nps || String(r.od);
        const e = map.get(k) || { od: r.od, nps: r.nps, nom: r.nom, dn: r.dn, cells: {} };
        e.cells[s.id] = r; map.set(k, e);
      }
      out.push({ group: g, series: ser, sizes: [...map.values()].sort((a, b) => a.od - b.od) });
    }
    return out;
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
    matchCouplings, twoPipe, coverage, round, UK_COMMON_DEFAULT, ukCommonGet, ukCommonSet, hiddenNonUk,
    FAMILY_DEFAULT, inFamily, materialsInFamily, couplingInFamily, familyGet, familySet, hiddenByFamily, plasticGroups,
    ISO161_DN, parseSizeQuery, isOdPlastic, sizeName, sizeKeyForRow, plasticSizeList, rowsForPlasticSize,
    odTxt };
})();

if (typeof module !== 'undefined') module.exports = { PipeLogic };
