/* NULLRIFT — exhibit 04 : ROUTED RIFT
   Generative octilinear SVG autorouter on a warped lattice, rendered as a
   phosphor CRT routing plate. Everything is driven from update(); the page
   orchestrator owns the RAF. */

const SVGNS = 'http://www.w3.org/2000/svg';
const VBW = 1600;

const PHOS = '#39FF6A';
const AMBER = '#FFB000';
const HOT = '#D8FFE4';
const HOT_AMBER = '#FFDE9B';
const DEPTH_BASE = ['#0F6B2D', '#0C4F22', '#0A3D1B'];
const DEPTH_TOP = ['#39FF6A', '#1FB84A', '#128134'];
const STROKE_W = [1.6, 1.1, 0.8];

/* 8 lattice directions, index order = 45 degree steps counter-clockwise-ish */
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

const MORPH_DUR = 0.55;

let UID = 0;

function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' +
    Math.round(A[1] + (B[1] - A[1]) * t) + ',' +
    Math.round(A[2] + (B[2] - A[2]) * t) + ')';
}

/* depth -> energy(9) -> amber(5) lookup, so per-frame colour work is an index compare */
const COLOR_TABLE = DEPTH_BASE.map(function (dim, di) {
  const rows = [];
  for (let e = 0; e < 9; e++) {
    const base = mixHex(dim, DEPTH_TOP[di], e / 8);
    const row = [];
    for (let a = 0; a < 5; a++) {
      const rgb = base.slice(4, -1).split(',').map(Number);
      const am = hexToRgb(AMBER);
      const t = a / 4;
      row.push('rgb(' + Math.round(rgb[0] + (am[0] - rgb[0]) * t) + ',' +
        Math.round(rgb[1] + (am[1] - rgb[1]) * t) + ',' +
        Math.round(rgb[2] + (am[2] - rgb[2]) * t) + ')');
    }
    rows.push(row);
  }
  return rows;
});

const f1 = function (n) { return Math.round(n * 10) / 10; };
const easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
const easeInOutQuart = function (t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};
const pad3 = function (n) { return n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n; };

