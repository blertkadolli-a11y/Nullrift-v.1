import * as THREE from 'three';

/* 05 — NULL CLOUD
   One THREE.Points object. Six formations baked into vertex attributes and
   blended on the GPU; the sequence is driven purely by a user-scrubbed scalar. */

const NAMES = ['NULL GLYPH', 'TORN SHELL', 'TREFOIL KNOT', 'DATA LATTICE', 'SPIRAL DRIFT', 'NULLRIFT'];
const NF = NAMES.length;
const MAXP = NF - 1;

const FOV = 40;
const FIT_RADIUS = 1.82;
const DAMP = 3.15;
const SNAP_K = 9.5;

function mulberry32(a) {
  let s = a | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rnd) {
  return (rnd() + rnd() + rnd() - 1.5) * 1.1547;
}

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

/* ---------- formation builders : each writes n * vec3 into `out` ---------- */

function sampleCoverage(cv) {
  const w = cv.width;
  const h = cv.height;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const data = c.getImageData(0, 0, w, h).data;
  const hits = [];
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    if (data[p] > 110) hits.push(i);
  }
  return hits;
}

function scatterCoverage(out, n, rnd, hits, cw, ch, worldW, zFn) {
  const worldH = (worldW * ch) / cw;
  const m = hits.length;
  if (!m) {
    for (let i = 0; i < n * 3; i++) out[i] = 0;
    return;
  }
  for (let i = 0; i < n; i++) {
    const idx = hits[(rnd() * m) | 0];
    const px = (idx % cw) + rnd();
    const py = ((idx / cw) | 0) + rnd();
    const x = (px / cw - 0.5) * worldW;
    const y = -(py / ch - 0.5) * worldH;
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = zFn(x, y, rnd);
  }
}

function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
}

function buildGlyph(out, n) {
  const rnd = mulberry32(0x2a71);
  const S = 384;
  const cv = makeCanvas(S, S);
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000';
  c.fillRect(0, 0, S, S);
  c.strokeStyle = '#fff';
  c.lineCap = 'butt';
  const cx = S * 0.5;
  const cy = S * 0.5;
  const R = S * 0.3;
  const LW = S * 0.104;
  c.lineWidth = LW;
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.stroke();
  const ang = -Math.PI * 0.32;
  const L = R + LW * 1.2;
  c.beginPath();
  c.moveTo(cx - Math.cos(ang) * L, cy - Math.sin(ang) * L);
  c.lineTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L);
  c.stroke();

  const worldW = 2.88;
  const inv = 1 / (worldW * 0.5 * worldW * 0.5);
  scatterCoverage(out, n, rnd, sampleCoverage(cv), S, S, worldW, (x, y, r) => {
    let z = (r() < 0.5 ? -1 : 1) * (0.082 + 0.032 * r());
    if (r() < 0.24) z *= r() * 0.55;
    return z - 0.3 * (x * x + y * y) * inv;
  });
}

function buildWordmark(out, n) {
  const rnd = mulberry32(0x7f31);
  const W = 1024;
  const H = 208;
  const cv = makeCanvas(W, H);
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  try {
    c.letterSpacing = '10px';
  } catch (e) { /* older engines ignore tracking */ }
  let size = 138;
  c.font = '900 ' + size + 'px "Space Grotesk", "Roboto Flex", sans-serif';
  const m = c.measureText('NULLRIFT').width;
  if (m > 0) {
    size = Math.min(size, (size * (W * 0.9)) / m);
    c.font = '900 ' + size + 'px "Space Grotesk", "Roboto Flex", sans-serif';
  }
  c.fillText('NULLRIFT', W * 0.5, H * 0.54);

  scatterCoverage(out, n, rnd, sampleCoverage(cv), W, H, 3.12, (x, y, r) => {
    let z = (r() < 0.5 ? -1 : 1) * (0.05 + 0.022 * r());
    if (r() < 0.28) z *= r() * 0.5;
    return z + 0.055 * Math.sin(x * 1.9);
  });
}

