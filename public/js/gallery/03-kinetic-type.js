/* NULLRIFT — 03 / RESPIRANT TYPE
   Variable-font editorial composition. Per-glyph axis field driven by pointer
   proximity + scroll velocity. Pure DOM/CSS. No canvas, no SVG, no own RAF. */

let SEQ = 0;

const GROUND = '#08080A';

/* Per-line axis programme.
   k: 0 = Roboto Flex (variable), 1 = JetBrains Mono (static face, ink-density only) */
const LINES = [
  { k: 0, wB: 300, wA: 560, dB: 104, dA: 66, gB: -35, gA: 130, sA: 1.00, yA: 2.2, ab: 1.00 },
  { k: 0, wB: 220, wA: 700, dB: 96,  dA: 72, gB: -45, gA: 145, sA: 1.15, yA: 2.8, ab: 1.00 },
  { k: 0, wB: 250, wA: 420, dB: 92,  dA: 55, gB: -25, gA: 100, sA: 0.85, yA: 1.5, ab: 0.72 },
  { k: 0, wB: 250, wA: 420, dB: 92,  dA: 55, gB: -25, gA: 100, sA: 0.85, yA: 1.5, ab: 0.72 },
  { k: 1, wB: 400, wA: 0,   dB: 100, dA: 0,  gB: 0,   gA: 0,   sA: 0.55, yA: 1.0, ab: 0.00 }
];

/* Hand-set reduced-motion composition: a deliberate weight/width gradient that
   runs one way across the first display line and counter-runs on the second. */
const STILL = [
  { w0: 720, w1: 300, d0: 118, d1: 76,  g0: 55,  g1: -40, sl: 0,    o0: 1,    o1: 1,    ab: 0.4 },
  { w0: 200, w1: 940, d0: 58,  d1: 132, g0: -55, g1: 95,  sl: -1.5, o0: 1,    o1: 1,    ab: 0.9 },
  { w0: 400, w1: 170, d0: 108, d1: 84,  g0: 20,  g1: -30, sl: -4,   o0: 1,    o1: 1,    ab: 0 },
  { w0: 170, w1: 400, d0: 84,  d1: 108, g0: -30, g1: 20,  sl: -4,   o0: 1,    o1: 1,    ab: 0 },
  { w0: 400, w1: 400, d0: 100, d1: 100, g0: 0,   g1: 0,   sl: 0,    o0: 1,    o1: 0.42, ab: 0 }
];

const CSS = [
  '@S{position:relative}',
  '@S .st{position:absolute;inset:0;background:' + GROUND + ';isolation:isolate;overflow:hidden;',
  'font-family:"Roboto Flex",sans-serif;color:#F2F0EA;-webkit-font-smoothing:antialiased;',
  'font-kerning:none;font-synthesis:none;font-variant-ligatures:none}',
  '@S .vr{position:absolute;top:0;bottom:0;width:1px;background:#F2F0EA;opacity:.07}',
  '@S .lr{position:absolute;left:0;right:0;top:0;height:1px;background:#F2F0EA;opacity:.06;transform:translateY(0px)}',
  '@S .cp{position:absolute;inset:0;display:flex;flex-direction:column;align-items:flex-start;',
  'justify-content:space-between;pointer-events:none}',
  '@S .top,@S .ft{width:100%}',
  '@S .hd{display:flex;width:100%;align-items:baseline;justify-content:space-between;gap:16px}',
  '@S .kk,@S .ro{font-family:"JetBrains Mono",monospace;font-weight:500;line-height:1;white-space:nowrap;color:#666}',
  '@S .ro{letter-spacing:.06em}',
  '@S .kk{letter-spacing:.14em}',
  '@S .hr{width:100%;height:1px;background:#F2F0EA;opacity:.15}',
  '@S .ln{display:block;white-space:nowrap;width:max-content;margin:0;padding:0;line-height:.84}',
  '@S .sec{line-height:1.3;text-transform:none}',
  '@S .mn{font-family:"JetBrains Mono",monospace;font-weight:400;line-height:1;color:#F2F0EA;',
  'font-variation-settings:normal}',
  '@S .g{position:relative;display:inline-block;transform:translate(0px,0px);--ax:0px;--ay:0px}',
  '@S .sp{display:inline-block}',
  '@S .ab::before,@S .ab::after{content:attr(data-c);position:absolute;left:0;top:0;mix-blend-mode:screen}',
  '@S .ab::before{color:#FF0033;transform:translate(var(--ax),var(--ay))}',
  '@S .ab::after{color:#0038FF;transform:translate(calc(var(--ax) * -1),calc(var(--ay) * -1))}',
  '@S .hit{position:absolute;inset:0;background:transparent}',
  '@S .sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}'
].join('');

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function r1(v) { return Math.round(v * 10) / 10; }
function r2(v) { return Math.round(v * 100) / 100; }