export default function create(ctx) {
  const root = ctx.root;
  const reduced = !!ctx.reduced;
  const cls = 'nrx-rift-' + (UID++).toString(36) + Math.random().toString(36).slice(2, 7);

  let rnd = mulberry32(0x5eed | (Date.now() & 0xffff));

  /* ---------- style ---------- */
  const styleEl = document.createElement('style');
  styleEl.textContent = [
    '.' + cls + '{position:absolute;inset:0;overflow:hidden;background:#03110A;',
    'user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}',
    '.' + cls + ' .l{position:absolute;inset:0;pointer-events:none;}',
    '.' + cls + ' .bg{background:',
    'radial-gradient(78% 62% at 50% 50%,rgba(24,104,58,.26),rgba(3,17,10,0) 72%),',
    'linear-gradient(180deg,#02100A 0%,#062117 47%,#02100A 100%);}',
    '.' + cls + ' .grid{background-image:radial-gradient(circle,rgba(57,255,106,.20) 0.5px,rgba(0,0,0,0) 0.7px);opacity:.55;}',
    '.' + cls + ' .plate{position:absolute;inset:0;display:block;width:100%;height:100%;',
    'shape-rendering:geometricPrecision;overflow:visible;}',
    '.' + cls + ' .hard{shape-rendering:crispEdges;}',
    '.' + cls + ' path{fill:none;vector-effect:non-scaling-stroke;stroke-linecap:butt;stroke-linejoin:miter;}',
    '.' + cls + ' text{font-family:"JetBrains Mono",ui-monospace,monospace;font-weight:500;',
    'fill:#2E8A4C;opacity:.8;white-space:pre;}',
    '.' + cls + ' .band{background:linear-gradient(180deg,rgba(57,255,106,0) 0%,rgba(57,255,106,.055) 46%,rgba(190,255,214,.09) 50%,rgba(57,255,106,.055) 54%,rgba(57,255,106,0) 100%);',
    'height:34%;top:0;bottom:auto;will-change:transform;}',
    '.' + cls + ' .scan{background:repeating-linear-gradient(180deg,rgba(0,0,0,.44) 0px,rgba(0,0,0,.44) 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) 3px);opacity:.62;}',
    '.' + cls + ' .vig{background:radial-gradient(118% 96% at 50% 50%,rgba(2,12,7,0) 46%,rgba(1,7,4,.62) 82%,rgba(0,4,2,.9) 100%);}'
  ].join('');
  root.appendChild(styleEl);
  root.classList.add(cls + '-host');

  /* ---------- dom ---------- */
  const wrap = document.createElement('div');
  wrap.className = cls;
  const bg = document.createElement('div'); bg.className = 'l bg';
  const gridBg = document.createElement('div'); gridBg.className = 'l grid';
  const band = document.createElement('div'); band.className = 'l band';
  const scan = document.createElement('div'); scan.className = 'l scan';
  const vig = document.createElement('div'); vig.className = 'l vig';

  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'plate');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

  const defs = document.createElementNS(SVGNS, 'defs');
  const bloom = document.createElementNS(SVGNS, 'filter');
  const bloomId = cls + '-bloom';
  bloom.setAttribute('id', bloomId);
  bloom.setAttribute('x', '-80%'); bloom.setAttribute('y', '-80%');
  bloom.setAttribute('width', '260%'); bloom.setAttribute('height', '260%');
  const blur = document.createElementNS(SVGNS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '6');
  bloom.appendChild(blur);
  defs.appendChild(bloom);
  svg.appendChild(defs);

  const mkG = function (extra) {
    const g = document.createElementNS(SVGNS, 'g');
    if (extra) g.setAttribute('class', extra);
    svg.appendChild(g);
    return g;
  };
  const gChrome = mkG('hard');
  const gGlow = mkG(null);
  const gTrace = mkG(null);
  const gPad = mkG(null);
  const gPulse = mkG(null);
  const gSeed = mkG(null);

  const tickMinor = document.createElementNS(SVGNS, 'path');
  tickMinor.setAttribute('stroke', '#1E6B36');
  tickMinor.setAttribute('stroke-width', '1');
  const tickMajor = document.createElementNS(SVGNS, 'path');
  tickMajor.setAttribute('stroke', '#2E9A4E');
  tickMajor.setAttribute('stroke-width', '1');
  const cornerMarks = document.createElementNS(SVGNS, 'path');
  cornerMarks.setAttribute('stroke', '#2E9A4E');
  cornerMarks.setAttribute('stroke-width', '1');
  cornerMarks.setAttribute('opacity', '.7');
  gChrome.appendChild(tickMinor);
  gChrome.appendChild(tickMajor);
  gChrome.appendChild(cornerMarks);

  const mkText = function (anchor) {
    const t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('text-anchor', anchor);
    gChrome.appendChild(t);
    return t;
  };
  const txtId = mkText('start');
  const txtSeed = mkText('end');
  const txtStat = mkText('start');
  const txtMode = mkText('end');
  txtSeed.setAttribute('fill', '#8A6412');

  const junctions = document.createElementNS(SVGNS, 'path');
  junctions.setAttribute('fill', PHOS);
  junctions.setAttribute('stroke', 'none');
  junctions.setAttribute('opacity', '0');
  gPad.appendChild(junctions);

  /* seed marker: a small bloomed group is cheap because its bbox is tiny */
  const seedBloomG = document.createElementNS(SVGNS, 'g');
  seedBloomG.setAttribute('filter', 'url(#' + bloomId + ')');
  gSeed.appendChild(seedBloomG);
  const seedHalo = document.createElementNS(SVGNS, 'path');
  seedHalo.setAttribute('stroke', AMBER);
  seedHalo.setAttribute('stroke-width', '2.4');
  seedHalo.setAttribute('opacity', '.85');
  seedBloomG.appendChild(seedHalo);
  const seedRing = document.createElementNS(SVGNS, 'path');
  seedRing.setAttribute('stroke', AMBER);
  seedRing.setAttribute('stroke-width', '1.3');
  const seedCross = document.createElementNS(SVGNS, 'path');
  seedCross.setAttribute('stroke', AMBER);
  seedCross.setAttribute('stroke-width', '1');
  seedCross.setAttribute('opacity', '.7');
  const seedCore = document.createElementNS(SVGNS, 'path');
  seedCore.setAttribute('fill', AMBER);
  seedCore.setAttribute('stroke', 'none');
  gSeed.appendChild(seedRing);
  gSeed.appendChild(seedCross);
  gSeed.appendChild(seedCore);

  wrap.appendChild(bg);
  wrap.appendChild(gridBg);
  wrap.appendChild(svg);
  wrap.appendChild(band);
  wrap.appendChild(scan);
  wrap.appendChild(vig);
  root.appendChild(wrap);

  /* ---------- pools ---------- */
  function makePool(parent, init) {
    const all = [], free = [];
    return {
      all: all,
      get: function (cap) {
        if (free.length) { const e = free.pop(); e.style.display = ''; return e; }
        if (all.length >= cap) return null;
        const e = document.createElementNS(SVGNS, 'path');
        init(e);
        parent.appendChild(e);
        all.push(e);
        return e;
      },
      put: function (e) { if (!e) return; e.style.display = 'none'; free.push(e); },
      releaseAll: function () {
        free.length = 0;
        for (let i = 0; i < all.length; i++) { all[i].style.display = 'none'; free.push(all[i]); }
      }
    };
  }

  const tracePool = makePool(gTrace, function (e) {
    e.setAttribute('pathLength', '1000');
    e.style.strokeDasharray = '0 1000';
  });
  /* two hard-edged underlays instead of a filter: a real blur on a full-plate
     group is the one thing that reliably drops this below 60fps */
  const glowPool = makePool(gGlow, function (e) {
    e.setAttribute('pathLength', '1000');
    e.setAttribute('stroke-width', '8.5');
    e.style.strokeDasharray = '0 1000';
    e.style.opacity = '0';
  });
  const glow2Pool = makePool(gGlow, function (e) {
    e.setAttribute('pathLength', '1000');
    e.setAttribute('stroke-width', '3.6');
    e.style.strokeDasharray = '0 1000';
    e.style.opacity = '0';
  });
  const padPool = makePool(gPad, function (e) { e.style.opacity = '0'; });
  const pulsePool = makePool(gPulse, function (e) {
    e.setAttribute('pathLength', '1000');
    e.setAttribute('stroke-width', '2.6');
    e.style.display = 'none';
  });
  const pulseGlowPool = makePool(gPulse, function (e) {
    e.setAttribute('pathLength', '1000');
    e.setAttribute('stroke-width', '9');
    e.style.opacity = '.13';
    e.style.display = 'none';
  });

  /* ---------- lattice state ---------- */
  let W = 0, H = 0, VBH = 1000;
  let cols = 0, rows = 0, cell = 60, offX = 0, offY = 0, fs = 12;
  let nodeX = null, nodeY = null;
  let trunkTarget = 5, maxTrunkSteps = 12, routeCap = 60, chamfer = 16;

  let occ = new Map();
  let owner = new Map();

  let routes = [];
  let retiring = [];
  let pulses = [];
  let hitGrid = new Map();
  let hitCell = 120;

  let seedNode = 0, seedX = 0, seedY = 0;
  let seedFromX = 0, seedFromY = 0, seedToX = 0, seedToY = 0;

  let phase = 'idle';
  let morphT = 0;
  let pendingRaws = null;
  let pendingTrunks = null;

  let time = 0;
  let ready = false;
  let active = false;
  let hovered = null;
  let nodesUsed = 0;

  let pulseTimer = 0.9;
  let microTimer = 6;
  let bandY = 0;
  let lastJunctionOpacity = -1;

  let ptrX = -1, ptrY = -1, ptrLive = false, ptrDirty = false;
  let rect = null, rectAt = -1e9;
  let downX = 0, downY = 0, downT = 0, downId = -1;

  const lastText = ['', '', '', ''];

  /* ---------- lattice ---------- */
  function idx(c, r) { return r * cols + c; }

  function buildLattice() {
    const targetPx = Math.max(25, Math.min(46, 25 + (W - 360) / 920 * 20));
    cell = targetPx * VBW / W;
    fs = Math.max(9, Math.min(13.5, W / 74)) * VBW / W;

    cols = Math.max(6, Math.floor(VBW / cell) + 1);
    rows = Math.max(6, Math.floor(VBH / cell) + 1);
    while (cols > 6 && (VBW - (cols - 1) * cell) / 2 < fs * 1.5) cols--;
    while (rows > 6 && (VBH - (rows - 1) * cell) / 2 < fs * 2.6) rows--;

    offX = (VBW - (cols - 1) * cell) / 2;
    offY = (VBH - (rows - 1) * cell) / 2;

    const n = cols * rows;
    nodeX = new Float64Array(n);
    nodeY = new Float64Array(n);
    const wk = cell * 0.11;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = offX + c * cell, by = offY + r * cell;
        const i = r * cols + c;
        nodeX[i] = bx + Math.sin(by * 0.0041 + 1.3) * wk + Math.sin(bx * 0.0029 - 0.7) * wk * 0.55;
        nodeY[i] = by + Math.cos(bx * 0.0037 + 2.1) * wk + Math.sin(by * 0.0026 + 0.4) * wk * 0.55;
      }
    }

    chamfer = cell * 0.30;
    hitCell = cell * 1.6;
    trunkTarget = Math.max(4, Math.min(7, Math.round(cols / 4.6)));
    maxTrunkSteps = Math.max(8, Math.min(22, Math.round(cols * 0.85)));
    routeCap = Math.max(24, Math.min(78, Math.round(cols * 2.5)));
  }

  /* ---------- router ---------- */
  const EK = function (a, b) { return a < b ? a * 100003 + b : b * 100003 + a; };

  function inBounds(c, r) { return c >= 1 && r >= 1 && c <= cols - 2 && r <= rows - 2; }

  function canStep(from, d, claim, keys) {
    const c = from % cols, r = (from / cols) | 0;
    const dx = DIRS[d][0], dy = DIRS[d][1];
    const nc = c + dx, nr = r + dy;
    if (!inBounds(nc, nr)) return -1;
    const to = idx(nc, nr);
    if (owner.has(to)) return -1;
    const ek = EK(from, to);
    if (occ.has(ek)) return -1;
    let dk = -1;
    if (dx && dy) {
      /* lock the cell so the opposing diagonal cannot cross this one */
      dk = 900000000 + (Math.min(r, nr) * cols + Math.min(c, nc));
      if (occ.has(dk)) return -1;
    }
    if (claim) {
      occ.set(ek, 1); keys.push(ek);
      if (dk >= 0) { occ.set(dk, 1); keys.push(dk); }
      owner.set(to, 1); keys.push(-to - 1);
    }
    return to;
  }

  function releaseKeys(keys) {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k < 0) owner.delete(-k - 1); else occ.delete(k);
    }
    keys.length = 0;
  }

  function inwardBias(node, d) {
    const c = node % cols, r = (node / cols) | 0;
    const dx = DIRS[d][0], dy = DIRS[d][1];
    let s = 0;
    if (c < 3 && dx < 0) s -= 2; if (c > cols - 4 && dx > 0) s -= 2;
    if (r < 3 && dy < 0) s -= 2; if (r > rows - 4 && dy > 0) s -= 2;
    return s;
  }

  function pickTurn(node, d) {
    const roll = rnd();
    const side = rnd() < 0.5 ? 1 : -1;
    let order;
    if (roll < 0.60) order = [side, -side, side * 2, -side * 2, side * 3, -side * 3];
    else if (roll < 0.90) order = [side * 2, -side * 2, side, -side, side * 3, -side * 3];
    else order = [side * 3, -side * 3, side * 2, -side * 2, side, -side];
    let best = -1, bestScore = -99;
    for (let i = 0; i < order.length; i++) {
      const nd = (d + order[i] + 8) % 8;
      if (canStep(node, nd, false, null) < 0) continue;
      const sc = inwardBias(node, nd) - i * 0.35;
      if (sc > bestScore) { bestScore = sc; best = nd; }
    }
    return best;
  }

  /* grow one route; returns raw descriptor or null */
  function growRoute(start, dir, depth, budget, branchSink, parent, attachAt) {
    const keys = [];
    const verts = [start];
    const nodePath = [start];
    let cur = start, d = dir, steps = 0;
    const runMax = depth === 0 ? 4.4 : depth === 1 ? 3.0 : 2.2;
    const branchP = depth === 0 ? 0.155 : depth === 1 ? 0.10 : 0;

    while (steps < budget) {
      const run = 1 + Math.floor(rnd() * runMax);
      let moved = 0;
      while (moved < run && steps < budget) {
        const nxt = canStep(cur, d, true, keys);
        if (nxt < 0) break;
        cur = nxt; nodePath.push(cur); steps++; moved++;
        if (branchSink && steps > 1 && rnd() < branchP) {
          branchSink.push({ node: cur, dir: d, depth: depth + 1, at: nodePath.length - 1 });
        }
      }
      if (moved === 0) break;
      verts.push(cur);
      if (steps >= budget) break;
      const nd = pickTurn(cur, d);
      if (nd < 0) break;
      d = nd;
    }

    if (verts.length < 2) { releaseKeys(keys); return null; }
    return {
      depth: depth, verts: verts, nodePath: nodePath, keys: keys,
      parent: parent === undefined ? null : parent,
      attachAt: attachAt === undefined ? 0 : attachAt,
      endNode: cur
    };
  }

  function buildRaws(seed) {
    occ = new Map();
    owner = new Map();
    owner.set(seed, 1);

    const raws = [];
    /* score the 8 outward directions by how much open lattice they face */
    const sc = [];
    const sc0 = seed % cols, sr0 = (seed / cols) | 0;
    for (let d = 0; d < 8; d++) {
      let n = 0, c = sc0, r = sr0;
      while (n < 40) {
        c += DIRS[d][0]; r += DIRS[d][1];
        if (!inBounds(c, r)) break;
        n++;
      }
      sc.push({ d: d, n: n + rnd() * 2.4 });
    }
    sc.sort(function (a, b) { return b.n - a.n; });

    const branchSink = [];
    for (let i = 0; i < sc.length && raws.length < trunkTarget; i++) {
      const budget = Math.max(4, Math.round(maxTrunkSteps * (0.62 + rnd() * 0.45)));
      const rr = growRoute(seed, sc[i].d, 0, budget, branchSink, null, 0);
      if (rr) raws.push(rr);
    }

    /* breadth-first branch expansion keeps the trunk silhouette readable */
    let head = 0;
    while (head < branchSink.length && raws.length < routeCap) {
      const job = branchSink[head++];
      if (job.depth > 2) continue;
      const parentIdx = raws.findIndex(function (r) { return r.nodePath.indexOf(job.node) >= 0; });
      if (parentIdx < 0) continue;
      const budget = job.depth === 1
        ? Math.max(3, Math.min(9, Math.round(cols * 0.32 * (0.6 + rnd() * 0.8))))
        : Math.max(2, Math.min(5, Math.round(cols * 0.18 * (0.6 + rnd() * 0.8))));
      const side = rnd() < 0.5 ? 1 : -1;
      const opts = [job.dir + side * 2, job.dir - side * 2, job.dir + side, job.dir - side, job.dir + side * 3];
      let made = null;
      for (let k = 0; k < opts.length && !made; k++) {
        const nd = ((opts[k] % 8) + 8) % 8;
        if (canStep(job.node, nd, false, null) < 0) continue;
        made = growRoute(job.node, nd, job.depth, budget,
          job.depth < 2 ? branchSink : null, parentIdx, job.at);
      }
      if (made) raws.push(made);
    }

    nodesUsed = owner.size;
    return raws;
  }

  /* ---------- geometry ---------- */
  function ptsOf(verts) {
    const p = [];
    for (let i = 0; i < verts.length; i++) p.push({ x: nodeX[verts[i]], y: nodeY[verts[i]] });
    return p;
  }

  function buildGeom(pts) {
    let d = 'M' + f1(pts[0].x) + ' ' + f1(pts[0].y);
    const flat = [pts[0].x, pts[0].y];
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
      let ax = p1.x - p0.x, ay = p1.y - p0.y;
      const la = Math.sqrt(ax * ax + ay * ay);
      let bx = p2.x - p1.x, by = p2.y - p1.y;
      const lb = Math.sqrt(bx * bx + by * by);
      if (la < 0.001 || lb < 0.001) continue;
      ax /= la; ay /= la; bx /= lb; by /= lb;
      const r = Math.min(chamfer, la * 0.45, lb * 0.45);
      const sx = p1.x - ax * r, sy = p1.y - ay * r;
      const ex = p1.x + bx * r, ey = p1.y + by * r;
      d += 'L' + f1(sx) + ' ' + f1(sy) + 'Q' + f1(p1.x) + ' ' + f1(p1.y) + ' ' + f1(ex) + ' ' + f1(ey);
      flat.push(sx, sy);
      for (let s = 1; s <= 6; s++) {
        const t = s / 6, mt = 1 - t;
        flat.push(mt * mt * sx + 2 * mt * t * p1.x + t * t * ex,
          mt * mt * sy + 2 * mt * t * p1.y + t * t * ey);
      }
    }
    const lp = pts[pts.length - 1];
    d += 'L' + f1(lp.x) + ' ' + f1(lp.y);
    flat.push(lp.x, lp.y);

    let len = 0;
    for (let i = 2; i < flat.length; i += 2) {
      const dx = flat[i] - flat[i - 2], dy = flat[i + 1] - flat[i - 1];
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return { d: d, flat: flat, len: Math.max(1, len) };
  }

  function resample(flat, n) {
    const out = new Float64Array(n * 2);
    const seg = [];
    let total = 0;
    for (let i = 2; i < flat.length; i += 2) {
      const dx = flat[i] - flat[i - 2], dy = flat[i + 1] - flat[i - 1];
      const l = Math.sqrt(dx * dx + dy * dy);
      seg.push(l); total += l;
    }
    if (total <= 0) {
      for (let k = 0; k < n; k++) { out[k * 2] = flat[0]; out[k * 2 + 1] = flat[1]; }
      return out;
    }
    let si = 0, acc = 0;
    for (let k = 0; k < n; k++) {
      const target = total * k / (n - 1);
      while (si < seg.length - 1 && acc + seg[si] < target) { acc += seg[si]; si++; }
      const t = seg[si] > 0 ? (target - acc) / seg[si] : 0;
      const a = si * 2;
      out[k * 2] = flat[a] + (flat[a + 2] - flat[a]) * t;
      out[k * 2 + 1] = flat[a + 1] + (flat[a + 3] - flat[a + 1]) * t;
    }
    return out;
  }

  function sampleFor(flat, step, cap) {
    const out = [];
    let acc = 0;
    out.push(flat[0], flat[1]);
    for (let i = 2; i < flat.length && out.length < cap * 2; i += 2) {
      const dx = flat[i] - flat[i - 2], dy = flat[i + 1] - flat[i - 1];
      acc += Math.sqrt(dx * dx + dy * dy);
      if (acc >= step) { acc = 0; out.push(flat[i], flat[i + 1]); }
    }
    out.push(flat[flat.length - 2], flat[flat.length - 1]);
    return out;
  }

  const MORPH_N = 88;
  function morphD(a, b, t) {
    let s = 'M' + f1(a[0] + (b[0] - a[0]) * t) + ' ' + f1(a[1] + (b[1] - a[1]) * t);
    for (let i = 2; i < a.length; i += 2) {
      s += 'L' + f1(a[i] + (b[i] - a[i]) * t) + ' ' + f1(a[i + 1] + (b[i + 1] - a[i + 1]) * t);
    }
    return s;
  }

  function padD(x, y, s, type) {
    if (type === 2) {
      return 'M' + f1(x - s) + ' ' + f1(y) + 'A' + f1(s) + ' ' + f1(s) + ' 0 1 0 ' + f1(x + s) + ' ' + f1(y) +
        'A' + f1(s) + ' ' + f1(s) + ' 0 1 0 ' + f1(x - s) + ' ' + f1(y) + 'Z';
    }
    if (type === 3) {
      return 'M' + f1(x) + ' ' + f1(y - s * 1.25) + 'L' + f1(x + s * 1.25) + ' ' + f1(y) +
        'L' + f1(x) + ' ' + f1(y + s * 1.25) + 'L' + f1(x - s * 1.25) + ' ' + f1(y) + 'Z';
    }
    return 'M' + f1(x - s) + ' ' + f1(y - s) + 'L' + f1(x + s) + ' ' + f1(y - s) +
      'L' + f1(x + s) + ' ' + f1(y + s) + 'L' + f1(x - s) + ' ' + f1(y + s) + 'Z';
  }

  /* ---------- route lifecycle ---------- */
  function newRoute() {
    return {
      depth: 0, parent: null, children: [], pts: null, geom: null, samples: null,
      keys: [], branchNorm: 0, el: null, glowEl: null, glow2El: null, padEl: null,
      k: 0, state: 'grow', delay: 0, dur: 0.5, energy: 1, rest: 0.4,
      amber: 0, padA: 0, exciteAt: -1, pulse: null, raw: null, regrow: false,
      wK: -1, wOp: -1, wCol: -1, wD: '', wPad: -1, wGlow: -1,
      morphFrom: null, morphTo: null, pendingRaw: null
    };
  }

  function assignGeom(r, raw) {
    r.depth = raw.depth;
    r.keys = raw.keys;
    r.pts = ptsOf(raw.verts);
    r.geom = buildGeom(r.pts);
    r.samples = sampleFor(r.geom.flat, cell * 0.7, 52);
    r.rest = r.depth === 0 ? 0.42 : r.depth === 1 ? 0.30 : 0.22;
    r.raw = raw;
  }

  function attachElements(r) {
    if (!r.el) r.el = tracePool.get(routeCap + 4);
    if (!r.el) return false;
    r.el.setAttribute('d', r.geom.d);
    r.el.setAttribute('stroke-width', STROKE_W[r.depth]);
    r.el.style.strokeDasharray = '0 1000';
    r.el.style.opacity = '0';
    r.wK = -1; r.wOp = -1; r.wCol = -1; r.wD = r.geom.d;

    if (r.depth === 0) {
      if (!r.glowEl) r.glowEl = glowPool.get(10);
      if (!r.glow2El) r.glow2El = glow2Pool.get(10);
      const halo = [r.glowEl, r.glow2El];
      for (let i = 0; i < 2; i++) {
        if (!halo[i]) continue;
        halo[i].setAttribute('d', r.geom.d);
        halo[i].setAttribute('stroke', PHOS);
        halo[i].style.strokeDasharray = '0 1000';
        halo[i].style.opacity = '0';
      }
      r.wGlow = -1;
    }

    if (!r.padEl) r.padEl = padPool.get(routeCap + 4);
    if (r.padEl) {
      const tip = r.pts[r.pts.length - 1];
      const s = r.depth === 0 ? cell * 0.15 : r.depth === 1 ? cell * 0.11 : cell * 0.085;
      const type = Math.floor(rnd() * 4);
      r.padEl.setAttribute('d', padD(tip.x, tip.y, s, type));
      const filled = type === 1 || (type === 3 && rnd() < 0.5);
      const col = r.depth === 0 ? PHOS : DEPTH_TOP[r.depth];
      r.padEl.style.fill = filled ? col : 'none';
      r.padEl.style.stroke = filled ? 'none' : col;
      r.padEl.setAttribute('stroke-width', r.depth === 0 ? '1.3' : '1');
      r.padEl.style.opacity = '0';
      r.padA = 0; r.wPad = -1;
    }
    return true;
  }

  function releaseRoute(r) {
    tracePool.put(r.el); r.el = null;
    glowPool.put(r.glowEl); r.glowEl = null;
    glow2Pool.put(r.glow2El); r.glow2El = null;
    padPool.put(r.padEl); r.padEl = null;
    if (r.pulse) killPulse(r.pulse);
    r.pulse = null;
  }

  function startRetract(r, base) {
    r.state = 'retract';
    r.delay = base + (2 - r.depth) * 0.05 + rnd() * 0.14;
    r.dur = 0.26 + rnd() * 0.16;
    if (r.pulse) { killPulse(r.pulse); r.pulse = null; }
  }

  /* ---------- pulses ---------- */
  function spawnPulse(r, amberMode) {
    if (!r || r.pulse || r.k < 0.97 || r.state !== 'live' || !r.el) return;
    const el = pulsePool.get(13);
    if (!el) return;
    const gl = pulseGlowPool.get(13);
    const pl = Math.max(16, Math.min(150, 1000 * (cell * 1.9) / r.geom.len));
    el.setAttribute('d', r.geom.d);
    el.style.strokeDasharray = pl + ' 1000';
    el.style.stroke = amberMode ? HOT_AMBER : HOT;
    el.style.opacity = r.depth === 0 ? '1' : '.82';
    el.setAttribute('stroke-width', r.depth === 0 ? 2.6 : 1.8);
    if (gl) {
      gl.setAttribute('d', r.geom.d);
      gl.style.strokeDasharray = pl + ' 1000';
      gl.style.stroke = amberMode ? AMBER : PHOS;
    }
    const p = {
      r: r, el: el, gl: gl, pl: pl, s: -pl,
      speed: 1000 * (cell * 15.5) / r.geom.len,
      head: 0, wOff: 1e9
    };
    r.pulse = p;
    pulses.push(p);
  }

  function killPulse(p) {
    if (!p) return;
    pulsePool.put(p.el);
    pulseGlowPool.put(p.gl);
    p.dead = true;
    if (p.r && p.r.pulse === p) p.r.pulse = null;
  }

  /* ---------- hit grid ---------- */
  function rebuildHit() {
    hitGrid.clear();
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      if (!r.samples) continue;
      const seen = new Set();
      for (let j = 0; j < r.samples.length; j += 2) {
        const key = ((r.samples[j] / hitCell) | 0) * 4096 + ((r.samples[j + 1] / hitCell) | 0);
        if (seen.has(key)) continue;
        seen.add(key);
        let b = hitGrid.get(key);
        if (!b) { b = []; hitGrid.set(key, b); }
        b.push(r);
      }
    }
  }

  function nearestRoute(x, y) {
    const cx = (x / hitCell) | 0, cy = (y / hitCell) | 0;
    let best = null, bestD = cell * cell * 0.62;
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const bucket = hitGrid.get((cx + a) * 4096 + (cy + b));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const r = bucket[i];
          if (r.k < 0.9 || r.state !== 'live') continue;
          const s = r.samples;
          for (let j = 0; j < s.length; j += 2) {
            const dx = s[j] - x, dy = s[j + 1] - y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD) { bestD = d2; best = r; }
          }
        }
      }
    }
    return best;
  }

  /* ---------- network assembly ---------- */
  function linkChildren(raws) {
    for (let i = 0; i < routes.length; i++) routes[i].children.length = 0;
    for (let i = 0; i < raws.length; i++) {
      const raw = raws[i];
      const r = routes[i];
      if (!r) continue;
      if (raw.parent === null || raw.parent === undefined) { r.parent = null; continue; }
      const p = routes[raw.parent];
      if (!p || p === r) { r.parent = null; continue; }
      r.parent = p;
      /* branch distance measured on the parent's node polyline, mapped to normalised units */
      let acc = 0, total = 0;
      const np = p.raw.nodePath;
      for (let j = 1; j < np.length; j++) {
        const dx = nodeX[np[j]] - nodeX[np[j - 1]], dy = nodeY[np[j]] - nodeY[np[j - 1]];
        const l = Math.sqrt(dx * dx + dy * dy);
        total += l;
        if (j <= raw.attachAt) acc += l;
      }
      r.branchNorm = total > 0 ? Math.max(30, Math.min(985, 1000 * acc / total)) : 500;
      p.children.push(r);
    }
    for (let i = 0; i < routes.length; i++) {
      routes[i].children.sort(function (a, b) { return a.branchNorm - b.branchNorm; });
    }
  }

  function junctionPath() {
    let d = '';
    let n = 0;
    for (let i = 0; i < routes.length && n < 16; i++) {
      const r = routes[i];
      if (r.depth !== 1 || !r.pts) continue;
      const s = cell * 0.055;
      d += padD(r.pts[0].x, r.pts[0].y, s, 0);
      n++;
    }
    junctions.setAttribute('d', d || 'M0 0');
  }

  function instantiate(raws, baseDelay) {
    const maxSeedDist = Math.max(1, VBW * 0.6);
    for (let i = 0; i < raws.length; i++) {
      let r = routes[i];
      if (!r) { r = newRoute(); routes[i] = r; }
      assignGeom(r, raws[i]);
      if (!attachElements(r)) { routes.length = i; break; }
      const tip = r.pts[r.pts.length - 1];
      const dd = Math.sqrt((tip.x - seedX) * (tip.x - seedX) + (tip.y - seedY) * (tip.y - seedY));
      r.state = 'grow';
      r.k = 0;
      r.energy = 1;
      r.amber = 0;
      r.exciteAt = -1;
      r.delay = baseDelay + r.depth * 0.15 + (dd / maxSeedDist) * 0.30 + rnd() * 0.07;
      r.dur = Math.max(0.26, Math.min(0.68, 0.24 + r.geom.len / 2400));
    }
    if (routes.length > raws.length) {
      for (let i = raws.length; i < routes.length; i++) releaseRoute(routes[i]);
      routes.length = raws.length;
    }
    linkChildren(raws);
    junctionPath();
    rebuildHit();
  }

  /* ---------- full reroute (click) ---------- */
  function reroute(node) {
    const raws = buildRaws(node);
    if (!raws.length) return;

    seedFromX = seedX; seedFromY = seedY;
    seedNode = node;
    seedToX = nodeX[node]; seedToY = nodeY[node];

    const oldTrunks = routes.filter(function (r) { return r.depth === 0 && r.el; });
    const newTrunks = raws.filter(function (r) { return r.depth === 0; });

    /* buildRaws swapped in a fresh occupancy map, so every key held by an
       outgoing route is stale and must never be released against the new one */
    for (let i = 0; i < retiring.length; i++) {
      retiring[i].keys = [];
      retiring[i].regrow = false;
    }

    /* orphan everything that is not a trunk; trunks morph in place */
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      if (r.depth === 0) continue;
      r.keys = [];
      startRetract(r, 0);
      retiring.push(r);
    }

    const used = new Array(newTrunks.length).fill(false);
    const carried = [];
    for (let i = 0; i < oldTrunks.length; i++) {
      const r = oldTrunks[i];
      const tip = r.pts[r.pts.length - 1];
      let best = -1, bestD = Infinity;
      for (let j = 0; j < newTrunks.length; j++) {
        if (used[j]) continue;
        const np = newTrunks[j].verts[newTrunks[j].verts.length - 1];
        const dx = nodeX[np] - tip.x, dy = nodeY[np] - tip.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD) { bestD = d2; best = j; }
      }
      if (best < 0) { r.keys = []; startRetract(r, 0); retiring.push(r); continue; }
      used[best] = true;
      r.morphFrom = resample(r.geom.flat, MORPH_N);
      const np = ptsOf(newTrunks[best].verts);
      r.morphTo = resample(buildGeom(np).flat, MORPH_N);
      r.pendingRaw = newTrunks[best];
      carried.push(r);
    }

    routes = carried;
    for (let i = 0; i < routes.length; i++) { routes[i].children.length = 0; }
    hitGrid.clear();
    hovered = null;

    for (let i = 0; i < pulses.length; i++) killPulse(pulses[i]);
    pulses.length = 0;

    pendingRaws = raws;
    pendingTrunks = newTrunks;
    phase = 'morph';
    morphT = 0;
  }

  function finishMorph() {
    /* reorder raws so carried trunks keep their element, then append the rest */
    const ordered = [];
    for (let i = 0; i < routes.length; i++) ordered.push(routes[i].pendingRaw);
    const remap = new Map();
    for (let i = 0; i < ordered.length; i++) remap.set(pendingRaws.indexOf(ordered[i]), i);
    for (let i = 0; i < pendingRaws.length; i++) {
      if (remap.has(i)) continue;
      remap.set(i, ordered.length);
      ordered.push(pendingRaws[i]);
    }
    for (let i = 0; i < ordered.length; i++) {
      const raw = ordered[i];
      if (raw.parent !== null && raw.parent !== undefined) {
        const m = remap.get(raw.parent);
        raw.parent = m === undefined ? null : m;
      }
    }

    const trunkCount = routes.length;
    for (let i = 0; i < trunkCount; i++) {
      const r = routes[i];
      assignGeom(r, ordered[i]);
      r.el.setAttribute('d', r.geom.d);
      if (r.glowEl) r.glowEl.setAttribute('d', r.geom.d);
      if (r.glow2El) r.glow2El.setAttribute('d', r.geom.d);
      r.wD = r.geom.d;
      r.state = 'live';
      r.k = 1; r.wK = -1;
      r.energy = 1;
      r.pendingRaw = null;
      const tip = r.pts[r.pts.length - 1];
      if (!r.padEl) r.padEl = padPool.get(routeCap + 4);
      if (r.padEl) {
        const s = cell * 0.15;
        r.padEl.setAttribute('d', padD(tip.x, tip.y, s, Math.floor(rnd() * 4)));
        r.padEl.style.fill = 'none';
        r.padEl.style.stroke = PHOS;
        r.wPad = -1;
      }
    }
    /* branches only */
    for (let i = trunkCount; i < ordered.length; i++) {
      let r = routes[i];
      if (!r) { r = newRoute(); routes[i] = r; }
      assignGeom(r, ordered[i]);
      if (!attachElements(r)) { routes.length = i; break; }
      const tip = r.pts[r.pts.length - 1];
      const dd = Math.sqrt((tip.x - seedX) * (tip.x - seedX) + (tip.y - seedY) * (tip.y - seedY));
      r.state = 'grow'; r.k = 0; r.energy = 1; r.amber = 0; r.exciteAt = -1;
      r.delay = r.depth * 0.11 + (dd / (VBW * 0.62)) * 0.26 + rnd() * 0.06;
      r.dur = Math.max(0.24, Math.min(0.6, 0.22 + r.geom.len / 2500));
    }
    linkChildren(ordered);
    junctionPath();
    rebuildHit();
    pendingRaws = null;
    pendingTrunks = null;
    phase = 'grow';
    /* energy burst down every trunk */
    for (let i = 0; i < trunkCount; i++) {
      const r = routes[i];
      r.exciteAt = time + i * 0.06;
    }
  }

  /* ---------- micro reroute (idle) ---------- */
  function microReroute() {
    const cands = [];
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      if (r.depth >= 1 && r.children.length === 0 && r.state === 'live') cands.push(r);
    }
    if (!cands.length) return;
    const r = cands[(rnd() * cands.length) | 0];
    if (r.parent) {
      const ci = r.parent.children.indexOf(r);
      if (ci >= 0) r.parent.children.splice(ci, 1);
    }
    startRetract(r, 0);
    r.regrow = true;
    retiring.push(r);
    routes.splice(routes.indexOf(r), 1);
    rebuildHit();
  }

  function regrowBranch(r) {
    releaseKeys(r.keys);
    let host = null, tries = 0;
    while (tries++ < 14 && !host) {
      const cand = routes[(rnd() * routes.length) | 0];
      if (cand && cand.depth === 0 && cand.raw) host = cand;
    }
    if (!host) { releaseRoute(r); return; }
    const np = host.raw.nodePath;
    const at = 1 + ((rnd() * (np.length - 1)) | 0);
    const node = np[Math.min(at, np.length - 1)];
    let made = null;
    const base = (rnd() * 8) | 0;
    for (let k = 0; k < 8 && !made; k++) {
      const nd = (base + k) % 8;
      if (canStep(node, nd, false, null) < 0) continue;
      made = growRoute(node, nd, 1, Math.max(3, Math.min(8, Math.round(cols * 0.28))), null, null, at);
    }
    if (!made) { releaseRoute(r); return; }
    made.parent = routes.indexOf(host);
    made.attachAt = at;
    assignGeom(r, made);
    if (!attachElements(r)) { releaseRoute(r); return; }
    r.state = 'grow'; r.k = 0; r.energy = 1; r.amber = 0; r.exciteAt = -1;
    r.delay = 0.05; r.dur = 0.34;
    r.regrow = false;
    r.parent = host;
    let acc = 0, total = 0;
    for (let j = 1; j < np.length; j++) {
      const dx = nodeX[np[j]] - nodeX[np[j - 1]], dy = nodeY[np[j]] - nodeY[np[j - 1]];
      const l = Math.sqrt(dx * dx + dy * dy);
      total += l;
      if (j <= at) acc += l;
    }
    r.branchNorm = total > 0 ? Math.max(30, Math.min(985, 1000 * acc / total)) : 500;
    host.children.push(r);
    host.children.sort(function (a, b) { return a.branchNorm - b.branchNorm; });
    routes.push(r);
    junctionPath();
    rebuildHit();
  }

  /* ---------- chrome ---------- */
  function buildChrome() {
    const t = cell * 0.16;
    let minor = '', major = '';
    for (let c = 0; c < cols; c++) {
      const x = f1(offX + c * cell);
      const l = c % 5 === 0 ? t * 2.2 : t;
      const s = 'M' + x + ' ' + f1(offY - cell * 0.42) + 'L' + x + ' ' + f1(offY - cell * 0.42 - l);
      const s2 = 'M' + x + ' ' + f1(VBH - offY + cell * 0.42) + 'L' + x + ' ' + f1(VBH - offY + cell * 0.42 + l * 0.7);
      if (c % 5 === 0) major += s + s2; else minor += s + s2;
    }
    for (let r = 0; r < rows; r++) {
      const y = f1(offY + r * cell);
      const l = r % 5 === 0 ? t * 2.2 : t;
      const s = 'M' + f1(offX - cell * 0.42) + ' ' + y + 'L' + f1(offX - cell * 0.42 - l) + ' ' + y;
      const s2 = 'M' + f1(VBW - offX + cell * 0.42) + ' ' + y + 'L' + f1(VBW - offX + cell * 0.42 + l * 0.7) + ' ' + y;
      if (r % 5 === 0) major += s + s2; else minor += s + s2;
    }
    tickMinor.setAttribute('d', minor || 'M0 0');
    tickMajor.setAttribute('d', major || 'M0 0');
    tickMinor.setAttribute('opacity', '.3');
    tickMajor.setAttribute('opacity', '.55');

    const m = Math.min(offX, offY) * 0.42;
    const a = cell * 0.5, b = cell * 0.18;
    let cm = '';
    const corners = [[m, m, 1, 1], [VBW - m, m, -1, 1], [m, VBH - m, 1, -1], [VBW - m, VBH - m, -1, -1]];
    for (let i = 0; i < 4; i++) {
      const cx = corners[i][0], cy = corners[i][1], sx = corners[i][2], sy = corners[i][3];
      cm += 'M' + f1(cx) + ' ' + f1(cy + sy * a) + 'L' + f1(cx) + ' ' + f1(cy) + 'L' + f1(cx + sx * a) + ' ' + f1(cy);
      cm += 'M' + f1(cx + sx * b * 1.6) + ' ' + f1(cy + sy * b * 1.6) + 'L' + f1(cx + sx * b * 3.2) + ' ' + f1(cy + sy * b * 1.6);
    }
    cornerMarks.setAttribute('d', cm);

    const ty = f1(offY * 0.52 + fs * 0.34);
    const by = f1(VBH - offY * 0.52 + fs * 0.34);
    const lx = f1(offX * 0.5), rx = f1(VBW - offX * 0.5);
    const els = [txtId, txtSeed, txtStat, txtMode];
    const pos = [[lx, ty], [rx, ty], [lx, by], [rx, by]];
    for (let i = 0; i < 4; i++) {
      els[i].setAttribute('x', pos[i][0]);
      els[i].setAttribute('y', pos[i][1]);
      els[i].setAttribute('font-size', f1(fs));
      els[i].style.letterSpacing = f1(fs * 0.13) + 'px';
    }
    setText(0, cols > 20 ? 'RIFT-04 // OCTILINEAR ROUTER' : 'RIFT-04 // ROUTER');
  }

  function setText(i, s) {
    if (lastText[i] === s) return;
    lastText[i] = s;
    (i === 0 ? txtId : i === 1 ? txtSeed : i === 2 ? txtStat : txtMode).textContent = s;
  }

  function buildSeedMarker() {
    const r0 = cell * 0.42, r1 = cell * 0.24, cr = cell * 0.72;
    const ring = 'M' + f1(-r0) + ' 0A' + f1(r0) + ' ' + f1(r0) + ' 0 1 0 ' + f1(r0) + ' 0A' +
      f1(r0) + ' ' + f1(r0) + ' 0 1 0 ' + f1(-r0) + ' 0Z';
    seedRing.setAttribute('d', ring);
    seedHalo.setAttribute('d', ring);
    seedCross.setAttribute('d',
      'M' + f1(-cr) + ' 0L' + f1(-r1) + ' 0M' + f1(r1) + ' 0L' + f1(cr) + ' 0' +
      'M0 ' + f1(-cr) + 'L0 ' + f1(-r1) + 'M0 ' + f1(r1) + 'L0 ' + f1(cr));
    const s = cell * 0.09;
    seedCore.setAttribute('d', 'M' + f1(-s) + ' ' + f1(-s) + 'L' + f1(s) + ' ' + f1(-s) +
      'L' + f1(s) + ' ' + f1(s) + 'L' + f1(-s) + ' ' + f1(s) + 'Z');
    blur.setAttribute('stdDeviation', f1(cell * 0.16));
  }

  let wSeedT = '';
  function placeSeed(x, y, scale) {
    const t = 'translate(' + f1(x) + ' ' + f1(y) + ') scale(' + (Math.round(scale * 100) / 100) + ')';
    if (t === wSeedT) return;
    wSeedT = t;
    seedBloomG.setAttribute('transform', t);
    seedRing.setAttribute('transform', t);
    seedCross.setAttribute('transform', t);
    seedCore.setAttribute('transform', t);
  }

  /* ---------- excitation ---------- */
  function excite(r) {
    r.exciteAt = time;
    const stack = [[r, 0]];
    let guard = 0;
    while (stack.length && guard++ < 120) {
      const cur = stack.pop();
      const node = cur[0], d = cur[1];
      for (let i = 0; i < node.children.length; i++) {
        const c = node.children[i];
        c.exciteAt = time + 0.10 + d * 0.13 + i * 0.055;
        stack.push([c, d + 1]);
      }
    }
    spawnPulse(r, true);
  }

  /* ---------- build ---------- */
  function seedFromPoint(x, y) {
    const c = Math.max(1, Math.min(cols - 2, Math.round((x - offX) / cell)));
    const r = Math.max(1, Math.min(rows - 2, Math.round((y - offY) / cell)));
    return idx(c, r);
  }

  function fullBuild(node) {
    tracePool.releaseAll();
    glowPool.releaseAll();
    glow2Pool.releaseAll();
    padPool.releaseAll();
    pulsePool.releaseAll();
    pulseGlowPool.releaseAll();
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      r.el = null; r.glowEl = null; r.glow2El = null; r.padEl = null; r.pulse = null;
    }
    routes.length = 0;
    retiring.length = 0;
    pulses.length = 0;

    seedNode = node;
    seedX = nodeX[node]; seedY = nodeY[node];
    seedFromX = seedX; seedFromY = seedY; seedToX = seedX; seedToY = seedY;

    const raws = buildRaws(node);
    instantiate(raws, 0.04);
    phase = 'grow';
    morphT = 0;
    hovered = null;
    wSeedT = '';
    placeSeed(seedX, seedY, 1);
  }

  function stillFrame() {
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      r.state = 'live';
      r.k = 1;
      r.energy = r.depth === 0 ? 0.92 : r.depth === 1 ? 0.62 : 0.40;
      r.padA = 1;
      if (r.el) {
        r.el.style.strokeDasharray = 'none';
        r.el.style.strokeDashoffset = '0';
        r.el.style.opacity = (0.16 + 0.84 * r.energy).toFixed(3);
        r.el.style.stroke = COLOR_TABLE[r.depth][Math.round(r.energy * 8)][0];
      }
      const halo = [r.glowEl, r.glow2El];
      for (let h = 0; h < 2; h++) {
        if (!halo[h]) continue;
        halo[h].style.strokeDasharray = 'none';
        halo[h].style.strokeDashoffset = '0';
        halo[h].style.opacity = h === 0 ? '.15' : '.28';
      }
      if (r.padEl) r.padEl.style.opacity = (0.35 + 0.55 * r.energy).toFixed(3);
    }
    /* one amber accent branch, composed rather than random-looking */
    let accent = null;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].depth === 1 && routes[i].geom.len > cell * 3) { accent = routes[i]; break; }
    }
    if (accent && accent.el) {
      accent.el.style.stroke = AMBER;
      accent.el.style.opacity = '1';
      if (accent.padEl) { accent.padEl.style.stroke = AMBER; accent.padEl.style.opacity = '1'; }
      for (let i = 0; i < accent.children.length; i++) {
        const c = accent.children[i];
        if (c.el) { c.el.style.stroke = mixHex(DEPTH_TOP[c.depth], AMBER, 0.35); c.el.style.opacity = '.9'; }
      }
    }
    /* frozen packets so the plate reads as live hardware, not an empty diagram */
    const frozen = [0.44, 0.68, 0.31];
    let n = 0;
    for (let i = 0; i < routes.length && n < frozen.length; i++) {
      const r = routes[i];
      if (r.depth !== 0) continue;
      const el = pulsePool.get(13);
      const gl = pulseGlowPool.get(13);
      if (!el) break;
      const pl = Math.max(16, Math.min(150, 1000 * (cell * 1.9) / r.geom.len));
      el.setAttribute('d', r.geom.d);
      el.style.strokeDasharray = pl + ' 1000';
      el.style.strokeDashoffset = -(frozen[n] * 1000);
      el.style.stroke = HOT;
      el.style.opacity = '1';
      if (gl) {
        gl.setAttribute('d', r.geom.d);
        gl.style.strokeDasharray = pl + ' 1000';
        gl.style.strokeDashoffset = -(frozen[n] * 1000);
        gl.style.stroke = PHOS;
      }
      n++;
    }
    junctions.setAttribute('opacity', '.5');
    placeSeed(seedX, seedY, 1);
    setText(1, 'SEED ' + pad3(seedNode % cols) + ',' + pad3((seedNode / cols) | 0));
    setText(2, 'NODES ' + pad3(nodesUsed) + '  ROUTES ' + pad3(routes.length));
    setText(3, '[ HOLD ]');
    band.style.transform = 'translate3d(0,' + Math.round(H * 0.34) + 'px,0)';
  }

  /* ---------- api ---------- */
  function resize(w, h) {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    if (w === W && h === H) return;
    W = w; H = h;
    VBH = Math.max(200, VBW * h / w);
    svg.setAttribute('viewBox', '0 0 ' + VBW + ' ' + f1(VBH));

    buildLattice();
    buildChrome();
    buildSeedMarker();

    const cellPx = cell * W / VBW;
    gridBg.style.backgroundSize = cellPx.toFixed(2) + 'px ' + cellPx.toFixed(2) + 'px';
    gridBg.style.backgroundPosition = (offX * W / VBW - cellPx / 2).toFixed(2) + 'px ' +
      (offY * H / VBH - cellPx / 2).toFixed(2) + 'px';

    fullBuild(idx(Math.max(1, Math.round(cols * 0.30)), Math.max(1, Math.round(rows * 0.58))));
    ready = true;

    if (reduced) stillFrame();
  }

  function update(dt, elapsed) {
    if (reduced || !ready || !active) return;
    if (!(dt > 0)) return;
    if (dt > 0.05) dt = 0.05;
    time += dt;

    /* --- phase: trunk morph --- */
    if (phase === 'morph') {
      morphT += dt / MORPH_DUR;
      let e;
      if (morphT >= 1) { morphT = 1; e = 1; } else e = easeInOutQuart(morphT);
      for (let i = 0; i < routes.length; i++) {
        const r = routes[i];
        if (!r.morphFrom || !r.el) continue;
        const d = morphD(r.morphFrom, r.morphTo, e);
        if (d !== r.wD) {
          r.el.setAttribute('d', d);
          if (r.glowEl) r.glowEl.setAttribute('d', d);
          if (r.glow2El) r.glow2El.setAttribute('d', d);
          r.wD = d;
        }
      }
      const sx = seedFromX + (seedToX - seedFromX) * e;
      const sy = seedFromY + (seedToY - seedFromY) * e;
      placeSeed(sx, sy, 1 + Math.sin(Math.min(1, morphT) * Math.PI) * 0.55);
      seedX = sx; seedY = sy;
      if (morphT >= 1) {
        for (let i = 0; i < routes.length; i++) { routes[i].morphFrom = null; routes[i].morphTo = null; }
        seedX = seedToX; seedY = seedToY;
        finishMorph();
      }
    } else {
      placeSeed(seedX, seedY, 1 + Math.sin(time * 1.7) * 0.045);
    }

    /* --- pointer hover --- */
    if (ptrDirty && phase !== 'morph') {
      ptrDirty = false;
      const hit = ptrLive ? nearestRoute(ptrX, ptrY) : null;
      if (hit !== hovered) {
        hovered = hit;
        if (hit) excite(hit);
      }
    }

    /* --- routes --- */
    let growing = 0;
    for (let i = 0; i < routes.length; i++) stepRoute(routes[i], dt, true);
    for (let i = retiring.length - 1; i >= 0; i--) {
      const r = retiring[i];
      stepRoute(r, dt, false);
      if (r.state === 'gone') {
        retiring.splice(i, 1);
        if (r.regrow) regrowBranch(r);
        else { releaseKeys(r.keys); releaseRoute(r); }
      }
    }
    for (let i = 0; i < routes.length; i++) if (routes[i].state === 'grow') growing++;
    if (phase === 'grow' && growing === 0 && retiring.length === 0) phase = 'idle';

    /* --- pulses --- */
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      if (p.dead) { pulses.splice(i, 1); continue; }
      const prev = p.s + p.pl;
      p.s += p.speed * dt;
      const head = p.s + p.pl;
      const r = p.r;
      for (let j = 0; j < r.children.length; j++) {
        const c = r.children[j];
        if (c.branchNorm > prev && c.branchNorm <= head) {
          spawnPulse(c, r.amber > 0.4);
          c.exciteAt = time;
        }
      }
      if (p.s > 1000) { killPulse(p); pulses.splice(i, 1); continue; }
      const off = -Math.round(p.s * 4) / 4;
      if (off !== p.wOff) {
        p.wOff = off;
        p.el.style.strokeDashoffset = off;
        if (p.gl) p.gl.style.strokeDashoffset = off;
      }
    }

    pulseTimer -= dt;
    if (pulseTimer <= 0) {
      pulseTimer = 0.55 + rnd() * 1.15;
      const trunks = [];
      for (let i = 0; i < routes.length; i++) if (routes[i].depth === 0) trunks.push(routes[i]);
      if (trunks.length) spawnPulse(trunks[(rnd() * trunks.length) | 0], false);
    }

    microTimer -= dt;
    if (microTimer <= 0) {
      microTimer = 4.5 + rnd() * 4;
      if (phase === 'idle') microReroute();
    }

    /* --- chrome + crt --- */
    bandY += dt * H * 0.16;
    if (bandY > H * 1.34) bandY = -H * 0.34;
    band.style.transform = 'translate3d(0,' + Math.round(bandY) + 'px,0)';

    setText(1, 'SEED ' + pad3(seedNode % cols) + ',' + pad3((seedNode / cols) | 0));
    setText(2, 'NODES ' + pad3(nodesUsed) + '  ROUTES ' + pad3(routes.length));
    setText(3, phase === 'morph' ? '[ ROUTING ]' : hovered ? '[ ENERGISE ]' : phase === 'grow' ? '[ GROW ]' : '[ IDLE ]');
    const jo = phase === 'morph' ? 0 : 0.5;
    if (jo !== lastJunctionOpacity) { lastJunctionOpacity = jo; junctions.setAttribute('opacity', jo); }
  }

  function stepRoute(r, dt, live) {
    if (!r.el) return;

    if (r.state === 'grow') {
      if (r.delay > 0) r.delay -= dt;
      else {
        r.k += dt / r.dur;
        if (r.k >= 1) { r.k = 1; r.state = 'live'; }
      }
    } else if (r.state === 'retract') {
      if (r.delay > 0) r.delay -= dt;
      else {
        r.k -= dt / r.dur;
        if (r.k <= 0) { r.k = 0; r.state = 'gone'; }
      }
    }

    if (r.exciteAt >= 0 && time >= r.exciteAt) { r.exciteAt = -1; r.energy = 1; }

    const targetE = r.state === 'grow' ? 1 : r.rest;
    r.energy += (targetE - r.energy) * Math.min(1, dt * 2.2);
    const wantAmber = live && r === hovered ? 1 : 0;
    r.amber += (wantAmber - r.amber) * Math.min(1, dt * (wantAmber ? 7 : 2.6));

    const kk = Math.round(r.k * 1000);
    if (Math.abs(kk - r.wK) > 1.5) {
      r.wK = kk;
      const da = kk + ' 1000';
      r.el.style.strokeDasharray = da;
      if (r.glowEl) r.glowEl.style.strokeDasharray = da;
      if (r.glow2El) r.glow2El.style.strokeDasharray = da;
    }

    const drawn = r.state === 'grow' ? easeOutCubic(r.k) : r.k;
    const op = (0.16 + 0.84 * r.energy) * Math.min(1, drawn * 3.2);
    if (Math.abs(op - r.wOp) > 0.01) { r.wOp = op; r.el.style.opacity = op.toFixed(3); }

    const ei = Math.max(0, Math.min(8, Math.round(r.energy * 8)));
    const ai = Math.max(0, Math.min(4, Math.round(r.amber * 4)));
    const ci = ei * 8 + ai;
    if (ci !== r.wCol) {
      r.wCol = ci;
      r.el.style.stroke = COLOR_TABLE[r.depth][ei][ai];
    }

    if (r.glowEl || r.glow2El) {
      const go = (0.035 + 0.13 * r.energy + 0.11 * r.amber) * Math.min(1, drawn * 3.2);
      if (Math.abs(go - r.wGlow) > 0.006) {
        r.wGlow = go;
        const col = r.amber > 0.25 ? AMBER : PHOS;
        if (r.glowEl) { r.glowEl.style.opacity = go.toFixed(3); r.glowEl.style.stroke = col; }
        if (r.glow2El) { r.glow2El.style.opacity = (go * 1.9).toFixed(3); r.glow2El.style.stroke = col; }
      }
    }

    if (r.padEl) {
      const want = r.morphFrom || r.state === 'retract' || r.state === 'gone' ? 0 : (r.k > 0.95 ? 1 : 0);
      r.padA += (want - r.padA) * Math.min(1, dt * 7);
      const po = r.padA * (0.34 + 0.62 * r.energy);
      if (Math.abs(po - r.wPad) > 0.012) {
        r.wPad = po;
        r.padEl.style.opacity = po.toFixed(3);
        if (r.amber > 0.3) {
          if (r.padEl.style.fill !== 'none') r.padEl.style.fill = AMBER; else r.padEl.style.stroke = AMBER;
        } else if (r.wCol >= 0) {
          const col = DEPTH_TOP[r.depth];
          if (r.padEl.style.fill !== 'none') r.padEl.style.fill = col; else r.padEl.style.stroke = col;
        }
      }
    }
  }

  /* ---------- pointer ---------- */
  function refreshRect(ts) {
    if (ts - rectAt < 120 && rect) return;
    rectAt = ts;
    rect = root.getBoundingClientRect();
  }

  function toVB(e) {
    if (!rect || rect.width <= 0 || rect.height <= 0) return false;
    ptrX = (e.clientX - rect.left) / rect.width * VBW;
    ptrY = (e.clientY - rect.top) / rect.height * VBH;
    return ptrX >= 0 && ptrY >= 0 && ptrX <= VBW && ptrY <= VBH;
  }

  function onMove(e) {
    if (e.pointerType === 'touch') return;
    refreshRect(e.timeStamp);
    ptrLive = toVB(e);
    ptrDirty = true;
  }
  function onLeave() {
    ptrLive = false;
    ptrDirty = true;
  }
  function onDown(e) {
    downId = e.pointerId;
    downX = e.clientX; downY = e.clientY; downT = e.timeStamp;
  }
  function onUp(e) {
    if (e.pointerId !== downId) return;
    downId = -1;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    if (dx * dx + dy * dy > 156 || e.timeStamp - downT > 600) return;
    if (!ready || phase === 'morph') return;
    rectAt = -1e9;
    refreshRect(e.timeStamp);
    if (!toVB(e)) return;
    rnd = mulberry32((ptrX * 7919 + ptrY * 104729 + time * 1000) | 0);
    reroute(seedFromPoint(ptrX, ptrY));
  }
  function onCancel() { downId = -1; ptrLive = false; ptrDirty = true; }

  if (!reduced) {
    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave, { passive: true });
    root.addEventListener('pointerdown', onDown, { passive: true });
    root.addEventListener('pointerup', onUp, { passive: true });
    root.addEventListener('pointercancel', onCancel, { passive: true });
  }

  return {
    resize: resize,
    update: update,
    activate: function () {
      active = true;
      rectAt = -1e9;
      pulseTimer = Math.min(pulseTimer, 0.35);
    },
    deactivate: function () {
      active = false;
      ptrLive = false;
      hovered = null;
      ptrDirty = true;
    },
    destroy: function () {
      active = false;
      ready = false;
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onCancel);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      root.classList.remove(cls + '-host');
      routes.length = 0;
      retiring.length = 0;
      pulses.length = 0;
      hitGrid.clear();
      occ.clear();
      owner.clear();
      nodeX = null;
      nodeY = null;
    }
  };
}
