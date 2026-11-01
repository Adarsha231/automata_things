// Graph layout and edge geometry for the SVG canvas.

import { EPS } from '../engine/automaton.js';

export const R = 26; // state radius
const X_GAP = 170;
const Y_GAP = 110;

/** Layered layout: BFS depth → column, barycentre ordering → row. */
export function layoutAutomaton(aut) {
  const depth = new Map([[aut.start, 0]]);
  const queue = [aut.start];
  const out = new Map();
  for (const t of aut.transitions) {
    if (!out.has(t.from)) out.set(t.from, []);
    out.get(t.from).push(t.to);
  }
  for (let i = 0; i < queue.length; i++) {
    for (const to of out.get(queue[i]) ?? []) {
      if (!depth.has(to)) {
        depth.set(to, depth.get(queue[i]) + 1);
        queue.push(to);
      }
    }
  }
  const layers = [];
  for (const s of aut.states) {
    const d = depth.get(s) ?? 0;
    (layers[d] ??= []).push(s);
  }
  const preds = new Map();
  for (const t of aut.transitions) {
    if (!preds.has(t.to)) preds.set(t.to, new Set());
    preds.get(t.to).add(t.from);
  }
  const row = new Map();
  layers.forEach((layer, d) => {
    if (d > 0) {
      const bary = (s) => {
        const p = [...(preds.get(s) ?? [])].filter((x) => depth.get(x) < d && row.has(x));
        return p.length ? p.reduce((a, x) => a + row.get(x), 0) / p.length : layer.indexOf(s);
      };
      layer.sort((a, b) => bary(a) - bary(b) || a - b);
    }
    layer.forEach((s, i) => row.set(s, i - (layer.length - 1) / 2));
  });
  const pos = {};
  layers.forEach((layer, d) => {
    layer.forEach((s) => {
      pos[s] = { x: d * X_GAP, y: row.get(s) * Y_GAP };
    });
  });
  return pos;
}

const unit = (dx, dy) => {
  const d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
};
const quad = (p0, c, p1, t) => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y,
});

/** Group transitions by (from,to) and compute SVG path + label position. */
export function computeEdges(aut, pos) {
  const rank = (s) => (s === EPS ? 1e9 : aut.alphabet.indexOf(s));
  const groups = new Map();
  for (const t of aut.transitions) {
    const k = `${t.from}>${t.to}`;
    if (!groups.has(k)) groups.set(k, { from: t.from, to: t.to, symbols: [] });
    const g = groups.get(k);
    if (!g.symbols.includes(t.symbol)) g.symbols.push(t.symbol);
  }
  const edges = [];
  for (const g of groups.values()) {
    g.symbols.sort((a, b) => rank(a) - rank(b));
    const label = g.symbols.join(',');
    const a = pos[g.from];
    const b = pos[g.to];
    if (!a || !b) continue;

    if (g.from === g.to) {
      const hx = 14;
      const hy = Math.sqrt(R * R - hx * hx);
      const top = a.y - R - 46;
      edges.push({
        key: `${g.from}>${g.to}`,
        ...g,
        label,
        loop: true,
        d: `M ${a.x - hx} ${a.y - hy} C ${a.x - 34} ${top} ${a.x + 34} ${top} ${a.x + hx} ${a.y - hy}`,
        lx: a.x,
        ly: a.y - R - 66,
        pts: [{ x: a.x, y: a.y - R - 90 }, { x: a.x - 40, y: a.y }, { x: a.x + 40, y: a.y }],
      });
      continue;
    }

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const [ux, uy] = unit(dx, dy);
    const n = { x: -uy, y: ux };
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const bidir = groups.has(`${g.to}>${g.from}`);
    const candidates = bidir
      ? [1, 1.6, 2.3, 3.2].map((m) => Math.max(46, 0.28 * dist) * m)
      : [0, 0.5 * dist, -0.5 * dist, dist, -dist];

    const build = (bend) => {
      const c = { x: mid.x + n.x * bend, y: mid.y + n.y * bend };
      const [sx, sy] = unit(c.x - a.x, c.y - a.y);
      const [ex, ey] = unit(c.x - b.x, c.y - b.y);
      const p0 = { x: a.x + sx * R, y: a.y + sy * R };
      const p1 = { x: b.x + ex * (R + 1), y: b.y + ey * (R + 1) };
      return { c, p0, p1 };
    };
    const collides = ({ c, p0, p1 }) => {
      for (let i = 1; i < 10; i++) {
        const p = quad(p0, c, p1, i / 10);
        for (const [id, q] of Object.entries(pos)) {
          if (Number(id) === g.from || Number(id) === g.to) continue;
          if (Math.hypot(p.x - q.x, p.y - q.y) < R + 10) return true;
        }
      }
      return false;
    };
    let bend = candidates[0];
    for (const cand of candidates) {
      if (!collides(build(cand))) {
        bend = cand;
        break;
      }
    }
    const { c, p0, p1 } = build(bend);
    const peak = quad(p0, c, p1, 0.5);
    let side = Math.sign(bend);
    if (side === 0) side = n.y <= 0 ? 1 : -1; // straight edge: label above the line
    const off = bend === 0 ? 14 : 12;
    edges.push({
      key: `${g.from}>${g.to}`,
      ...g,
      label,
      loop: false,
      d: `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${p1.x} ${p1.y}`,
      lx: peak.x + n.x * side * off,
      ly: peak.y + n.y * side * off,
      pts: [c, peak],
    });
  }
  return edges;
}

/** Bounding box of everything drawn, including loops, labels and the start arrow. */
export function computeBounds(pos, edges) {
  const ids = Object.keys(pos);
  if (!ids.length) return { minX: 0, minY: 0, w: 1, h: 1 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x, y, pad) => {
    minX = Math.min(minX, x - pad);
    maxX = Math.max(maxX, x + pad);
    minY = Math.min(minY, y - pad);
    maxY = Math.max(maxY, y + pad);
  };
  for (const id of ids) add(pos[id].x, pos[id].y, R + 14);
  add(pos[0]?.x - 60, pos[0]?.y, 14);
  for (const e of edges) {
    add(e.lx, e.ly, 24);
    for (const p of e.pts) add(p.x, p.y, 16);
  }
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}