function rng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function copyFor(tier) {
  if (tier === 0) {
    return {
      kick: '03 / RESPIRANT',
      d1: 'TYPE THAT', d2: 'BREATHES',
      s1: 'AXES DRIVEN BY', s2: 'PROXIMITY & VELOCITY',
      mt: 'wght 100–1000 · wdth 25–151 · slnt −10–0'
    };
  }
  if (tier === 1) {
    return {
      kick: '03 / RESPIRANT TYPE',
      d1: 'TYPE THAT', d2: 'BREATHES',
      s1: 'VARIABLE AXES DRIVEN BY', s2: 'PROXIMITY & VELOCITY',
      mt: 'ROBOTO FLEX · wght 100–1000 · wdth 25–151 · slnt −10–0'
    };
  }
  return {
    kick: '03 / RESPIRANT TYPE',
    d1: 'TYPE THAT', d2: 'BREATHES',
    s1: 'VARIABLE AXES DRIVEN BY', s2: 'PROXIMITY & VELOCITY',
    mt: 'ROBOTO FLEX · wght 100–1000 · wdth 25–151 · slnt −10–0 · GRAD −200–150'
  };
}

export default function create(ctx) {
  const root = ctx && ctx.root;
  const reduced = !!(ctx && ctx.reduced);
  if (!root) {
    return {
      resize: function () {}, update: function () {}, activate: function () {},
      deactivate: function () {}, destroy: function () {}
    };
  }

  const uid = 'nrx03-' + (++SEQ);
  const doc = root.ownerDocument || document;

  const styleEl = doc.createElement('style');
  styleEl.textContent = CSS.replace(/@S/g, '.' + uid);
  root.appendChild(styleEl);
  root.classList.add(uid);

  /* ---------------------------------------------------------------- DOM */
  const st = doc.createElement('div'); st.className = 'st';
  const vr = doc.createElement('div'); vr.className = 'vr';
  const lr = doc.createElement('div'); lr.className = 'lr';
  const cp = doc.createElement('div'); cp.className = 'cp';
  const top = doc.createElement('div'); top.className = 'top';
  const hd = doc.createElement('div'); hd.className = 'hd';
  const kk = doc.createElement('span'); kk.className = 'kk';
  const ro = doc.createElement('span'); ro.className = 'ro';
  const hr = doc.createElement('div'); hr.className = 'hr';
  const mid = doc.createElement('div');
  const ft = doc.createElement('div'); ft.className = 'ft';
  const sr = doc.createElement('p'); sr.className = 'sr';
  const hit = doc.createElement('div'); hit.className = 'hit';

  hd.appendChild(kk); hd.appendChild(ro);
  top.appendChild(hd); top.appendChild(hr);
  cp.appendChild(top); cp.appendChild(mid); cp.appendChild(ft);
  st.appendChild(vr); st.appendChild(lr); st.appendChild(sr);
  st.appendChild(cp); st.appendChild(hit);
  root.appendChild(st);
  cp.setAttribute('aria-hidden', 'true');

  const lnEl = [];
  for (let i = 0; i < 5; i++) {
    const e = doc.createElement('div');
    e.className = 'ln' + (i >= 2 && i <= 3 ? ' sec' : '') + (i === 4 ? ' mn' : '');
    if (i < 4) mid.appendChild(e); else ft.appendChild(e);
    lnEl.push(e);
  }

  /* ------------------------------------------------------------- state */
  let dead = false;
  let built = false;
  let active = false;
  let tier = -1;
  let W = 0, H = 0;
  let pad = 24, fs = [0, 0, 0, 0, 0], kickPx = 10;
  const chars = [1, 1, 1, 1, 1];

  let n = 0;
  let els = [];
  let pre = [];                                  // "'opsz' N,'slnt' " prefix per glyph
  let cx, cy, uu, li, kind, phase, lag, abMax, scv;
  let wB, wA, dB, dA, gB, gA, sAm, yAm;
  let omP, omD, omG, omS;
  let pX, pV, dX, dV, gX, gV, sX, sV;
  let lastW, lastD, lastG, lastS, lastTx, lastTy, lastSy, lastSk, lastAx, lastAy, lastOp;

  const HIST = 32;
  const hist = new Float32Array(HIST);
  let head = 0;

  let scrollY = 0, lastScrollY = 0, scrollV = 0, shear = 0;
  let ptrX = 0, ptrY = 0, presT = 0, pres = 0;
  let drvX = 0, drvY = 0, drvVX = 0, drvVY = 0;
  let clock = 0, roClock = 0, roStr = '', lrY = -9999, lrO = -1;
  let nearest = -1;

  /* ------------------------------------------------------------- build */
  function splitLine(el, text, abOn) {
    while (el.firstChild) el.removeChild(el.firstChild);
    const out = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text.charAt(i);
      if (ch === ' ') {
        const s = doc.createElement('span');
        s.className = 'sp';
        s.textContent = '\u00A0';
        el.appendChild(s);
        continue;
      }
      const g = doc.createElement('span');
      g.className = abOn ? 'g ab' : 'g';
      g.setAttribute('data-c', ch);
      g.textContent = ch;
      el.appendChild(g);
      out.push(g);
    }
    return out;
  }

  function build(t) {
    const c = copyFor(t);
    kk.textContent = c.kick;
    sr.textContent = c.d1 + ' ' + c.d2 + '. ' + c.s1 + ' ' + c.s2 + '. ' + c.mt + '.';

    const texts = [c.d1, c.d2, c.s1, c.s2, c.mt];
    els = [];
    const lineIdx = [];
    const uIdx = [];
    for (let i = 0; i < 5; i++) {
      const arr = splitLine(lnEl[i], texts[i], LINES[i].ab > 0);
      chars[i] = texts[i].length;
      for (let j = 0; j < arr.length; j++) {
        els.push(arr[j]);
        lineIdx.push(i);
        uIdx.push(arr.length > 1 ? j / (arr.length - 1) : 0.5);
      }
    }

    n = els.length;
    cx = new Float32Array(n); cy = new Float32Array(n);
    uu = new Float32Array(n); li = new Uint8Array(n); kind = new Uint8Array(n);
    phase = new Float32Array(n); lag = new Uint8Array(n);
    abMax = new Float32Array(n); scv = new Float32Array(n);
    wB = new Float32Array(n); wA = new Float32Array(n);
    dB = new Float32Array(n); dA = new Float32Array(n);
    gB = new Float32Array(n); gA = new Float32Array(n);
    sAm = new Float32Array(n); yAm = new Float32Array(n);
    omP = new Float32Array(n); omD = new Float32Array(n);
    omG = new Float32Array(n); omS = new Float32Array(n);
    pX = new Float32Array(n); pV = new Float32Array(n);
    dX = new Float32Array(n); dV = new Float32Array(n);
    gX = new Float32Array(n); gV = new Float32Array(n);
    sX = new Float32Array(n); sV = new Float32Array(n);
    lastW = new Float32Array(n); lastD = new Float32Array(n);
    lastG = new Float32Array(n); lastS = new Float32Array(n);
    lastTx = new Float32Array(n); lastTy = new Float32Array(n);
    lastSy = new Float32Array(n); lastSk = new Float32Array(n);
    lastAx = new Float32Array(n); lastAy = new Float32Array(n);
    lastOp = new Float32Array(n);
    pre = new Array(n);

    const rnd = rng(7919);
    for (let i = 0; i < n; i++) {
      const L = LINES[lineIdx[i]];
      li[i] = lineIdx[i];
      uu[i] = uIdx[i];
      kind[i] = L.k;
      wB[i] = L.wB; wA[i] = L.wA;
      dB[i] = L.dB; dA[i] = L.dA;
      gB[i] = L.gB; gA[i] = L.gA;
      sAm[i] = L.sA; yAm[i] = L.yA;
      phase[i] = rnd() * 6.2831853 + uIdx[i] * 2.4;
      scv[i] = 0.55 + rnd() * 0.9;
      const j = 0.82 + rnd() * 0.38;
      omP[i] = 13 * j; omD[i] = 8.5 * j; omG[i] = 16 * j; omS[i] = 19 * j;
      pre[i] = '';
    }
    resetCaches();
    built = true;
  }

  function resetCaches() {
    for (let i = 0; i < n; i++) {
      lastW[i] = -9999; lastD[i] = -9999; lastG[i] = -9999; lastS[i] = -9999;
      lastTx[i] = -9999; lastTy[i] = -9999; lastSy[i] = -9999; lastSk[i] = -9999;
      lastAx[i] = -9999; lastAy[i] = -9999; lastOp[i] = -9999;
    }
    lrY = -9999; lrO = -1; roStr = '';
  }

  /* ----------------------------------------------------------- measure */
  /* Tracking needed to set `natural` to `target`. Divided by count-1 so the
     last glyph lands on the measure rather than its trailing sidebearing. */
  function trackFor(natural, count, target, minPx, maxPx) {
    const c = count > 1 ? count - 1 : 1;
    return clamp((target - natural) / c, minPx, maxPx);
  }

  function measure() {
    if (dead || !built || !W || !H) return;

    pad = Math.round(clamp(W * 0.052, 18, 66));
    const inner = W - pad * 2;
    const d2 = clamp(Math.min(W * 0.205, H * 0.335), 58, 252);
    const d1 = d2 * 0.505;
    const sec = clamp(Math.min(W * 0.0258, H * 0.042), 12, 31);
    const met = clamp(W * 0.0125, 8.5, 16);
    kickPx = clamp(W * 0.0092, 8.5, 11.5);
    fs = [d1, d2, sec, sec, met];

    /* ---- write phase: geometry + rest axis state, all inline glyph state cleared */
    cp.style.padding = pad + 'px';
    vr.style.left = pad + 'px';
    kk.style.fontSize = r2(kickPx) + 'px';
    ro.style.fontSize = r2(kickPx) + 'px';
    hr.style.marginTop = r2(kickPx * 1.15) + 'px';
    lnEl[2].style.marginTop = r2(d2 * 0.20) + 'px';

    for (let i = 0; i < 5; i++) {
      const L = LINES[i];
      const e = lnEl[i];
      e.style.fontSize = r2(fs[i]) + 'px';
      e.style.letterSpacing = '0px';
      if (L.k === 0) {
        e.style.fontVariationSettings = "'opsz' " + Math.round(clamp(fs[i], 8, 144)) +
          ",'slnt' 0,'wdth' " + L.dB + ",'wght' " + L.wB + ",'GRAD' " + L.gB;
      }
    }
    for (let i = 0; i < n; i++) els[i].style.cssText = '';

    /* ---- read phase 1: natural set widths */
    const nat = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) nat[i] = lnEl[i].getBoundingClientRect().width;

    /* ---- write phase 2: fit tracking (one measure for the pair of sub-lines,
            display 2 runs past the right edge, mono metadata is flush to column) */
    lnEl[0].style.letterSpacing = r2(-0.046 * d1) + 'px';
    lnEl[1].style.letterSpacing = r2(trackFor(nat[1], chars[1], (W - pad) * 1.03, -0.058 * d2, 0.26 * d2)) + 'px';
    const secTarget = Math.max(nat[2], nat[3], inner * 0.48);
    lnEl[2].style.letterSpacing = r2(trackFor(nat[2], chars[2], secTarget, -0.02 * sec, 0.34 * sec)) + 'px';
    lnEl[3].style.letterSpacing = r2(trackFor(nat[3], chars[3], secTarget, -0.02 * sec, 0.34 * sec)) + 'px';
    lnEl[4].style.letterSpacing = r2(trackFor(nat[4], chars[4], inner, -0.03 * met, 0.5 * met)) + 'px';

    /* ---- read phase 2: cache every glyph centre once */
    const rr = root.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const b = els[i].getBoundingClientRect();
      cx[i] = b.left - rr.left + b.width * 0.5;
      cy[i] = b.top - rr.top + b.height * 0.5;
    }

    /* ---- derived per-glyph constants */
    const span = Math.max(W, 1);
    for (let i = 0; i < n; i++) {
      const size = fs[li[i]];
      pre[i] = "'opsz' " + Math.round(clamp(size, 8, 144)) + ",'slnt' ";
      abMax[i] = clamp(size * 0.030, 0.5, 3) * LINES[li[i]].ab;
      lag[i] = Math.round(clamp(cx[i] / span, 0, 1) * 15) + (i & 1);
    }

    if (drvX === 0 && drvY === 0) { drvX = W * 0.5; drvY = H * 0.46; }
    resetCaches();

    if (reduced) applyStill();
  }

  /* -------------------------------------------------------- still state */
  function applyStill() {
    lr.style.display = 'none';
    for (let i = 0; i < n; i++) {
      const S = STILL[li[i]];
      const u = uu[i];
      const el = els[i];
      if (kind[i] === 0) {
        const wv = Math.round(S.w0 + (S.w1 - S.w0) * u);
        const dv = r1(S.d0 + (S.d1 - S.d0) * u);
        const gv = Math.round(S.g0 + (S.g1 - S.g0) * u);
        el.style.fontVariationSettings = pre[i] + S.sl + ",'wdth' " + dv + ",'wght' " + wv + ",'GRAD' " + gv;
      } else {
        el.style.opacity = String(r2(S.o0 + (S.o1 - S.o0) * u));
      }
      if (S.ab > 0) {
        el.style.setProperty('--ax', r2(S.ab) + 'px');
        el.style.setProperty('--ay', r2(S.ab * 0.34) + 'px');
      }
    }
    ro.textContent = 'wght 0940  wdth 132  slnt −01.5';
  }

  /* ------------------------------------------------------------ events */
  function onPointer(e) {
    if (dead || reduced) return;
    ptrX = e.offsetX;
    ptrY = e.offsetY;
    presT = 1;
  }
  function onLeave() {
    if (dead || reduced) return;
    presT = 0;
  }
  function onDown(e) {
    if (dead || reduced) return;
    ptrX = e.offsetX;
    ptrY = e.offsetY;
    presT = 1;
  }
  function onUp(e) {
    if (dead || reduced) return;
    if (e.pointerType !== 'mouse') presT = 0;
  }
  function onScroll() {
    if (dead || reduced) return;
    scrollY = window.pageYOffset || 0;
  }

  if (!reduced) {
    hit.addEventListener('pointermove', onPointer, { passive: true });
    hit.addEventListener('pointerenter', onPointer, { passive: true });
    hit.addEventListener('pointerdown', onDown, { passive: true });
    hit.addEventListener('pointerup', onUp, { passive: true });
    hit.addEventListener('pointercancel', onUp, { passive: true });
    hit.addEventListener('pointerleave', onLeave, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    scrollY = lastScrollY = window.pageYOffset || 0;
  }

  /* Variable font may land after first paint; re-fit tracking and re-cache. */
  if (doc.fonts && doc.fonts.ready && typeof doc.fonts.ready.then === 'function') {
    doc.fonts.ready.then(function () { if (!dead) measure(); }, function () {});
  }

  /* ------------------------------------------------------------ update */
  function frame(dt) {
    if (dt > 0.05) dt = 0.05;
    if (dt <= 0) return;
    clock += dt;

    /* scroll velocity: delta since last frame, normalised, low-passed */
    let raw = scrollY - lastScrollY;
    lastScrollY = scrollY;
    if (raw > 500) raw = 500; else if (raw < -500) raw = -500;
    const inst = clamp((raw / dt) / 1700, -1.4, 1.4);
    scrollV += (inst - scrollV) * (1 - Math.exp(-dt * 11));
    shear = clamp(scrollV, -1, 1);
    head = (head + 1) % HIST;
    hist[head] = shear;

    /* driver point: pointer when present, slow ambient path when not */
    pres += (presT - pres) * (1 - Math.exp(-dt * (presT > pres ? 8 : 2.2)));
    const ix = W * (0.5 + 0.40 * Math.sin(clock * 0.213) * Math.cos(clock * 0.091));
    const iy = H * (0.46 + 0.33 * Math.sin(clock * 0.171 + 1.3));
    const tx = ix + (ptrX - ix) * pres;
    const ty = iy + (ptrY - iy) * pres;
    const kd = 1 - Math.exp(-dt * 8);
    const nx = drvX + (tx - drvX) * kd;
    const ny = drvY + (ty - drvY) * kd;
    drvVX = (nx - drvX) / dt; drvVY = (ny - drvY) / dt;
    drvX = nx; drvY = ny;

    /* aberration direction: horizontal from cursor travel, vertical from scroll */
    let mx = clamp(drvVX / 650, -1, 1);
    let my = clamp(drvVY / 650, -1, 1) * 0.5 + shear * 1.1;
    let ml = Math.sqrt(mx * mx + my * my);
    if (ml < 0.0015) { mx = 1; my = 0.28; ml = 1.038; }
    const dirX = mx / ml, dirY = my / ml;

    /* field radii */
    const rW = Math.max(W, H) * 0.34;
    const rD1 = rW * 0.62;
    const rD2 = rD1 * 2.15;
    const rG = rW * 0.48;
    const iW = 1 / (rW * rW), iD1 = 1 / (rD1 * rD1), iD2 = 1 / (rD2 * rD2), iG = 1 / (rG * rG);
    const dogK = rD1 / rD2;

    const zS = 0.55;
    let bestD = Infinity, bestI = -1;

    for (let i = 0; i < n; i++) {
      const ddx = cx[i] - drvX;
      const ddy = (cy[i] - drvY) * 1.28;
      const d2s = ddx * ddx + ddy * ddy;
      if (d2s < bestD && kind[i] === 0) { bestD = d2s; bestI = i; }

      const tP = Math.exp(-d2s * iW);
      const tD = Math.exp(-d2s * iD1) - dogK * Math.exp(-d2s * iD2);
      const tG = Math.exp(-d2s * iG);
      const tS = hist[(head - lag[i] + HIST) % HIST] * sAm[i];

      /* four critically/near-critically damped springs, implicit Euler */
      let om = omP[i], oo = om * om;
      let den = 1 + dt * 2 * om + dt * dt * oo;
      let v = (pV[i] - dt * oo * (pX[i] - tP)) / den;
      pV[i] = v; pX[i] += dt * v;

      om = omD[i]; oo = om * om;
      den = 1 + dt * 2 * om + dt * dt * oo;
      v = (dV[i] - dt * oo * (dX[i] - tD)) / den;
      dV[i] = v; dX[i] += dt * v;

      om = omG[i]; oo = om * om;
      den = 1 + dt * 2 * om + dt * dt * oo;
      v = (gV[i] - dt * oo * (gX[i] - tG)) / den;
      gV[i] = v; gX[i] += dt * v;

      om = omS[i]; oo = om * om;
      den = 1 + dt * 2 * zS * om + dt * dt * oo;
      v = (sV[i] - dt * oo * (sX[i] - tS)) / den;
      sV[i] = v; sX[i] += dt * v;

      const P = pX[i], D = dX[i], G = gX[i], S = sX[i];
      const el = els[i];

      /* Values are quantised, not just compared: below these steps the change
         is invisible, and skipping the write is the whole 60fps budget. */
      if (kind[i] === 0) {
        const wv = Math.round((wB[i] + wA[i] * P) * 0.5) * 2;
        const dv = Math.round((dB[i] + dA[i] * D) * 2) / 2;
        const gv = Math.round((gB[i] + gA[i] * G * G) / 3) * 3;
        const sv = S > 0 ? Math.round(-200 * (S > 1 ? 1 : S)) / 20 : 0;
        if (wv !== lastW[i] || dv !== lastD[i] || gv !== lastG[i] || sv !== lastS[i]) {
          lastW[i] = wv; lastD[i] = dv; lastG[i] = gv; lastS[i] = sv;
          el.style.fontVariationSettings = pre[i] + sv + ",'wdth' " + dv + ",'wght' " + wv + ",'GRAD' " + gv;
        }
      } else {
        const op = Math.round((0.42 + 0.54 * P) * 50) / 50;
        if (op !== lastOp[i]) { lastOp[i] = op; el.style.opacity = String(op); }
      }

      const wave = Math.sin(clock * 0.72 + phase[i]) * yAm[i] * (0.28 + 0.72 * P);
      const txp = Math.round(-S * 26) / 20;
      const typ = Math.round((wave + S * yAm[i] * 1.35) * 20) / 20;
      const syp = Math.round((1 + Math.abs(S) * 0.05 * scv[i]) * 500) / 500;
      const skp = S < 0 ? Math.round(-S * 1.9 * sAm[i] * 50) / 50 : 0;
      if (txp !== lastTx[i] || typ !== lastTy[i] || syp !== lastSy[i] || skp !== lastSk[i]) {
        lastTx[i] = txp; lastTy[i] = typ; lastSy[i] = syp; lastSk[i] = skp;
        el.style.transform = 'translate(' + txp + 'px,' + typ + 'px) skewX(' + skp + 'deg) scaleY(' + syp + ')';
      }

      if (abMax[i] > 0) {
        let e = Math.abs(pV[i]) * 0.55 + Math.abs(dV[i]) * 0.30 + Math.abs(sV[i]) * 0.40;
        e = e * 0.30 + Math.abs(S) * 0.55;
        if (e > 1) e = 1;
        const amp = e * abMax[i];
        const axp = Math.round(amp * dirX * 20) / 20;
        const ayp = Math.round(amp * dirY * 11) / 20;
        if (axp !== lastAx[i] || ayp !== lastAy[i]) {
          lastAx[i] = axp; lastAy[i] = ayp;
          el.style.setProperty('--ax', axp + 'px');
          el.style.setProperty('--ay', ayp + 'px');
        }
      }
    }

    nearest = bestI;

    /* hairline tracking the driver */
    const ry = Math.round(drvY);
    if (ry !== lrY) { lrY = ry; lr.style.transform = 'translateY(' + ry + 'px)'; }
    const ro2 = r2(0.05 + 0.11 * pres);
    if (ro2 !== lrO) { lrO = ro2; lr.style.opacity = String(ro2); }

    /* axis readout, throttled and width-stable */
    roClock += dt;
    if (roClock > 0.09 && nearest >= 0) {
      roClock = 0;
      const i = nearest;
      const wv = Math.round(wB[i] + wA[i] * pX[i]);
      const dv = Math.round(dB[i] + dA[i] * dX[i]);
      const sv = sX[i] > 0 ? -10 * Math.min(sX[i], 1) : 0;
      let s;
      if (tier === 0) {
        s = 'w' + String(wv).padStart(4, '0') + ' d' + String(dv).padStart(3, '0');
      } else {
        s = 'wght ' + String(wv).padStart(4, '0') +
            '  wdth ' + String(dv).padStart(3, '0') +
            '  slnt ' + (sv < -0.05 ? '−' : ' ') + Math.abs(r1(sv)).toFixed(1).padStart(4, '0');
      }
      if (s !== roStr) { roStr = s; ro.textContent = s; }
    }
  }

  /* --------------------------------------------------------------- api */
  return {
    resize: function (width, height) {
      if (dead) return;
      const w = Math.max(1, Math.round(width || root.clientWidth || 1));
      const h = Math.max(1, Math.round(height || root.clientHeight || 1));
      const t = w < 560 ? 0 : (w < 900 ? 1 : 2);
      if (built && w === W && h === H && t === tier) return;
      W = w; H = h;
      if (t !== tier) { tier = t; build(t); }
      measure();
    },

    update: function (dt) {
      if (dead || reduced || !active || !built || !n) return;
      frame(typeof dt === 'number' && dt > 0 ? dt : 0.016);
    },

    activate: function () {
      if (dead) return;
      active = true;
      lastScrollY = scrollY = (reduced ? 0 : (window.pageYOffset || 0));
      scrollV = 0;
      for (let i = 0; i < HIST; i++) hist[i] = 0;
    },

    deactivate: function () {
      active = false;
      presT = 0;
    },

    destroy: function () {
      if (dead) return;
      dead = true;
      active = false;
      if (!reduced) {
        hit.removeEventListener('pointermove', onPointer, { passive: true });
        hit.removeEventListener('pointerenter', onPointer, { passive: true });
        hit.removeEventListener('pointerdown', onDown, { passive: true });
        hit.removeEventListener('pointerup', onUp, { passive: true });
        hit.removeEventListener('pointercancel', onUp, { passive: true });
        hit.removeEventListener('pointerleave', onLeave, { passive: true });
        window.removeEventListener('scroll', onScroll, { passive: true });
      }
      if (st.parentNode) st.parentNode.removeChild(st);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      root.classList.remove(uid);
      els = []; pre = []; n = 0; built = false;
    }
  };
}
