/* NULLRIFT — 06 IMPACT GRID
   DOM 3D transform wave grid. Struck-membrane physics on a cold steel plate. */

let UID = 0;

const HEAT_STEPS = 32;

/* blackbody-ish ramp: dim warm grey -> ember -> molten -> gold -> near white */
const RAMP = [
  [0.00, 42, 39, 36],
  [0.22, 122, 43, 0],
  [0.50, 255, 122, 24],
  [0.76, 255, 194, 74],
  [1.00, 255, 246, 230]
];

function rampAt(t) {
  if (!(t > 0)) return [RAMP[0][1], RAMP[0][2], RAMP[0][3]];
  if (t >= 1) {
    const L = RAMP[RAMP.length - 1];
    return [L[1], L[2], L[3]];
  }
  for (let i = 1; i < RAMP.length; i++) {
    const b = RAMP[i];
    if (t <= b[0]) {
      const a = RAMP[i - 1];
      const u = (t - a[0]) / (b[0] - a[0]);
      return [
        Math.round(a[1] + (b[1] - a[1]) * u),
        Math.round(a[2] + (b[2] - a[2]) * u),
        Math.round(a[3] + (b[3] - a[3]) * u)
      ];
    }
  }
  return [255, 246, 230];
}

export default function create(ctx) {
  const root = ctx && ctx.root;
  if (!root) {
    return {
      resize() {}, update() {}, activate() {}, deactivate() {}, destroy() {}
    };
  }
  const reduced = !!(ctx && ctx.reduced);
  const S = 'nrx6i' + (++UID);

  /* ---------------------------------------------------------------- config */
  const RX_DEG = 4;                 // static plate rake
  const COS_RX = Math.cos(RX_DEG * Math.PI / 180);
  const SIN_RX = Math.sin(RX_DEG * Math.PI / 180);
  const PLATE_SCALE = 1.05;         // covers the trapezoid gap from the rake
  const MAX_WAVES = 16;             // 1 direct + 4 mirror fronts per strike
  const REFLECT = 0.42;             // amplitude of the once-reflected fronts
  const ROT_GAIN = 0.38;            // deg/s of angular kick per px/s of z kick
  const TILT_MAX = 15;              // deg, proximity field
  const FLASH_DUR = 0.42;
  const IDLE_STRIDE = 4;            // ambient pass visits 1/N tiles per frame
  const QZ = 20;                    // transform quantum: 0.05px
  const QA = 50;                    // transform quantum: 0.02deg
  const REST_Z = 0.02, REST_VZ = 0.35, REST_A = 0.008, REST_VA = 0.2;

  /* ------------------------------------------------------------------ dom */
  const styleEl = document.createElement('style');
  const stage = document.createElement('div');
  const plate = document.createElement('div');
  const flash = document.createElement('div');
  const vign = document.createElement('div');
  const chrome = document.createElement('div');
  const readout = document.createElement('div');
  const hint = document.createElement('div');

  stage.className = 'nrx6s';
  plate.className = 'nrx6p';
  flash.className = 'nrx6f';
  vign.className = 'nrx6v';
  chrome.className = 'nrx6c';
  readout.className = 'nrx6r';
  hint.className = 'nrx6hn';
  hint.textContent = reduced ? 'STATIC FRAME — REDUCED MOTION' : 'CLICK THE PLATE';
  readout.textContent = 'TILES 0 / IMPULSE 0.00 / SETTLE 100%';

  const ticks = [];
  for (let i = 1; i <= 4; i++) {
    const k = document.createElement('div');
    k.className = 'nrx6k nrx6k' + i;
    ticks.push(k);
    chrome.appendChild(k);
  }
  chrome.appendChild(readout);
  chrome.appendChild(hint);
  plate.appendChild(flash);
  stage.appendChild(plate);

  /* precomputed class strings: [heat step] and [heat step + will-change] */
  const CLS = new Array(HEAT_STEPS * 2);
  for (let i = 0; i < HEAT_STEPS; i++) {
    CLS[i] = 'nrx6t nrx6h' + i;
    CLS[i + HEAT_STEPS] = 'nrx6t nrx6h' + i + ' nrx6mv';
  }
  /* readout tint strings, reused without allocation */
  const RCSTR = new Array(HEAT_STEPS);
  for (let i = 0; i < HEAT_STEPS; i++) {
    const c = rampAt(i / (HEAT_STEPS - 1));
    RCSTR[i] = c[0] + ' ' + c[1] + ' ' + c[2];
  }

  function buildCSS() {
    const p = '.' + S;
    let css =
      p + '{background:#0B0B0C;cursor:' + (reduced ? 'default' : 'crosshair') +
        ';-webkit-tap-highlight-color:transparent;--p:900px;--tw:12px;--th:12px;--fw:40px;}' +
      /* the plate is inert to hit-testing: pointer events land on root, so a
         pointermove never has to hit-test hundreds of 3D-transformed tiles */
      p + ' .nrx6s{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;perspective:var(--p);perspective-origin:50% 50%;}' +
      p + ' .nrx6p{position:absolute;left:0;top:0;width:100%;height:100%;transform-style:preserve-3d;transform:rotateX(' + RX_DEG + 'deg) scale(' + PLATE_SCALE + ');}' +
      p + ' .nrx6t{position:absolute;left:0;top:0;width:var(--tw);height:var(--th);box-sizing:border-box;border:1px solid #2A2724;background:#0A0A0B;border-radius:0;backface-visibility:hidden;}' +
      p + ' .nrx6mv{will-change:transform;}' +
      p + ' .nrx6f{position:absolute;left:0;top:0;width:var(--fw);height:var(--fw);box-sizing:border-box;border:1px solid #FFE7C4;background:rgba(255,150,40,.10);border-radius:0;opacity:0;transform:translate(-50%,-50%) translateZ(70px) scale(.3);pointer-events:none;}' +
      p + ' .nrx6v{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;background:radial-gradient(125% 95% at 50% 46%,rgba(0,0,0,0) 38%,rgba(0,0,0,.60) 100%);}' +
      p + ' .nrx6c{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,monospace;}' +
      p + ' .nrx6k{position:absolute;width:12px;height:12px;border:0 solid #35302A;}' +
      p + ' .nrx6k1{left:10px;top:10px;border-left-width:1px;border-top-width:1px;}' +
      p + ' .nrx6k2{right:10px;top:10px;border-right-width:1px;border-top-width:1px;}' +
      p + ' .nrx6k3{left:10px;bottom:10px;border-left-width:1px;border-bottom-width:1px;}' +
      p + ' .nrx6k4{right:10px;bottom:10px;border-right-width:1px;border-bottom-width:1px;}' +
      p + ' .nrx6r{position:absolute;left:30px;top:11px;font-size:10px;font-weight:500;letter-spacing:.16em;line-height:12px;color:rgb(var(--rc,106 96 88));white-space:nowrap;}' +
      p + ' .nrx6hn{position:absolute;left:30px;bottom:11px;font-size:9px;font-weight:400;letter-spacing:.22em;line-height:12px;color:#5A524A;white-space:nowrap;transition:opacity .7s ease;}' +
      p + ' .nrx6hn::before{content:"";display:inline-block;width:4px;height:4px;background:#7A2B00;margin-right:9px;vertical-align:1px;}' +
      p + ' .nrx6off{opacity:0;}' +
      p + '.nrx6nar .nrx6r{font-size:8px;letter-spacing:.09em;left:28px;}' +
      p + '.nrx6nar .nrx6hn{font-size:8px;letter-spacing:.16em;left:28px;}';

    for (let i = 0; i < HEAT_STEPS; i++) {
      const t = i / (HEAT_STEPS - 1);
      const c = rampAt(t);
      const m = 0.028 + 0.55 * Math.pow(t, 1.7);
      const fr = Math.round(10 + (c[0] - 10) * m);
      const fg = Math.round(10 + (c[1] - 10) * m);
      const fb = Math.round(11 + (c[2] - 11) * m);
      css += p + ' .nrx6h' + i + '{border-color:rgb(' + c[0] + ',' + c[1] + ',' + c[2] +
        ');background:rgb(' + fr + ',' + fg + ',' + fb + ');}';
    }
    return css;
  }

  styleEl.textContent = buildCSS();
  document.head.appendChild(styleEl);
  root.classList.add(S);
  root.appendChild(stage);
  root.appendChild(vign);
  root.appendChild(chrome);

  /* ----------------------------------------------------------------- state */
  let destroyed = false;
  let active = false;
  let w = 0, h = 0, persp = 900;
  let cols = 0, rows = 0, n = 0;
  let cellMin = 20, tileW = 0, tileH = 0;
  let speed = 1600, invL2 = 1e-6, ampBase = 600;
  let tiltR2 = 1, invTiltR2 = 1, invHalfR = 1, liftMax = 8, breathAmp = 1.4;

  let els = [];
  let CX = null, CY = null;
  let Z = null, VZ = null, AX = null, VAX = null, AY = null, VAY = null;
  let K = null, C = null;
  let TZ = null, TAX = null, TAY = null;
  let HEAT = null, SP = null, CP = null, BAF = null;
  let LZ = null, LAX = null, LAY = null, LC = null, MVC = null;

  const waves = [];
  const pool = [];

  let pointerOn = false, ptx = 0, pty = 0;
  let rectL = 0, rectT = 0, rectTime = -1e9;
  let now = 0, frame = 0;
  let idle = true;
  let flashT = -1;
  let impMeter = 0;
  let uiAcc = 1, lastSettle = -1, lastRc = -1;
  let hinted = false;
  let localX = 0, localY = 0;

  /* --------------------------------------------------------------- helpers */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* exact inverse of `perspective(P) rotateX(RX) scale(PLATE_SCALE)` so the
     strike lands under the finger despite the plate rake */
  function toLocal(sx, sy) {
    const hw = w * 0.5, hh = h * 0.5;
    const xs = sx - hw, ys = sy - hh;
    const den = persp * COS_RX + ys * SIN_RX;
    const yr = den === 0 ? ys : (ys * persp / den);
    const xr = xs * (persp - yr * SIN_RX) / persp;
    localX = xr / PLATE_SCALE + hw;
    localY = yr / PLATE_SCALE + hh;
  }

  function refreshRect() {
    const r = root.getBoundingClientRect();
    rectL = r.left;
    rectT = r.top;
    rectTime = now;
  }

  function releaseWaves() {
    for (let i = 0; i < waves.length; i++) pool.push(waves[i]);
    waves.length = 0;
  }

  function getSlot() {
    if (pool.length) return pool.pop();
    if (waves.length >= MAX_WAVES) return waves.shift();
    return { sx: 0, sy: 0, t0: 0, amp: 0, maxD: 0, fc: 0, dist: new Float32Array(n), fired: new Uint8Array(n) };
  }

  function pushFront(sx, sy, amp) {
    if (!n) return;
    const slot = getSlot();
    const dist = slot.dist, fired = slot.fired;
    let maxD = 0;
    for (let i = 0; i < n; i++) {
      const dx = CX[i] - sx, dy = CY[i] - sy;
      const d = Math.sqrt(dx * dx + dy * dy);
      dist[i] = d;
      fired[i] = 0;
      if (d > maxD) maxD = d;
    }
    slot.sx = sx; slot.sy = sy; slot.t0 = now; slot.amp = amp;
    slot.maxD = maxD; slot.fc = 0;
    waves.push(slot);
  }

  /* image-method reflection: mirroring the source across each edge gives the
     once-reflected front exactly the right arrival time and direction */
  function strike(x, y) {
    pushFront(x, y, ampBase);
    const r = ampBase * REFLECT;
    pushFront(-x, y, r);
    pushFront(2 * w - x, y, r);
    pushFront(x, -y, r);
    pushFront(x, 2 * h - y, r);
    impMeter += 1.0 + Math.random() * 0.12;
    if (impMeter > 9.98) impMeter = 9.98;
    flashT = 0;
    flash.style.left = x + 'px';
    flash.style.top = y + 'px';
    idle = false;
    if (!hinted) {
      hinted = true;
      hint.classList.add('nrx6off');
    }
  }

  /* ----------------------------------------------------------------- build */
  function gridShape() {
    let target;
    if (w < 520) target = 122;
    else if (w < 880) target = 224;
    else target = 344;
    const maxN = w < 520 ? 150 : 420;
    const minN = w < 520 ? 88 : 236;

    const aspect = w / Math.max(1, h);
    let c = Math.round(Math.sqrt(target * aspect));
    c = clamp(c, 5, 40);
    let r = Math.round(target / c);
    r = clamp(r, 4, 34);

    /* keep tiles a sensible physical size, then honour the hard tile budget */
    while (c > 5 && w / c < 22) c--;
    while (r > 4 && h / r < 22) r--;
    while (c * r > maxN && (c > 5 || r > 4)) {
      if (c > 5 && (r <= 4 || c / r > aspect)) c--; else r--;
    }
    while (c * r < minN && w / (c + 1) >= 24 && h / (r + 1) >= 24) {
      if (c / Math.max(1, r) < aspect) c++; else r++;
    }
    cols = c; rows = r;
  }

  function allocate(count) {
    CX = new Float32Array(count); CY = new Float32Array(count);
    Z = new Float32Array(count); VZ = new Float32Array(count);
    AX = new Float32Array(count); VAX = new Float32Array(count);
    AY = new Float32Array(count); VAY = new Float32Array(count);
    K = new Float32Array(count); C = new Float32Array(count);
    TZ = new Float32Array(count); TAX = new Float32Array(count); TAY = new Float32Array(count);
    HEAT = new Float32Array(count); SP = new Float32Array(count); CP = new Float32Array(count);
    BAF = new Float32Array(count);
    LZ = new Int16Array(count); LAX = new Int16Array(count); LAY = new Int16Array(count);
    LC = new Int16Array(count); MVC = new Int8Array(count);
  }

  function build() {
    gridShape();
    const count = cols * rows;
    const rebuild = count !== n || els.length !== count;

    if (rebuild) {
      releaseWaves();
      pool.length = 0;
      n = count;
      allocate(n);
      els = new Array(n);
      plate.textContent = '';
      plate.appendChild(flash);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        el.className = CLS[0];
        els[i] = el;
        frag.appendChild(el);
      }
      plate.appendChild(frag);
    } else {
      releaseWaves();
      for (let i = 0; i < n; i++) {
        Z[i] = 0; VZ[i] = 0; AX[i] = 0; VAX[i] = 0; AY[i] = 0; VAY[i] = 0;
        TZ[i] = 0; TAX[i] = 0; TAY[i] = 0; HEAT[i] = 0;
        LZ[i] = 0; LAX[i] = 0; LAY[i] = 0; LC[i] = 0; MVC[i] = 0;
        els[i].className = CLS[0];
        els[i].style.transform = '';
      }
    }

    const cw = w / cols, ch = h / rows;
    cellMin = Math.min(cw, ch);
    const gap = Math.max(2, cellMin * 0.15);
    tileW = Math.max(3, cw - gap);
    tileH = Math.max(3, ch - gap);
    root.style.setProperty('--tw', (Math.round(tileW * 100) / 100) + 'px');
    root.style.setProperty('--th', (Math.round(tileH * 100) / 100) + 'px');
    root.style.setProperty('--fw', (Math.round(cellMin * 1.6)) + 'px');

    for (let r = 0, i = 0; r < rows; r++) {
      const top = r * ch + (ch - tileH) * 0.5;
      const cy = r * ch + ch * 0.5;
      for (let c = 0; c < cols; c++, i++) {
        const left = c * cw + (cw - tileW) * 0.5;
        const el = els[i];
        el.style.left = (Math.round(left * 100) / 100) + 'px';
        el.style.top = (Math.round(top * 100) / 100) + 'px';
        CX[i] = c * cw + cw * 0.5;
        CY[i] = cy;
        const jitter = 0.86 + ((i * 2654435761) % 1000) / 1000 * 0.28;
        const k = 232 * jitter;
        K[i] = k;
        C[i] = 2 * (0.29 + ((i * 40503) % 100) / 100 * 0.07) * Math.sqrt(k);
        const ph = CX[i] * 0.0161 + CY[i] * 0.0223;
        SP[i] = Math.sin(ph);
        CP[i] = Math.cos(ph);
        BAF[i] = 0.24 + ((i * 2246822519) % 977) / 977 * 0.76;
        LZ[i] = 0; LAX[i] = 0; LAY[i] = 0; LC[i] = 0; MVC[i] = 0;
      }
    }

    /* derived physics scales — all in real pixels so it feels the same at any size */
    const diag = Math.sqrt(w * w + h * h);
    speed = Math.max(w, h) / 0.5;
    const L = diag * 0.46;
    invL2 = 1 / (L * L);
    const omega = Math.sqrt(232);
    ampBase = cellMin * 1.25 * omega;
    const R = clamp(diag * 0.30, 130, 430);
    tiltR2 = R * R;
    invTiltR2 = 1 / tiltR2;
    invHalfR = 1 / (R * 0.52);
    liftMax = cellMin * 0.44;
    breathAmp = Math.min(1.6, cellMin * 0.042);

    persp = clamp(Math.min(w, h) * 0.98, 520, 1180);
    root.style.setProperty('--p', Math.round(persp) + 'px');

    if (w < 520) root.classList.add('nrx6nar'); else root.classList.remove('nrx6nar');

    flash.style.opacity = '0';
    flashT = -1;
    idle = true;
    lastSettle = -1;
    lastRc = -1;
    uiAcc = 1;
  }

  /* -------------------------------------------------- reduced-motion poster */
  function renderStill() {
    if (!n) return;
    const invW = 1 / w, invH = 1 / h;
    const dirX = 0.68, dirY = 0.73;
    const inv = 1 / Math.sqrt(dirX * dirX + dirY * dirY);
    const ux = dirX * inv, uy = dirY * inv;
    const amp = cellMin * 1.15;
    const rotK = 13.5;
    for (let i = 0; i < n; i++) {
      const nx = CX[i] * invW, ny = CY[i] * invH;
      const u = nx * ux + ny * uy;
      const s = (u - 0.47) * 6.4;
      const aWide = s > 0 ? 0.42 : 0.115;      /* long cooling tail behind the front */
      const g = Math.exp(-s * s * aWide);
      const sn = Math.sin(s * 1.5);
      const zz = amp * sn * g;
      const slope = (1.5 * Math.cos(s * 1.5) - sn * 2 * aWide * s) * g;
      const rot = clamp(slope * rotK, -26, 26);
      const ax = rot * uy;
      const ay = -rot * ux;
      const hh = clamp(Math.exp(-s * s * (s > 0 ? 0.52 : 0.10)) * (0.30 + 0.74 * Math.abs(sn)), 0, 1);

      const iz = Math.round(zz * QZ);
      const iax = Math.round(ax * QA);
      const iay = Math.round(ay * QA);
      const isc = (iz * 0.08) | 0;
      els[i].style.transform =
        'translate3d(0,0,' + (iz / QZ) + 'px) rotateX(' + (iax / QA) + 'deg) rotateY(' +
        (iay / QA) + 'deg) scale(' + ((2000 + isc) / 2000) + ')';
      const hs = (hh * (HEAT_STEPS - 1) + 0.5) | 0;
      els[i].className = CLS[hs];
      LZ[i] = iz; LAX[i] = iax; LAY[i] = iay; LC[i] = hs;
      HEAT[i] = hh;
    }
    chrome.style.setProperty('--rc', RCSTR[24]);
    readout.textContent = 'TILES ' + n + ' / IMPULSE 1.00 / SETTLE 00%';
  }

  /* ---------------------------------------------------------------- pointer */
  function setPointerFromEvent(e) {
    if (now - rectTime > 0.2) refreshRect();
    toLocal(e.clientX - rectL, e.clientY - rectT);
    ptx = localX;
    pty = localY;
  }

  function onDown(e) {
    if (destroyed || reduced || !n) return;
    refreshRect();
    toLocal(e.clientX - rectL, e.clientY - rectT);
    const x = clamp(localX, 0, w), y = clamp(localY, 0, h);
    ptx = x; pty = y;
    pointerOn = true;
    strike(x, y);
  }

  function onMove(e) {
    if (destroyed || reduced || !n) return;
    setPointerFromEvent(e);
    pointerOn = true;
    idle = false;
  }

  function onUp(e) {
    if (destroyed || reduced) return;
    if (e.pointerType && e.pointerType !== 'mouse') pointerOn = false;
  }

  function onLeave() {
    if (destroyed || reduced) return;
    pointerOn = false;
  }

  if (!reduced) {
    root.addEventListener('pointerdown', onDown, { passive: true });
    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerup', onUp, { passive: true });
    root.addEventListener('pointercancel', onLeave, { passive: true });
    root.addEventListener('pointerleave', onLeave, { passive: true });
  }

  /* ------------------------------------------------------------------ loop */
  function update(dt, elapsed) {
    if (destroyed || reduced || !active || !n) return;
    if (!(dt > 0)) return;
    if (dt > 0.05) dt = 0.05;
    now = elapsed;
    frame++;

    /* --- 1. advance wave fronts, kick springs as the front arrives --------- */
    for (let wi = waves.length - 1; wi >= 0; wi--) {
      const wv = waves[wi];
      const front = (now - wv.t0) * speed;
      if (front <= 0) continue;
      const dist = wv.dist, fired = wv.fired;
      const sx = wv.sx, sy = wv.sy, amp = wv.amp;
      let fc = wv.fc;
      for (let i = 0; i < n; i++) {
        if (fired[i]) continue;
        const d = dist[i];
        if (d > front) continue;
        fired[i] = 1;
        fc++;
        const J = amp / (1 + d * d * invL2);
        const dx = CX[i] - sx, dy = CY[i] - sy;
        const invd = 1 / (d > 1 ? d : 1);
        VZ[i] += J;
        VAX[i] += J * dy * invd * ROT_GAIN;
        VAY[i] -= J * dx * invd * ROT_GAIN;
      }
      wv.fc = fc;
      if (fc >= n || front > wv.maxD + 2) {
        waves.splice(wi, 1);
        pool.push(wv);
      } else {
        idle = false;
      }
    }

    /* --- 2. per-frame constants ------------------------------------------- */
    const aTilt = 1 - Math.exp(-9.5 * dt);
    const aAtk = 1 - Math.exp(-26 * dt);
    const aRel = 1 - Math.exp(-1.35 * dt);   /* heat lingers well past the motion */
    const bs = Math.sin(now * 0.55), bc = Math.cos(now * 0.55);
    const strided = idle && !pointerOn;
    const phase = frame % IDLE_STRIDE;
    const pOn = pointerOn;
    const px = ptx, py = pty;

    let activeCnt = 0, peak = 0;

    for (let i = 0; i < n; i++) {
      if (strided && (i % IDLE_STRIDE) !== phase) continue;

      /* springs (semi-implicit Euler, per-tile stiffness/damping jitter) */
      let z = Z[i], vz = VZ[i], ax = AX[i], vax = VAX[i], ay = AY[i], vay = VAY[i];
      if (z !== 0 || vz !== 0 || ax !== 0 || vax !== 0 || ay !== 0 || vay !== 0) {
        const k = K[i], c = C[i];
        vz += (-k * z - c * vz) * dt; z += vz * dt;
        vax += (-k * ax - c * vax) * dt; ax += vax * dt;
        vay += (-k * ay - c * vay) * dt; ay += vay * dt;
        if (z < REST_Z && z > -REST_Z && vz < REST_VZ && vz > -REST_VZ) { z = 0; vz = 0; }
        if (ax < REST_A && ax > -REST_A && vax < REST_VA && vax > -REST_VA) { ax = 0; vax = 0; }
        if (ay < REST_A && ay > -REST_A && vay < REST_VA && vay > -REST_VA) { ay = 0; vay = 0; }
        Z[i] = z; VZ[i] = vz; AX[i] = ax; VAX[i] = vax; AY[i] = ay; VAY[i] = vay;
      }

      /* proximity tilt field — tiles turn to face the pointer, damped */
      let ttz = 0, ttx = 0, tty = 0;
      if (pOn) {
        const dx = px - CX[i], dy = py - CY[i];
        const d2 = dx * dx + dy * dy;
        if (d2 < tiltR2) {
          let u = 1 - d2 * invTiltR2;
          u *= u;
          let fx = dx * invHalfR; fx = fx > 1 ? 1 : (fx < -1 ? -1 : fx);
          let fy = dy * invHalfR; fy = fy > 1 ? 1 : (fy < -1 ? -1 : fy);
          tty = TILT_MAX * u * fx;
          ttx = -TILT_MAX * u * fy;
          ttz = liftMax * u;
        }
      }
      let tz = TZ[i], tx = TAX[i], ty = TAY[i];
      const av = vz < 0 ? -vz : vz;
      const az = z < 0 ? -z : z;
      const ar = (vax < 0 ? -vax : vax) + (vay < 0 ? -vay : vay);
      let moving = av > 4 || az > 0.3 || ar > 2.5;
      const gz = ttz - tz, gx = ttx - tx, gy = tty - ty;
      if (gz !== 0 || gx !== 0 || gy !== 0) {
        if (gz > 0.05 || gz < -0.05 || gx > 0.02 || gx < -0.02 || gy > 0.02 || gy < -0.02) moving = true;
        tz += gz * aTilt;
        tx += gx * aTilt;
        ty += gy * aTilt;
        if (ttz === 0 && tz < 0.01 && tz > -0.01) tz = 0;
        if (ttx === 0 && tx < 0.004 && tx > -0.004) tx = 0;
        if (tty === 0 && ty < 0.004 && ty > -0.004) ty = 0;
        TZ[i] = tz; TAX[i] = tx; TAY[i] = ty;
      }

      /* heat: fast attack off displacement + velocity, slow release */
      let e = av * 0.0011 + az * 0.012 + ar * 0.0014 + (tz < 0 ? -tz : tz) * 0.011;
      if (e > 1) e = 1;
      if (e > peak) peak = e;
      let hh = HEAT[i];
      if (e !== 0 || hh !== 0) {
        hh += (e - hh) * (e > hh ? aAtk : aRel);
        if (hh < 0.0015) hh = 0;
        HEAT[i] = hh;
      }

      /* compose + dirty-check on quantised integers; write at most 2 props */
      const br = breathAmp * BAF[i] * (bs * CP[i] + bc * SP[i]);
      const iz = Math.round((z + tz + br) * QZ);
      const iax = Math.round((ax + tx) * QA);
      const iay = Math.round((ay + ty) * QA);
      const el = els[i];
      if (iz !== LZ[i] || iax !== LAX[i] || iay !== LAY[i]) {
        LZ[i] = iz; LAX[i] = iax; LAY[i] = iay;
        const isc = (iz * 0.08) | 0;
        el.style.transform =
          'translate3d(0,0,' + (iz / QZ) + 'px) rotateX(' + (iax / QA) + 'deg) rotateY(' +
          (iay / QA) + 'deg) scale(' + ((2000 + isc) / 2000) + ')';
      }
      const hs = (hh * (HEAT_STEPS - 1) + 0.5) | 0;
      const ci = hs >= 3 ? hs + HEAT_STEPS : hs;
      if (ci !== LC[i]) {
        LC[i] = ci;
        el.className = CLS[ci];
      }
      if (hh !== 0 || z !== 0 || vz !== 0 || tz !== 0 || tx !== 0 || ty !== 0) activeCnt++;
    }

    /* --- 3. impact flash (single node, integrated here) -------------------- */
    if (flashT >= 0) {
      flashT += dt;
      const p = flashT / FLASH_DUR;
      if (p >= 1) {
        flashT = -1;
        flash.style.opacity = '0';
      } else {
        const sc = 0.3 + p * 3.3;
        const o = (1 - p) * (1 - p);
        flash.style.transform = 'translate(-50%,-50%) translateZ(70px) scale(' +
          (Math.round(sc * 100) / 100) + ')';
        flash.style.opacity = '' + (Math.round(o * 100) / 100);
      }
    }

    /* --- 4. instrumentation readout (throttled) ---------------------------- */
    impMeter -= impMeter * (1 - Math.exp(-1.15 * dt));
    if (impMeter < 0.005) impMeter = 0;
    uiAcc += dt;
    if (uiAcc >= 0.14) {
      uiAcc = 0;
      const settle = 100 - Math.round((activeCnt / n) * 100);
      if (settle !== lastSettle || impMeter > 0) {
        lastSettle = settle;
        readout.textContent = 'TILES ' + n + ' / IMPULSE ' + impMeter.toFixed(2) +
          ' / SETTLE ' + (settle < 10 ? '0' + settle : '' + settle) + '%';
      }
      const rc = (clamp(peak * 1.35, 0, 1) * (HEAT_STEPS - 1) + 0.5) | 0;
      if (rc !== lastRc) {
        lastRc = rc;
        chrome.style.setProperty('--rc', RCSTR[rc]);
      }
    }

    if (!strided) {
      idle = waves.length === 0 && !pointerOn && activeCnt === 0 && flashT < 0;
    }
  }

  /* ------------------------------------------------------------------- api */
  return {
    resize(width, height) {
      if (destroyed) return;
      const nw = Math.max(1, Math.round(width || root.clientWidth || 1));
      const nh = Math.max(1, Math.round(height || root.clientHeight || 1));
      if (nw === w && nh === h && n) return;
      w = nw; h = nh;
      build();
      if (reduced) renderStill();
      rectTime = -1e9;
    },
    update,
    activate() {
      if (destroyed) return;
      active = true;
      rectTime = -1e9;
    },
    deactivate() {
      if (destroyed) return;
      active = false;
      pointerOn = false;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      active = false;
      if (!reduced) {
        root.removeEventListener('pointerdown', onDown, { passive: true });
        root.removeEventListener('pointermove', onMove, { passive: true });
        root.removeEventListener('pointerup', onUp, { passive: true });
        root.removeEventListener('pointercancel', onLeave, { passive: true });
        root.removeEventListener('pointerleave', onLeave, { passive: true });
      }
      releaseWaves();
      pool.length = 0;
      if (stage.parentNode === root) root.removeChild(stage);
      if (vign.parentNode === root) root.removeChild(vign);
      if (chrome.parentNode === root) root.removeChild(chrome);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      root.classList.remove(S, 'nrx6nar');
      root.style.removeProperty('--tw');
      root.style.removeProperty('--th');
      root.style.removeProperty('--fw');
      root.style.removeProperty('--p');
      els.length = 0;
      CX = CY = Z = VZ = AX = VAX = AY = VAY = K = C = null;
      TZ = TAX = TAY = HEAT = SP = CP = BAF = null;
      LZ = LAX = LAY = LC = null;
      n = 0;
    }
  };
}