function buildTornShell(out, n) {
  const rnd = mulberry32(0x51a2);
  const ga = Math.PI * (3 - Math.sqrt(5));
  const R = 1.29;
  const nl = 1 / Math.hypot(0.34, 0.88, 0.33);
  const Nx = 0.34 * nl;
  const Ny = 0.88 * nl;
  const Nz = 0.33 * nl;
  const pl = 1 / Math.hypot(-Ny, Nx, 0);
  const Px = -Ny * pl;
  const Py = Nx * pl;
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = ga * i;
    let dx = Math.cos(th) * rad;
    let dy = y;
    let dz = Math.sin(th) * rad;
    const h = dx * Nx + dy * Ny + dz * Nz;
    const w =
      0.055 * Math.sin(th * 3 + y * 4.4) +
      0.042 * Math.sin(th * 6.7 - y * 2.6) +
      0.019 * Math.sin(th * 13.1 + 1.7);
    const lo = 0.08 + w;
    const hi = 0.54 + w * 1.5;
    let r = R * (1 + 0.014 * (rnd() * 2 - 1));
    let ox = 0;
    let oy = 0;
    let oz = 0;
    if (h > lo && h < hi) {
      const dLo = h - lo;
      const dHi = hi - h;
      const lip = dLo < dHi ? lo : hi;
      const k = Math.min(dLo, dHi) / Math.max(1e-4, (hi - lo) * 0.5);
      const s = lip - h;
      dx += Nx * s;
      dy += Ny * s;
      dz += Nz * s;
      const l = 1 / Math.hypot(dx, dy, dz);
      dx *= l;
      dy *= l;
      dz *= l;
      r *= 1 - 0.34 * Math.pow(k, 0.65) * (0.55 + 0.45 * rnd());
      if (rnd() < 0.05) r *= 1 + 0.22 * rnd();
    } else if (h >= hi) {
      const t = Math.min(1, (h - hi) / 0.4);
      const lift = 0.17 + 0.1 * t;
      ox = Nx * lift + Px * 0.075 * t;
      oy = Ny * lift + Py * 0.075 * t;
      oz = Nz * lift;
    }
    out[i * 3] = dx * r + ox;
    out[i * 3 + 1] = dy * r + oy;
    out[i * 3 + 2] = dz * r + oz;
  }
}

function buildKnot(out, n) {
  const rnd = mulberry32(0x1c8d);
  const K = 0.415;
  const TAU = Math.PI * 2;
  const step = TAU / n;
  for (let i = 0; i < n; i++) {
    const u = i * step + (rnd() - 0.5) * step * 2;
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const c2 = Math.cos(2 * u);
    const s2 = Math.sin(2 * u);
    const cx = (su + 2 * s2) * K;
    const cy = (cu - 2 * c2) * K;
    const cz = -Math.sin(3 * u) * K * 1.15;
    let tx = cu + 4 * c2;
    let ty = -su + 4 * s2;
    let tz = -3 * Math.cos(3 * u) * 1.15;
    const tl = 1 / Math.hypot(tx, ty, tz);
    tx *= tl;
    ty *= tl;
    tz *= tl;
    // frame from an arbitrary up vector
    let ax = ty * 1 - tz * 0;
    let ay = tz * 0 - tx * 1;
    let az = tx * 0 - ty * 0;
    if (Math.hypot(ax, ay, az) < 1e-3) {
      ax = 1;
      ay = 0;
      az = 0;
    }
    const al = 1 / Math.hypot(ax, ay, az);
    ax *= al;
    ay *= al;
    az *= al;
    const bx = ty * az - tz * ay;
    const by = tz * ax - tx * az;
    const bz = tx * ay - ty * ax;
    const strand = ((rnd() * 5) | 0) / 5;
    const phi = strand * TAU + u * 2.6 + gauss(rnd) * 0.22;
    const rt = 0.062 + 0.105 * Math.sqrt(rnd());
    const cp = Math.cos(phi) * rt;
    const sp = Math.sin(phi) * rt;
    out[i * 3] = cx + ax * cp + bx * sp;
    out[i * 3 + 1] = cy + ay * cp + by * sp;
    out[i * 3 + 2] = cz + az * cp + bz * sp;
  }
}

function buildLattice(out, n) {
  const rnd = mulberry32(0x3ee7);
  const G = 7;
  const half = 1.2;
  const cs = (half * 2) / G;
  const cells = [];
  for (let ix = 0; ix < G; ix++) {
    for (let iy = 0; iy < G; iy++) {
      for (let iz = 0; iz < G; iz++) {
        const x = -half + (ix + 0.5) * cs;
        const y = -half + (iy + 0.5) * cs;
        const z = -half + (iz + 0.5) * cs;
        const rr = Math.hypot(x, y, z);
        if (rr > half * 1.34) continue;
        const s = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7) * 43758.5453;
        const hsh = s - Math.floor(s);
        if (hsh > 0.8 - 0.44 * (rr / half)) continue;
        cells.push(x, y, z);
      }
    }
  }
  const nc = cells.length / 3;
  const e = cs * 0.4;
  for (let i = 0; i < n; i++) {
    const c = ((rnd() * nc) | 0) * 3;
    const axis = (rnd() * 3) | 0;
    const s1 = rnd() < 0.5 ? -e : e;
    const s2 = rnd() < 0.5 ? -e : e;
    let t = (rnd() * 2 - 1) * e;
    if (rnd() < 0.16) t = rnd() < 0.5 ? -e : e;
    let ox;
    let oy;
    let oz;
    if (axis === 0) {
      ox = t;
      oy = s1;
      oz = s2;
    } else if (axis === 1) {
      ox = s1;
      oy = t;
      oz = s2;
    } else {
      ox = s1;
      oy = s2;
      oz = t;
    }
    out[i * 3] = cells[c] + ox + gauss(rnd) * 0.0045;
    out[i * 3 + 1] = cells[c + 1] + oy + gauss(rnd) * 0.0045;
    out[i * 3 + 2] = cells[c + 2] + oz + gauss(rnd) * 0.0045;
  }
}

