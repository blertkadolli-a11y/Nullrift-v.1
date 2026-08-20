/* NULLRIFT — 08 DOT REVEAL
   A photograph hidden under a field of image-tinted dots. The dots near the
   pointer swell, fade and lean in, while a soft-edged crop of the real photo
   is drawn under the cursor.

   Everything is sized from the stage box rather than the viewport, so the same
   module composes in a card and at full page. */

let UID = 0;

const TWO_PI = Math.PI * 2;
const IMAGE_SRC = new URL('../../assets/dots/portrait.jpg', import.meta.url).href;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* Frame-rate independent approach. The orchestrator hands idle exhibits a
   coalesced dt, so a fixed per-frame lerp would visibly halve their speed. */
const approach = (rate, dt) => 1 - Math.exp(-rate * dt);

export default function create(ctx) {
  const root = ctx && ctx.root;
  if (!root) {
    return { resize() {}, update() {}, activate() {}, deactivate() {}, destroy() {} };
  }

  const reduced = !!(ctx && ctx.reduced);
  let preview = !!(ctx && ctx.preview);
  const S = 'nrx8d' + (++UID);

  /* ------------------------------------------------------------------ dom */
  const styleEl = document.createElement('style');
  styleEl.textContent =
    '.' + S + '{position:absolute;inset:0;display:block;width:100%;height:100%;' +
    'background:#000;touch-action:none;}';
  document.head.appendChild(styleEl);

  const canvas = document.createElement('canvas');
  canvas.className = S;
  canvas.setAttribute('aria-hidden', 'true');
  root.appendChild(canvas);

  const ctx2d = canvas.getContext('2d', { alpha: false });

  /* Hi-DPI buffer for the spotlight, plus a 1:1 buffer for colour sampling —
     reading pixels from a scaled buffer gives the wrong dot tints. */
  const photo = document.createElement('canvas');
  const photoCtx = photo.getContext('2d', { alpha: false });
  const sample = document.createElement('canvas');
  const sampleCtx = sample.getContext('2d', { alpha: false, willReadFrequently: true });
  const spot = document.createElement('canvas');
  const spotCtx = spot.getContext('2d');

  /* ---------------------------------------------------------------- state */
  const img = new Image();
  let imageReady = false;
  let destroyed = false;
  let active = false;

  let W = 0, H = 0, dpr = 1;
  /* The artwork's own rect inside the stage — the whole photo, letterboxed. */
  let fitX = 0, fitY = 0, fitW = 0, fitH = 0;
  let dots = [];
  let cols = 0, rows = 0, spacing = 0, originX = 0, originY = 0;
  let baseRadius = 0, radiusSpan = 0;
  let reach = 120, spotSize = 240;

  let px = -9999, py = -9999;
  let hovering = false;
  let intro = 0;
  let revealMix = 0;
  let elapsed = 0;

  /* idle phantom pointer */
  let idleT = Math.random() * 30;
  let usingIdle = true;

  /* ------------------------------------------------------------- sampling */
  /* Saturate away from the per-pixel average, then lift so the brightest
     channel clears ~180 — a raw sample is far too dark to read as a dot field.

     The lift is multiplicative, so a pure black pixel stays pure black and
     whole regions of a high-contrast image simply vanish. A small additive
     floor keeps those dots present as dark marks, which is what makes the
     silhouette read as a shape rather than a hole. */
  const FLOOR = 30;

  function boost(r, g, b) {
    const avg = (r + g + b) / 3;
    let rr = avg + (r - avg) * 1.85;
    let gg = avg + (g - avg) * 1.85;
    let bb = avg + (b - avg) * 1.85;
    const peak = Math.max(rr, gg, bb, 1);
    const lift = peak < 180 ? 180 / peak : 1;
    rr *= lift; gg *= lift; bb *= lift;

    const dark = clamp(1 - Math.max(rr, gg, bb) / 90, 0, 1);
    const add = FLOOR * dark;

    return {
      r: clamp(Math.round(rr + add), 0, 255),
      g: clamp(Math.round(gg + add * 0.92), 0, 255),
      b: clamp(Math.round(bb + add * 0.82), 0, 255),
      lum: clamp(Math.sqrt((0.299 * r + 0.587 * g + 0.114 * b) / 255), 0, 1)
    };
  }

  /* ------------------------------------------------------------- geometry */

  /* Contain, not cover. A 4:3 card cropping a square portrait cuts the face
     off the side — the composition is the point, so the whole frame has to
     fit and the stage letterboxes around it. */
  function fitImage() {
    if (!imageReady || !img.naturalWidth) {
      fitX = 0; fitY = 0; fitW = W; fitH = H;
      return;
    }
    const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    fitW = Math.round(img.naturalWidth * scale);
    fitH = Math.round(img.naturalHeight * scale);
    fitX = Math.round((W - fitW) / 2);
    fitY = Math.round((H - fitH) / 2);
  }

  function buildDots() {
    /* Dot pitch tracks the artwork, so a card reads as the same picture as the
       full page with fewer dots — not a zoomed-in crop of one. */
    const target = preview ? 15 : 19;
    cols = Math.max(6, Math.round(fitW / target));
    spacing = fitW / cols;
    rows = Math.max(4, Math.round(fitH / spacing));

    let guard = 0;
    const cap = preview ? 2600 : 5600;
    while (cols * rows > cap && cols > 8 && guard < 10) {
      cols = Math.max(8, Math.floor(cols * 0.92));
      spacing = fitW / cols;
      rows = Math.max(4, Math.round(fitH / spacing));
      guard += 1;
    }

    originX = fitX + spacing / 2;
    originY = fitY + (fitH - rows * spacing) / 2 + spacing / 2;
    baseRadius = Math.max(1.2, 0.44 * spacing);
    radiusSpan = 1.05 * spacing - baseRadius;

    dots = new Array(cols * rows);
    for (let c = 0; c < cols; c += 1) {
      const x = originX + c * spacing;
      const base = c * rows;
      for (let r = 0; r < rows; r += 1) {
        dots[base + r] = {
          x, y: originY + r * spacing,
          lum: 0.5, tint: '#ff7828',
          reveal: 0, target: 0,
          dx: 0, dy: 0, tdx: 0, tdy: 0
        };
      }
    }
  }

  function drawBuffers() {
    if (!imageReady || fitW === 0 || fitH === 0) return;

    /* Padding lets the spotlight sit against an edge of the artwork without
       sampling past the buffer. */
    const pad = Math.round(spotSize * 0.6);
    const bw = fitW + pad * 2;
    const bh = fitH + pad * 2;

    photo.width = Math.round(bw * dpr);
    photo.height = Math.round(bh * dpr);
    photoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    photoCtx.imageSmoothingEnabled = true;
    photoCtx.imageSmoothingQuality = 'high';
    photoCtx.fillStyle = '#000';
    photoCtx.fillRect(0, 0, bw, bh);
    photoCtx.drawImage(img, pad, pad, fitW, fitH);

    sample.width = bw;
    sample.height = bh;
    sampleCtx.setTransform(1, 0, 0, 1, 0, 0);
    sampleCtx.imageSmoothingEnabled = true;
    sampleCtx.fillStyle = '#000';
    sampleCtx.fillRect(0, 0, bw, bh);
    sampleCtx.drawImage(img, pad, pad, fitW, fitH);

    photo.pad = pad;
  }

  function sampleTints() {
    if (!imageReady || !dots.length || !sample.width) return;
    let data;
    try {
      data = sampleCtx.getImageData(0, 0, sample.width, sample.height).data;
    } catch (err) {
      return; /* tainted canvas — keep the fallback tint rather than throw */
    }
    const pad = photo.pad || 0;
    const w = sample.width;
    const h = sample.height;
    for (let i = 0; i < dots.length; i += 1) {
      const d = dots[i];
      /* Stage coords -> buffer coords: subtract the artwork's offset first. */
      const sx = clamp(Math.round(d.x - fitX + pad), 0, w - 1);
      const sy = clamp(Math.round(d.y - fitY + pad), 0, h - 1);
      const k = (sy * w + sx) * 4;
      const c = boost(data[k], data[k + 1], data[k + 2]);
      d.lum = c.lum;
      d.tint = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    }
  }

  /* --------------------------------------------------------------- pointer */
  /* Read the box per event. Caching it breaks the moment the page scrolls,
     which is exactly what a card in a long grid does. */
  function local(e) {
    const b = canvas.getBoundingClientRect();
    px = e.clientX - b.left;
    py = e.clientY - b.top;
  }

  function onEnter(e) {
    if (!active || reduced) return;
    hovering = true;
    usingIdle = false;
    local(e);
  }

  function onMove(e) {
    if (!active || reduced) return;
    hovering = true;
    usingIdle = false;
    local(e);
  }

  function onLeave(e) {
    if (e && e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    hovering = false;
  }

  if (!reduced) {
    canvas.addEventListener('pointerenter', onEnter, { passive: true });
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });
    canvas.addEventListener('pointercancel', onLeave, { passive: true });
  }

  /* The field is otherwise motionless without a cursor, which reads as a dead
     tile in a grid. A phantom pointer wanders the same machinery so the
     exhibit is alive at rest, and stands down the moment a real one arrives. */
  function driftIdle(dt) {
    idleT += dt;
    const t = idleT;
    px = fitX + fitW * (0.5 + 0.34 * Math.sin(t * 0.23) * Math.cos(t * 0.11));
    py = fitY + fitH * (0.5 + 0.30 * Math.sin(t * 0.17 + 1.3) * Math.cos(t * 0.071));
  }

  /* ------------------------------------------------------------------- api */
  function resize(w, h) {
    if (destroyed) return;
    W = Math.max(1, Math.round(w || root.clientWidth || 1));
    H = Math.max(1, Math.round(h || root.clientHeight || 1));
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Fit first: the reach and the buffer padding are both fractions of the
       artwork, so nothing downstream can be sized until it is known. */
    fitImage();

    /* The spotlight is a fraction of the artwork, never a fixed 300px — at card
       size a fixed radius swallows the whole frame and there is nothing left
       to reveal. */
    reach = clamp(Math.min(fitW, fitH) * 0.40, 48, 250);
    spotSize = Math.round(reach * 2);
    spot.width = Math.round(spotSize * dpr);
    spot.height = Math.round(spotSize * dpr);

    buildDots();
    drawBuffers();
    sampleTints();
    if (reduced) render(0);
  }

  function update(dt, now) {
    if (destroyed || !active) return;
    const d = clamp(dt, 0, 0.05);
    elapsed = typeof now === 'number' ? now : elapsed + d;

    if (reduced) return;
    if (!imageReady) return;

    intro += (1 - intro) * approach(2.6, d);

    if (!hovering) {
      usingIdle = true;
      driftIdle(d);
    }

    const targetMix = 1;
    revealMix += (targetMix - revealMix) * approach(5, d);

    /* Only the dots inside the reach need their targets recomputed. */
    const c0 = Math.max(0, Math.floor((px - reach - originX) / spacing) - 1);
    const c1 = Math.min(cols - 1, Math.ceil((px + reach - originX) / spacing));
    const r0 = Math.max(0, Math.floor((py - reach - originY) / spacing) - 1);
    const r1 = Math.min(rows - 1, Math.ceil((py + reach - originY) / spacing));

    for (let i = 0; i < dots.length; i += 1) {
      const dot = dots[i];
      dot.target = 0;
      dot.tdx = 0;
      dot.tdy = 0;
    }

    for (let c = c0; c <= c1; c += 1) {
      const base = c * rows;
      for (let r = r0; r <= r1; r += 1) {
        const dot = dots[base + r];
        if (!dot) continue;
        const ddx = px - dot.x;
        const ddy = py - dot.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist >= reach) continue;
        let t = 1 - dist / reach;
        t = Math.pow(t, 0.85);
        const ease = t * t * (3 - 2 * t);
        dot.target = ease;
        const pull = 0.42 * ease;
        dot.tdx = ddx * pull;
        dot.tdy = ddy * pull;
      }
    }

    const k = approach(9, d);
    for (let i = 0; i < dots.length; i += 1) {
      const dot = dots[i];
      dot.reveal += (dot.target - dot.reveal) * k;
      dot.dx += (dot.tdx - dot.dx) * k;
      dot.dy += (dot.tdy - dot.dy) * k;
    }

    render(elapsed);
  }

  function render(time) {
    ctx2d.fillStyle = '#000';
    ctx2d.fillRect(0, 0, W, H);

    const breatheBase = reduced ? 0 : time;

    for (let c = 0; c < cols; c += 1) {
      const base = c * rows;
      const breath = 0.85 + 0.12 * Math.sin(breatheBase + 0.01 * dots[base].x);
      for (let r = 0; r < rows; r += 1) {
        const dot = dots[base + r];
        const alpha = breath * (1 - dot.reveal) * intro;
        if (alpha <= 0.012) continue;
        const lumScale = 0.6 + 0.75 * dot.lum;
        const radius = (baseRadius * lumScale + radiusSpan * dot.reveal) / 2;
        ctx2d.globalAlpha = alpha;
        ctx2d.beginPath();
        ctx2d.arc(dot.x + dot.dx, dot.y + dot.dy, radius, 0, TWO_PI);
        ctx2d.fillStyle = dot.tint;
        ctx2d.fill();
      }
    }
    ctx2d.globalAlpha = 1;

    if (revealMix > 0.012 && imageReady && photo.width) {
      const half = spotSize / 2;
      const pad = photo.pad || 0;

      spotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spotCtx.globalCompositeOperation = 'source-over';
      spotCtx.clearRect(0, 0, spotSize, spotSize);
      spotCtx.drawImage(
        photo,
        (px - fitX - half + pad) * dpr, (py - fitY - half + pad) * dpr,
        spotSize * dpr, spotSize * dpr,
        0, 0, spotSize, spotSize
      );

      const g = spotCtx.createRadialGradient(half, half, half * 0.55, half, half, half);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.86, 'rgba(0,0,0,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      spotCtx.globalCompositeOperation = 'destination-in';
      spotCtx.fillStyle = g;
      spotCtx.fillRect(0, 0, spotSize, spotSize);
      spotCtx.globalCompositeOperation = 'source-over';

      ctx2d.globalAlpha = revealMix * intro;
      ctx2d.drawImage(spot, px - half, py - half, spotSize, spotSize);
      ctx2d.globalAlpha = 1;
    }
  }

  function activate() { if (!destroyed) active = true; }

  function deactivate() {
    active = false;
    hovering = false;
    /* Paused mid-entrance would leave a blank tile; resolve it instead. */
    if (!destroyed && intro < 1) {
      intro = 1;
      revealMix = 1;
      if (imageReady) render(elapsed);
    }
  }

  function setPreview(next) {
    preview = !!next;
    /* Dot pitch depends on preview; the orchestrator forces a resize after. */
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    active = false;
    if (!reduced) {
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointercancel', onLeave);
    }
    img.onload = null;
    img.onerror = null;
    if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    dots = [];
  }

  /* ------------------------------------------------------------------ boot */
  img.onload = function () {
    if (destroyed) return;
    imageReady = true;
    /* The fit depends on the image's aspect, which is only known now — redo
       the whole layout rather than just the buffers. */
    resize(W, H);
    if (reduced) { intro = 1; revealMix = 1; render(0); }
  };
  img.onerror = function () { imageReady = false; };
  img.src = IMAGE_SRC;

  resize(root.clientWidth, root.clientHeight);

  if (reduced) {
    intro = 1;
    revealMix = 1;
    px = fitX + fitW * 0.5;
    py = fitY + fitH * 0.42;
    render(0);
  }

  return {
    setPreview: setPreview,
    resize: resize,
    update: update,
    activate: activate,
    deactivate: deactivate,
    destroy: destroy
  };
}
