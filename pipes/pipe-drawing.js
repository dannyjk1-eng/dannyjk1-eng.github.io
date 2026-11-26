/* =====================================================================
 * pipe-drawing.js  —  SCALED PIPE CROSS-SECTIONS (SVG strings)
 * One global, PipeDrawing. No DOM access: returns SVG markup only.
 * ===================================================================== */
const PipeDrawing = (() => {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f = (x) => (Math.round(x * 100) / 100).toString();

  function arrowDefs(id) {
    return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1d2733"/></marker></defs>`;
  }

  /**
   * Cross-section of one row. opts: { colour, lining (bool), linMm }
   * Drawn to scale: OD fills the circle; wall and lining scale with it.
   * Very thin walls are drawn at least 1.2 px so they stay visible.
   */
  function crossSection(row, opts = {}) {
    const W = 340, H = 330, cx = 170, cy = 175, R = 120;
    const k = (2 * R) / row.od; // mm → px (OD maps to diameter 2R)
    const colour = opts.colour || '#5d6b7a';
    const mk = 'pr-arw' + Math.random().toString(36).slice(2, 7);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pipe cross-section">${arrowDefs(mk)}`;
    s += `<rect width="${W}" height="${H}" fill="#fff"/>`;
    const hasWall = row.wall != null;
    const rIn = hasWall ? Math.min(R - 1.2, (row.id / 2) * k) : null;
    const lin = opts.lining && hasWall && row.lining ? row.lining : 0;
    const rLin = lin ? Math.min(rIn - 1.2, ((row.id - 2 * lin) / 2) * k) : null;

    if (hasWall) {
      s += `<circle cx="${cx}" cy="${cy}" r="${f(R)}" fill="${colour}" stroke="#1d2733" stroke-width="1"/>`;
      if (lin) s += `<circle cx="${cx}" cy="${cy}" r="${f(rIn)}" fill="#c9c3b5" stroke="#1d2733" stroke-width=".6"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="${f(lin ? rLin : rIn)}" fill="#eef4fb" stroke="#1d2733" stroke-width="1"/>`;
    } else {
      s += `<circle cx="${cx}" cy="${cy}" r="${f(R)}" fill="#eef4fb" stroke="${colour}" stroke-width="3" stroke-dasharray="6 4"/>`;
      s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="#5d6b7a">wall not listed</text>`;
    }
    // OD dimension above
    const yOD = cy - R - 18;
    s += `<line x1="${cx - R}" y1="${yOD}" x2="${cx + R}" y2="${yOD}" stroke="#1d2733" marker-start="url(#${mk})" marker-end="url(#${mk})"/>`;
    s += `<line x1="${cx - R}" y1="${yOD - 5}" x2="${cx - R}" y2="${cy}" stroke="#9aa6b2" stroke-dasharray="2 3"/>`;
    s += `<line x1="${cx + R}" y1="${yOD - 5}" x2="${cx + R}" y2="${cy}" stroke="#9aa6b2" stroke-dasharray="2 3"/>`;
    s += `<text x="${cx}" y="${yOD - 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#1d2733">OD ${esc(row.od)} mm</text>`;
    if (hasWall) {
      const rb = lin ? rLin : rIn;
      s += `<line x1="${cx - rb}" y1="${cy}" x2="${cx + rb}" y2="${cy}" stroke="#0b5cad" marker-start="url(#${mk})" marker-end="url(#${mk})"/>`;
      const boreTxt = lin ? `bore ≈ ${f(row.id - 2 * lin)} mm (lined)` : `ID ${f(row.id)} mm (nominal)`;
      s += `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#0b5cad">${esc(boreTxt)}</text>`;
      if (lin) s += `<text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="#5d6b7a">steel/iron ID ${f(row.id)} mm</text>`;
      // wall callout at the bottom
      const yW = cy + R, yI = cy + rIn;
      s += `<line x1="${cx + 70}" y1="${yW + 30}" x2="${cx}" y2="${(yW + yI) / 2}" stroke="#1d2733" stroke-width=".8"/>`;
      s += `<circle cx="${cx}" cy="${(yW + yI) / 2}" r="2" fill="#1d2733"/>`;
      s += `<text x="${cx + 74}" y="${yW + 33}" font-size="12" fill="#1d2733">wall ${esc(row.wall)} mm${row.wallBasis === 'minimum' ? ' (min)' : ''}</text>`;
      if (lin) s += `<text x="${cx - 160}" y="${yW + 33}" font-size="11" fill="#7a6a4a">lining ${lin} mm (EN 545)</text>`;
    }
    s += '</svg>';
    return s;
  }

  /** Two pipes overlaid, concentric and to the same scale. */
  function twoPipe(od1, od2, c1 = '#2f5d9a', c2 = '#c98a00') {
    const W = 340, H = 330, cx = 170, cy = 145, R = 125;
    const big = Math.max(od1, od2), k = R / big;
    const r1 = od1 * k, r2 = od2 * k; // k maps the larger OD to radius R
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Two pipe ODs compared"><rect width="${W}" height="${H}" fill="#fff"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${f(r1)}" fill="none" stroke="${c1}" stroke-width="3"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${f(r2)}" fill="none" stroke="${c2}" stroke-width="3" stroke-dasharray="7 4"/>`;
    s += `<text x="10" y="${H - 26}" font-size="12" fill="${c1}" font-weight="700">━ Pipe A  OD ${esc(od1)} mm</text>`;
    s += `<text x="10" y="${H - 9}" font-size="12" fill="${c2}" font-weight="700">┅ Pipe B  OD ${esc(od2)} mm</text>`;
    s += `<text x="${W - 10}" y="${H - 9}" font-size="12" text-anchor="end" fill="#1d2733">Δ ${f(Math.abs(od1 - od2))} mm</text>`;
    return s + '</svg>';
  }

  return { crossSection, twoPipe };
})();

if (typeof module !== 'undefined') module.exports = { PipeDrawing };