function buildDisc(out, n) {
  const rnd = mulberry32(0x60b4);
  const tilt = -0.58;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  for (let i = 0; i < n; i++) {
    let x;
    let y;
    let z;
    const roll = rnd();
    if (roll < 0.16) {
      // bulge
      const u = rnd() * 2 - 1;
      const ph = rnd() * Math.PI * 2;
      const sr = Math.sqrt(Math.max(0, 1 - u * u));
      const br = 0.26 * Math.pow(rnd(), 0.55);
      x = Math.cos(ph) * sr * br;
      y = Math.sin(ph) * sr * br;
      z = u * br * 0.72;
    } else if (roll > 0.975) {
      // faint outer halo ring
      const a = rnd() * Math.PI * 2;
      const rr = 1.3 + gauss(rnd) * 0.045;
      x = Math.cos(a) * rr;
      y = Math.sin(a) * rr;
      z = gauss(rnd) * 0.03;
    } else {
      const rr = 0.24 + 1.08 * Math.sqrt(rnd());
      const arm = (rnd() < 0.5 ? 0 : 1) * Math.PI;
      // density wave: tighten points onto the arm, loosen at large radius
      const spread = (0.19 + 0.34 * rr) * Math.sign(rnd() - 0.5) * Math.pow(rnd(), 1.7);
      const a = arm + 2.55 * Math.log(1 + rr * 2.35) + spread;
      x = Math.cos(a) * rr;
      y = Math.sin(a) * rr;
      z = gauss(rnd) * 0.05 * Math.exp(-rr * 0.85);
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y * ct - z * st;
    out[i * 3 + 2] = y * st + z * ct;
  }
}

/* --------------------------------- shaders -------------------------------- */

const VERT = `
attribute vec3 aT1;
attribute vec3 aT2;
attribute vec3 aT3;
attribute vec3 aT4;
attribute vec3 aT5;
attribute vec4 aRand;

uniform vec4 uWA;
uniform vec2 uWB;
uniform float uTime;
uniform float uBell;
uniform float uSpread;
uniform float uSize;
uniform float uScale;
uniform float uMaxSize;
uniform float uHeat;
uniform vec2 uDepth;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uCHot;

varying vec3 vColor;
varying float vAlpha;

// ABC-style flow: each component is independent of its own axis, so the
// field is divergence free and reads as a real fluid rather than jitter.
vec3 flow(vec3 p, float t) {
  vec3 a = vec3(
    sin(p.y + t) + cos(p.z - t * 0.73),
    sin(p.z - t * 0.81) + cos(p.x + t * 0.62),
    sin(p.x + t * 0.94) + cos(p.y - t * 0.55)
  );
  vec3 q = p * 2.37 + vec3(11.3, 5.7, 19.1);
  vec3 b = vec3(
    sin(q.y - t * 1.4) + cos(q.z + t * 1.1),
    sin(q.z + t * 1.2) + cos(q.x - t * 1.6),
    sin(q.x - t * 1.3) + cos(q.y + t * 1.05)
  );
  return a * 0.5 + b * 0.21;
}

void main() {
  vec3 pos = position * uWA.x + aT1 * uWA.y + aT2 * uWA.z + aT3 * uWA.w
           + aT4 * uWB.x + aT5 * uWB.y;

  float seed = aRand.x;
  float sc = aRand.y;
  float phase = aRand.z;

  pos += flow(pos * 0.9 + phase * 2.0, uTime * 0.15) * 0.011;

  if (uBell > 0.002) {
    vec3 f = flow(pos * 1.28 + phase * 6.2831, uTime * 0.62);
    vec3 rad = normalize(pos + vec3(0.0001, 0.00013, 0.00007));
    float amp = uBell * uSpread * (0.34 + sc * 0.62);
    pos += f * amp * 0.46 + rad * amp * (0.14 + 0.30 * fract(seed * 7.31));
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float dist = max(-mv.z, 0.05);
  float depth = clamp((dist - uDepth.x) / max(0.0001, uDepth.y - uDepth.x), 0.0, 1.0);

  vec3 col = mix(uC1, uC2, smoothstep(0.0, 0.62, seed));
  col = mix(col, uC3, smoothstep(0.54, 1.0, seed));
  col = mix(col, uCHot, smoothstep(0.955, 0.996, aRand.w) * 0.9);
  col = mix(col, uC1 * 0.5, depth * 0.82);
  col += uC3 * (1.0 - depth) * 0.13;
  col = mix(col, mix(uC3, uCHot, 0.45), uHeat * 0.55);

  vColor = col;
  // Morph midpoints thin effective density (soft-step blend + uBell scatter) —
  // lift alpha/size with uBell/uHeat so lattice and mid-morphs stay readable.
  float morphVis = 1.0 + uBell * 0.55 + uHeat * 0.45;
  vAlpha = mix(1.42, 0.58, depth) * (0.78 + 0.34 * sc) * morphVis;

  gl_PointSize = clamp(
    sc * uSize * (uScale / dist) * (1.0 + uHeat * 0.55 + uBell * 0.7),
    1.2,
    uMaxSize
  );
}
`;

const FRAG = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d2 = dot(uv, uv);
  if (d2 > 0.25) discard;
  float r = sqrt(d2) * 2.0;
  float a = smoothstep(1.0, 0.04, r);
  a *= a;
  float core = smoothstep(0.5, 0.0, r);
  vec3 c = vColor * a + vColor * core * 0.85 + vec3(0.28) * core * core;
  gl_FragColor = vec4(c * vAlpha, 1.0);
}
`;

const BG_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BG_FRAG = `
uniform vec2 uRes;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 p = vUv - vec2(0.5, 0.52);
  p.x *= max(uRes.x / max(uRes.y, 1.0), 0.0001);
  float d = length(p * vec2(0.84, 1.0));
  float breathe = 0.965 + 0.035 * sin(uTime * 0.23);
  float wash = exp(-pow(d * 1.55 / breathe, 1.7));
  vec3 col = mix(uC, uB, smoothstep(0.95, 0.1, d));
  col = mix(col, uA, wash * 0.88);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.004;
  gl_FragColor = vec4(col, 1.0);
}
`;

/* --------------------------------- module --------------------------------- */

export default function create(ctx) {
  const root = ctx.root;
  const reduced = !!ctx.reduced;
  let preview = !!ctx.preview;
  const uid = 'nr05-' + Math.random().toString(36).slice(2, 8);

  let destroyed = false;
  let active = false;
  let width = Math.max(1, root.clientWidth || 1);
  let height = Math.max(1, root.clientHeight || 1);
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---- dom ---- */
  const style = document.createElement('style');
  style.textContent = `
.${uid}{position:absolute;inset:0;overflow:hidden;touch-action:pan-y;cursor:grab;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;background:#05030E;}
.${uid}.${uid}-drag{cursor:grabbing;}
.${uid} canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}
.${uid}-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 80% 76% at 50% 48%,rgba(5,3,14,0) 40%,rgba(5,3,14,.5) 76%,rgba(3,2,9,.92) 100%);}
.${uid}-hud{position:absolute;left:0;right:0;bottom:0;padding:0 20px 15px;pointer-events:none;font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;font-weight:500;line-height:1;letter-spacing:.16em;text-transform:uppercase;color:rgba(172,154,236,.6);}
.${uid}-row{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-bottom:10px;}
.${uid}-left{display:flex;align-items:baseline;gap:10px;min-width:0;}
.${uid}-idx{color:rgba(139,119,214,.5);flex:none;}
.${uid}-name{color:#CBB9FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.${uid}-pct{color:rgba(255,62,165,.86);flex:none;font-variant-numeric:tabular-nums;}
.${uid}-rail{position:relative;height:9px;}
.${uid}-base{position:absolute;left:0;right:0;top:4px;height:1px;background:rgba(150,130,225,.16);}
.${uid}-fill{position:absolute;left:0;right:0;top:4px;height:1px;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,rgba(58,28,158,.95),rgba(123,92,255,.95),rgba(255,62,165,.95));}
.${uid}-tick{position:absolute;top:0;width:1px;height:9px;margin-left:-1px;background:rgba(150,130,225,.26);transition:background .3s ease;}
.${uid}-tick.${uid}-on{background:rgba(255,62,165,.92);}
.${uid}-head{position:absolute;top:-2px;left:0;width:1px;height:13px;margin-left:-1px;background:#fff;box-shadow:0 0 7px rgba(255,62,165,.85);will-change:transform;}
.${uid}-hint{position:absolute;top:16px;right:20px;pointer-events:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:9px;font-weight:400;letter-spacing:.22em;text-transform:uppercase;color:rgba(150,130,225,.4);transition:opacity .7s ease;}
.${uid}-hint.${uid}-off{opacity:0;}
@media (max-width:560px){
.${uid}-hud{padding:0 12px 11px;font-size:9px;letter-spacing:.1em;}
.${uid}-hint{display:none;}
}`;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = uid;

  const vig = document.createElement('div');
  vig.className = uid + '-vig';

  const hud = document.createElement('div');
  hud.className = uid + '-hud';
  const row = document.createElement('div');
  row.className = uid + '-row';
  const left = document.createElement('div');
  left.className = uid + '-left';
  const idxEl = document.createElement('span');
  idxEl.className = uid + '-idx';
  const nameEl = document.createElement('span');
  nameEl.className = uid + '-name';
  const pctEl = document.createElement('span');
  pctEl.className = uid + '-pct';
  left.appendChild(idxEl);
  left.appendChild(nameEl);
  row.appendChild(left);
  row.appendChild(pctEl);
  const rail = document.createElement('div');
  rail.className = uid + '-rail';
  const base = document.createElement('div');
  base.className = uid + '-base';
  const fill = document.createElement('div');
  fill.className = uid + '-fill';
  const head = document.createElement('div');
  head.className = uid + '-head';
  rail.appendChild(base);
  rail.appendChild(fill);
  const ticks = [];
  for (let i = 0; i < NF; i++) {
    const t = document.createElement('div');
    t.className = uid + '-tick';
    t.style.left = ((i / MAXP) * 100).toFixed(4) + '%';
    rail.appendChild(t);
    ticks.push(t);
  }
  rail.appendChild(head);
  hud.appendChild(row);
  hud.appendChild(rail);

  const hint = document.createElement('div');
  hint.className = uid + '-hint';
  hint.textContent = 'DRAG SIDEWAYS TO SCRUB THE MORPH';

  function teardownDom() {
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    if (style.parentNode) style.parentNode.removeChild(style);
  }

  /* ---- three ---- */
  let ctxRenderer = null;
  try {
    ctxRenderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    ctxRenderer = null;
  }

  if (!ctxRenderer) {
    // No WebGL: keep the ground, the vignette and the chrome so the slot still composes.
    wrap.style.background =
      'radial-gradient(ellipse 62% 58% at 50% 46%,#180B3A 0%,#0B0620 42%,#05030E 82%)';
    wrap.appendChild(vig);
    wrap.appendChild(hud);
    root.appendChild(wrap);
    idxEl.textContent = '01 / ' + String(NF).padStart(2, '0');
    nameEl.textContent = NAMES[0];
    pctEl.textContent = '000.0%';
    ticks[0].classList.add(uid + '-on');
    return {
      resize() {},
      update() {},
      activate() {},
      deactivate() {},
      destroy() {
        if (destroyed) return;
        destroyed = true;
        teardownDom();
      }
    };
  }

  const renderer = ctxRenderer;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x05030e, 1);
  renderer.autoClear = false;
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);

  wrap.appendChild(renderer.domElement);
  wrap.appendChild(vig);
  wrap.appendChild(hud);
  if (!reduced) wrap.appendChild(hint);
  root.appendChild(wrap);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.5, 40);
  const group = new THREE.Group();
  scene.add(group);

  const bgScene = new THREE.Scene();
  const bgCam = new THREE.Camera();
  const bgGeo = new THREE.PlaneGeometry(2, 2);
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: BG_VERT,
    fragmentShader: BG_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRes: { value: new THREE.Vector2(width, height) },
      uTime: { value: 0 },
      uA: { value: new THREE.Color(0x180b3a) },
      uB: { value: new THREE.Color(0x0b0620) },
      uC: { value: new THREE.Color(0x05030e) }
    }
  });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.frustumCulled = false;
  bgScene.add(bgMesh);

  const uniforms = {
    uWA: { value: new THREE.Vector4(1, 0, 0, 0) },
    uWB: { value: new THREE.Vector2(0, 0) },
    uTime: { value: 0 },
    uBell: { value: 0 },
    uSpread: { value: 0.92 },
    uSize: { value: 0.0115 },
    uScale: { value: 900 },
    uMaxSize: { value: 7.5 * dpr },
    uHeat: { value: 0 },
    uDepth: { value: new THREE.Vector2(3, 8) },
    uC1: { value: new THREE.Color(0x3a1c9e) },
    uC2: { value: new THREE.Color(0x7b5cff) },
    uC3: { value: new THREE.Color(0xff3ea5) },
    uCHot: { value: new THREE.Color(0xfff0fb) }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    transparent: true
  });

  let geometry = null;
  let points = null;
  let count = 0;
  let bucket = -1;

  function targetCount(w, h) {
    /* Fewer points than a full page, but still dense enough that the formation
       reads as a cloud rather than as scattered specks at card size. */
    if (preview) return Math.round(clamp((w * h) / 11, 14000, 56000));
    return Math.round(clamp((w * h) / 8.6, 15000, 96000));
  }

  function buildGeometry(n) {
    const g = new THREE.BufferGeometry();
    const t0 = new Float32Array(n * 3);
    const t1 = new Float32Array(n * 3);
    const t2 = new Float32Array(n * 3);
    const t3 = new Float32Array(n * 3);
    const t4 = new Float32Array(n * 3);
    const t5 = new Float32Array(n * 3);
    const rand = new Float32Array(n * 4);

    buildGlyph(t0, n);
    buildTornShell(t1, n);
    buildKnot(t2, n);
    buildLattice(t3, n);
    buildDisc(t4, n);
    buildWordmark(t5, n);

    const rnd = mulberry32(0x0d15);
    for (let i = 0; i < n; i++) {
      const s = 0.42 + Math.pow(rnd(), 2.4) * 1.55;
      const o = i * 4;
      rand[o] = clamp(rnd() * 0.86 + ((s - 0.42) / 1.55) * 0.28, 0, 1);
      rand[o + 1] = s;
      rand[o + 2] = rnd();
      rand[o + 3] = rnd();
    }

    g.setAttribute('position', new THREE.BufferAttribute(t0, 3));
    g.setAttribute('aT1', new THREE.BufferAttribute(t1, 3));
    g.setAttribute('aT2', new THREE.BufferAttribute(t2, 3));
    g.setAttribute('aT3', new THREE.BufferAttribute(t3, 3));
    g.setAttribute('aT4', new THREE.BufferAttribute(t4, 3));
    g.setAttribute('aT5', new THREE.BufferAttribute(t5, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4);
    return g;
  }

  function ensureGeometry() {
    const n = targetCount(width, height);
    const b = Math.round(n / 8000);
    if (b === bucket && geometry) return;
    bucket = b;
    const next = buildGeometry(n);
    if (points) {
      group.remove(points);
      geometry.dispose();
    }
    geometry = next;
    count = n;
    points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    group.add(points);
    uniforms.uSize.value = 0.0115 * Math.sqrt(90000 / n);
    if (fontPending) refineWordmark();
  }

  /* Space Grotesk may still be loading when we first sample the wordmark. */
  let fontPending = true;
  function fontReady() {
    return !!(document.fonts && document.fonts.check('900 100px "Space Grotesk"'));
  }
  function refineWordmark() {
    if (destroyed || !geometry) return;
    if (!fontReady()) return;
    fontPending = false;
    const attr = geometry.getAttribute('aT5');
    buildWordmark(attr.array, count);
    attr.needsUpdate = true;
    if (!active) draw();
  }
  if (fontReady()) fontPending = false;
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () {
      if (destroyed || !fontPending) return;
      refineWordmark();
    }, function () { /* fallback sampling already baked */ });
  }

  /* ---- scrub state ---- */
  let progress = 0;
  let vel = 0;
  let dragging = false;
  let down = false;
  let armed = false;
  let pid = -1;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let lastMoveT = 0;
  let moveVel = 0;
  let pxToProg = 1.85 / 640;
  let parX = 0;
  let parY = 0;

  /* At full size this exhibit deliberately never autoplays — the copy sells it
     as hand-scrubbed. In a card that reads as a dead frame, so preview mode
     (and only preview mode) coasts the morph forward on its own whenever the
     pointer is away. Any real input cancels it for as long as the pointer stays. */
  let hovering = false;
  let idleHold = 0;
  let idleDir = 1;
  const IDLE_WAIT = 1.6;
  /* One clean impulse per formation. Coasting distance is roughly
     IDLE_KICK / DAMP, which must clear the 0.5 midpoint or the snap term
     drags it back to the formation it started from. */
  const IDLE_KICK = 2.4;

  function idleScrub(d) {
    if (!preview || hovering || dragging || down) {
      idleHold = 0;
      return;
    }
    /* Still coasting from the last kick — let it land, never stack impulses. */
    if (Math.abs(vel) > 0.02) {
      idleHold = 0;
      return;
    }
    idleHold += d;
    if (idleHold < IDLE_WAIT) return;
    idleHold = 0;
    /* Bounce at the ends rather than cutting back to the first formation. */
    if (progress >= MAXP - 0.01) idleDir = -1;
    else if (progress <= 0.01) idleDir = 1;
    vel = IDLE_KICK * idleDir;
  }
  let smX = 0;
  let smY = 0;
  let rotY = -0.24;
  let railW = 1;
  let visRatio = 1;
  let latched = false;
  let lastWheelT = -1e9;
  let rect = null;
  let hinted = false;

  let shownName = '';
  let shownIdx = '';
  let shownPct = '';
  let shownTick = -1;

  function hideHint() {
    if (hinted) return;
    hinted = true;
    hint.classList.add(uid + '-off');
  }

  function measure() {
    if (destroyed) return;
    rect = wrap.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;
    const top = Math.max(0, rect.top);
    const bot = Math.min(vh, rect.bottom);
    visRatio = rect.height > 0 ? Math.max(0, bot - top) / rect.height : 0;
  }

  const w = new Float32Array(NF);
  function applyWeights(p) {
    let seg = Math.floor(p);
    if (seg < 0) seg = 0;
    if (seg > MAXP - 1) seg = MAXP - 1;
    const f = clamp(p - seg, 0, 1);
    const e = f * f * f * (f * (6 * f - 15) + 10);
    w.fill(0);
    w[seg] = 1 - e;
    w[seg + 1] = e;
    uniforms.uWA.value.set(w[0], w[1], w[2], w[3]);
    uniforms.uWB.value.set(w[4], w[5]);
    const bell = Math.pow(Math.sin(Math.PI * f), 1.15);
    uniforms.uBell.value = bell;
    uniforms.uHeat.value = bell;
  }

  function syncHud(p) {
    const t = clamp(p / MAXP, 0, 1);
    fill.style.transform = 'scaleX(' + t.toFixed(5) + ')';
    head.style.transform = 'translate3d(' + (t * railW).toFixed(2) + 'px,0,0)';
    const act = clamp(Math.round(p), 0, MAXP);
    if (act !== shownTick) {
      if (shownTick >= 0) ticks[shownTick].classList.remove(uid + '-on');
      ticks[act].classList.add(uid + '-on');
      shownTick = act;
    }
    const nm = NAMES[act];
    if (nm !== shownName) {
      shownName = nm;
      nameEl.textContent = nm;
    }
    const ix = String(act + 1).padStart(2, '0') + ' / ' + String(NF).padStart(2, '0');
    if (ix !== shownIdx) {
      shownIdx = ix;
      idxEl.textContent = ix;
    }
    const pc = (t * 100).toFixed(1).padStart(5, '0') + '%';
    if (pc !== shownPct) {
      shownPct = pc;
      pctEl.textContent = pc;
    }
  }

  function draw() {
    renderer.clear();
    renderer.render(bgScene, bgCam);
    if (points) renderer.render(scene, camera);
  }

  function frameCamera() {
    const aspect = width / Math.max(1, height);
    camera.aspect = aspect;
    const half = Math.tan((FOV * Math.PI) / 360);
    const dv = FIT_RADIUS / half;
    const dh = FIT_RADIUS / (half * aspect);
    const dist = Math.max(dv, dh) * 1.06;
    // generous depth range: dispersal can fling sparks well outside the fit radius
    camera.near = Math.max(0.2, dist - 4.2);
    camera.far = dist + 4.6;
    camera.position.set(smX * 0.42, smY * 0.3, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    uniforms.uDepth.value.set(dist - FIT_RADIUS * 0.85, dist + FIT_RADIUS * 1.05);
    uniforms.uScale.value = (height * dpr * 0.5) / half;
  }

  /* ---- input ---- */
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (down) return;
    down = true;
    pid = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastT = e.timeStamp;
    lastMoveT = e.timeStamp;
    moveVel = 0;
    armed = e.pointerType !== 'touch';
    if (armed) {
      dragging = true;
      vel = 0;
      wrap.classList.add(uid + '-drag');
      try {
        wrap.setPointerCapture(pid);
      } catch (err) { /* capture unsupported */ }
      hideHint();
    }
  }

  function onMove(e) {
    hovering = true;
    if (rect) {
      const nx = rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * 2 - 1 : 0;
      const ny = rect.height > 0 ? ((e.clientY - rect.top) / rect.height) * 2 - 1 : 0;
      parX = clamp(nx, -1.4, 1.4);
      parY = clamp(ny, -1.4, 1.4);
    }
    if (!down || e.pointerId !== pid) return;
    if (!armed) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        down = false;
        return;
      }
      if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy) * 1.1) {
        armed = true;
        dragging = true;
        vel = 0;
        lastX = e.clientX;
        lastT = e.timeStamp;
        wrap.classList.add(uid + '-drag');
        try {
          wrap.setPointerCapture(pid);
        } catch (err) { /* capture unsupported */ }
        hideHint();
      }
      return;
    }
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    let delta = -dx * pxToProg;
    if ((progress < 0 && delta < 0) || (progress > MAXP && delta > 0)) delta *= 0.28;
    progress = clamp(progress + delta, -0.2, MAXP + 0.2);
    const dt = Math.max(1, e.timeStamp - lastT) / 1000;
    lastT = e.timeStamp;
    lastMoveT = e.timeStamp;
    const inst = delta / dt;
    moveVel += (inst - moveVel) * Math.min(1, dt / 0.055);
  }

  function endDrag(e, fling) {
    if (!down || (e && e.pointerId !== pid)) return;
    const wasDragging = dragging;
    down = false;
    dragging = false;
    armed = false;
    wrap.classList.remove(uid + '-drag');
    if (pid >= 0) {
      try {
        if (wrap.hasPointerCapture && wrap.hasPointerCapture(pid)) wrap.releasePointerCapture(pid);
      } catch (err) { /* already released */ }
    }
    pid = -1;
    if (!wasDragging) return;
    const idle = e ? e.timeStamp - lastMoveT : 999;
    vel = fling && idle < 130 ? clamp(moveVel, -7, 7) : 0;
    moveVel = 0;
  }

  function onUp(e) {
    endDrag(e, true);
  }

  function onCancel(e) {
    endDrag(e, false);
  }

  function onLeave(e) {
    hovering = false;
    if (!down || e.pointerId !== pid) {
      parX = 0;
      parY = 0;
    }
  }

  function onWheel(e) {
    /* In a card the wheel belongs to the page, never to the morph. */
    if (preview) return;
    if (visRatio < 0.55) return;
    let d = e.deltaY;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) d = e.deltaX;
    if (e.deltaMode === 1) d *= 16;
    else if (e.deltaMode === 2) d *= height;
    if (d === 0) return;
    if (e.timeStamp - lastWheelT > 260) latched = false;
    lastWheelT = e.timeStamp;
    if ((d < 0 && progress <= 0.001) || (d > 0 && progress >= MAXP - 0.001)) {
      latched = true;
      return;
    }
    if (latched) return;
    e.preventDefault();
    vel = clamp(vel + d * 0.0115, -9, 9);
    hideHint();
  }

  if (!reduced) {
    wrap.addEventListener('pointerdown', onDown, { passive: true });
    wrap.addEventListener('pointermove', onMove, { passive: true });
    wrap.addEventListener('pointerup', onUp, { passive: true });
    wrap.addEventListener('pointercancel', onCancel, { passive: true });
    wrap.addEventListener('pointerleave', onLeave, { passive: true });
    wrap.addEventListener('lostpointercapture', onCancel, { passive: true });
    wrap.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', measure, { passive: true });
  }

  /* ---- api ---- */
  const api = {
    /* ensureGeometry() inside the forced resize rebuilds the point buffers at
       the new count, so promotion to fullscreen restores full density. */
    setPreview(next) {
      preview = !!next;
      if (!preview) {
        hovering = false;
        idleHold = 0;
      }
    },

    resize(w, h) {
      if (destroyed) return;
      width = Math.max(1, Math.round(w || root.clientWidth || 1));
      height = Math.max(1, Math.round(h || root.clientHeight || 1));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      uniforms.uMaxSize.value = 7.5 * dpr;
      bgMat.uniforms.uRes.value.set(width, height);
      pxToProg = 1.85 / Math.max(240, width);
      ensureGeometry();
      frameCamera();
      measure();
      railW = Math.max(1, rail.clientWidth || width - 40);
      if (reduced) {
        progress = 0;
        applyWeights(0);
        uniforms.uTime.value = 4.1;
        bgMat.uniforms.uTime.value = 4.1;
        group.rotation.set(0.055, -0.22, 0);
      } else {
        applyWeights(progress);
      }
      syncHud(progress);
      draw();
    },

    update(dt, elapsed) {
      if (destroyed || reduced || !active) return;
      const d = Math.min(Math.max(dt, 0), 0.05);

      idleScrub(d);

      if (!dragging) {
        progress += vel * d;
        vel *= Math.exp(-DAMP * d);
        if (progress < 0) {
          vel += (0 - progress) * 42 * d;
          vel *= Math.exp(-9 * d);
          if (progress < -0.2) progress = -0.2;
        } else if (progress > MAXP) {
          vel += (MAXP - progress) * 42 * d;
          vel *= Math.exp(-9 * d);
          if (progress > MAXP + 0.2) progress = MAXP + 0.2;
        } else {
          const target = clamp(Math.round(progress), 0, MAXP);
          const diff = target - progress;
          const calm = 1 - Math.min(1, Math.abs(vel) / 1.9);
          vel += diff * SNAP_K * calm * d;
          if (Math.abs(vel) < 0.0016 && Math.abs(diff) < 0.0016) {
            vel = 0;
            progress = target;
          }
        }
      }

      const k = Math.min(1, d * 2.6);
      smX += (parX - smX) * k;
      smY += (parY - smY) * k;

      rotY += 0.055 * d;
      group.rotation.y = rotY + smX * 0.16;
      group.rotation.x = 0.055 * Math.sin(elapsed * 0.21) + 0.04 - smY * 0.1;

      camera.position.set(smX * 0.42, smY * 0.3, camera.position.z);
      camera.lookAt(0, 0, 0);

      uniforms.uTime.value = elapsed;
      bgMat.uniforms.uTime.value = elapsed;
      applyWeights(clamp(progress, 0, MAXP));
      syncHud(clamp(progress, 0, MAXP));
      draw();
    },

    activate() {
      if (destroyed) return;
      active = true;
      measure();
      railW = Math.max(1, rail.clientWidth || railW);
      draw();
    },

    deactivate() {
      active = false;
      if (down || dragging) endDrag(null, false);
      vel = 0;
      parX = 0;
      parY = 0;
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      active = false;
      if (!reduced) {
        wrap.removeEventListener('pointerdown', onDown);
        wrap.removeEventListener('pointermove', onMove);
        wrap.removeEventListener('pointerup', onUp);
        wrap.removeEventListener('pointercancel', onCancel);
        wrap.removeEventListener('pointerleave', onLeave);
        wrap.removeEventListener('lostpointercapture', onCancel);
        wrap.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', measure);
      }
      if (points) group.remove(points);
      if (geometry) geometry.dispose();
      material.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      scene.clear();
      bgScene.clear();
      try {
        renderer.dispose();
        renderer.forceContextLoss();
      } catch (err) { /* context already gone */ }
      teardownDom();
      geometry = null;
      points = null;
      rect = null;
    }
  };

  api.resize(width, height);
  return api;
}
