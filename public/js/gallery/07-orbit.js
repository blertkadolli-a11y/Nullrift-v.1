/* NULLRIFT — 07 PRODUCT ORBIT
   A hero product under gallery light, with its catalogue arranged on a flat
   ellipse below. The lower half of the ring runs underground. Scrubbing the
   ring turns the whole mechanism as one piece and whatever lands at twelve
   o'clock becomes the hero.

   Everything is laid out from the stage box rather than the viewport, so the
   same module composes at card size and at full page. */

let UID = 0;

const PRODUCTS = [
  { name: 'BLUE',   file: 'blue' },
  { name: 'YELLOW', file: 'yellow' },
  { name: 'WHITE',  file: 'white' },
  { name: 'BLACK',  file: 'black' },
  { name: 'PINK',   file: 'pink' },
  { name: 'PURPLE', file: 'purple' },
  { name: 'RED',    file: 'red' },
  { name: 'GREEN',  file: 'green' }
];

const N = PRODUCTS.length;
const TAU = Math.PI * 2;
const STEP = TAU / N;

/* Asset roots are resolved against this module so the page can live anywhere. */
const THUMB = new URL('../../assets/orbit/thumb/', import.meta.url).href;
const HERO = new URL('../../assets/orbit/hero/', import.meta.url).href;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/* Signed shortest way round the ring, so a turn never takes the long way. */
function shortestDelta(from, to) {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function rotationFor(index) {
  return -index * STEP;
}

function indexFor(rotation) {
  return ((Math.round(-rotation / STEP) % N) + N) % N;
}

export default function create(ctx) {
  const root = ctx && ctx.root;
  if (!root) {
    return { resize() {}, update() {}, activate() {}, deactivate() {}, destroy() {} };
  }

  const reduced = !!(ctx && ctx.reduced);
  let preview = !!(ctx && ctx.preview);
  const S = 'nrx7o' + (++UID);

  /* ------------------------------------------------------------------ dom */
  const styleEl = document.createElement('style');
  const stage = document.createElement('div');
  const glow = document.createElement('div');
  const ring = document.createElement('div');
  const hero = document.createElement('div');
  const heroA = document.createElement('img');
  const heroB = document.createElement('img');
  const rim = document.createElement('div');
  const key = document.createElement('div');
  const floor = document.createElement('div');
  const label = document.createElement('div');
  const nameEl = document.createElement('div');
  const countEl = document.createElement('div');
  const orbit = document.createElement('div');
  const vign = document.createElement('div');

  stage.className = S + ' ' + S + 's';
  glow.className = S + 'g';
  ring.className = S + 'r';
  hero.className = S + 'h';
  heroA.className = S + 'i';
  heroB.className = S + 'i';
  rim.className = S + 'rm';
  key.className = S + 'k';
  floor.className = S + 'fl';
  label.className = S + 'l';
  nameEl.className = S + 'n';
  countEl.className = S + 'c';
  orbit.className = S + 'o';
  vign.className = S + 'v';

  heroA.alt = '';
  heroB.alt = '';
  heroA.decoding = 'async';
  heroB.decoding = 'async';
  heroA.draggable = false;
  heroB.draggable = false;

  hero.appendChild(heroA);
  hero.appendChild(heroB);
  hero.appendChild(key);
  hero.appendChild(rim);
  label.appendChild(nameEl);
  label.appendChild(countEl);
  stage.appendChild(glow);
  stage.appendChild(ring);
  stage.appendChild(floor);
  stage.appendChild(hero);
  stage.appendChild(label);
  stage.appendChild(orbit);
  stage.appendChild(vign);

  function buildCSS() {
    const p = '.' + S;
    return [
      p + 's{position:absolute;inset:0;overflow:hidden;background:#050505;',
      'font-family:var(--font-display),"Space Grotesk",sans-serif;contain:strict;}',

      /* one unified bloom behind the hero, never four corner orbs */
      p + 'g{position:absolute;left:50%;top:0;border-radius:50%;pointer-events:none;',
      'transform:translate(-50%,-50%);will-change:opacity,transform;',
      'background:radial-gradient(ellipse 56% 50% at 50% 44%,',
      'rgba(139,147,255,0.10) 0%,rgba(255,255,255,0.045) 36%,transparent 69%);}',

      /* the orbit path, drawn so the mechanism reads even when circles sink */
      p + 'r{position:absolute;left:0;top:0;border-radius:50%;pointer-events:none;',
      'border:1px solid rgba(139,147,255,0.12);transform:translate(-50%,-50%);}',

      p + 'h{position:absolute;left:50%;top:0;overflow:hidden;',
      'transform-origin:50% 50%;will-change:transform,opacity;',
      'box-shadow:0 0 0 1px rgba(255,255,255,0.10),0 0 40px rgba(139,147,255,0.08),',
      '0 24px 50px rgba(0,0,0,0.55);}',

      p + 'i{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;',
      'display:block;will-change:opacity;}',

      /* thin luminous rim hugging the frame */
      p + 'rm{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:0.85;',
      'background:linear-gradient(145deg,rgba(255,255,255,0.45) 0%,rgba(139,147,255,0.35) 28%,',
      'rgba(255,255,255,0.06) 52%,rgba(139,147,255,0.22) 78%,rgba(255,255,255,0.3) 100%);',
      '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
      '-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,',
      'linear-gradient(#000 0 0);mask-composite:exclude;padding:1px;}',

      /* soft key light falling across the glass */
      p + 'k{position:absolute;inset:0;pointer-events:none;z-index:2;',
      'background:linear-gradient(180deg,rgba(255,255,255,0.10) 0%,',
      'rgba(255,255,255,0.02) 18%,transparent 42%);}',

      /* the hero standing on something, rather than floating in void */
      p + 'fl{position:absolute;left:50%;pointer-events:none;',
      'transform:translateX(-50%);background:radial-gradient(ellipse 50% 50% at 50% 0%,',
      'rgba(139,147,255,0.10) 0%,rgba(139,147,255,0.03) 45%,transparent 72%);}',

      p + 'l{position:absolute;left:0;width:100%;text-align:center;pointer-events:none;',
      'will-change:transform,opacity;}',
      p + 'n{color:#fff;font-weight:500;letter-spacing:0.05em;line-height:1.15;}',
      p + 'c{font-family:var(--font-mono),"JetBrains Mono",monospace;',
      'color:rgba(139,147,255,0.55);letter-spacing:0.18em;margin-top:0.45em;}',

      p + 'o{position:absolute;inset:0;pointer-events:none;}',

      p + 'd{position:absolute;left:0;top:0;border-radius:50%;overflow:hidden;padding:0;',
      'background:#0b0b0b;border:1.5px solid rgba(255,255,255,0.20);cursor:pointer;',
      'pointer-events:auto;will-change:transform,opacity;appearance:none;',
      'transform-origin:50% 50%;}',
      p + 'd>img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}',
      p + 'd.on{border:2px solid #8b93ff;box-shadow:0 0 20px rgba(139,147,255,0.32);}',
      p + 'd:focus-visible{outline:2px solid #8b93ff;outline-offset:3px;}',

      p + 'v{position:absolute;inset:0;pointer-events:none;z-index:5;',
      'background:radial-gradient(ellipse 78% 68% at 50% 42%,transparent 55%,rgba(0,0,0,0.55) 100%);}',

      /* the native cursor is the parent page's business, not this module's */
      'html.nr-cursor-on ' + p + 'd{cursor:none;}'
    ].join('');
  }

  styleEl.textContent = buildCSS();
  document.head.appendChild(styleEl);
  root.appendChild(stage);

  /* --------------------------------------------------------------- assets */
  const thumbSrc = PRODUCTS.map((p) => THUMB + p.file + '.jpg');
  const heroSrc = PRODUCTS.map((p) => HERO + p.file + '.jpg');
  const heroReady = new Array(N).fill(false);
  const heroPending = new Array(N).fill(false);

  /* The hero always resolves to the large asset, at card size too. A 150px
     thumbnail is 2x upscaled inside a 144px frame on a retina panel, which is
     plainly soft — the bytes are not worth the quality. The thumbnails still
     back the orbit circles, which are genuinely tiny.

     Loading stays lazy and decoded-first: the small asset holds the frame
     until the large one is ready, so nothing ever flashes empty. */
  function wantHero(i) {
    if (heroReady[i] || heroPending[i]) return;
    heroPending[i] = true;
    const img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      heroReady[i] = true;
      /* If this is still the product on screen, upgrade it in place. */
      if (!destroyed && i === shown && front) front.src = heroSrc[i];
    };
    img.onerror = function () { heroPending[i] = false; };
    img.src = heroSrc[i];
  }

  function srcFor(i) {
    return heroReady[i] ? heroSrc[i] : thumbSrc[i];
  }

  /* ---------------------------------------------------------------- state */
  let W = 0;
  let H = 0;
  let active = false;
  let destroyed = false;

  let rotation = 0;
  let index = 0;
  let shown = -1;

  /* rotation tween */
  let rFrom = 0;
  let rTo = 0;
  let rT = 1;
  let rDur = 0.85;

  /* hero swap: 0 idle, 1 shrinking out, 2 popping in */
  let swap = 0;
  let swapT = 0;
  let front = heroA;
  let back = heroB;

  /* label swap */
  let labT = 1;

  /* pointer */
  let hovering = false;
  let px = 0;
  let hasPx = false;
  let sinceMove = 0;
  let idleHold = 0;
  let entrance = 0;

  const dots = [];
  let hoverDot = -1;

  /* -------------------------------------------------------------- geometry */
  const geo = {
    cx: 0, orbitY: 0, rx: 0, ry: 0,
    heroW: 0, heroH: 0, heroTop: 0,
    base: 0, idleScale: 0.6
  };

  function layout() {
    geo.cx = W / 2;
    geo.heroH = H * 0.46;
    geo.heroW = Math.min(geo.heroH * 0.80, W * 0.62);
    geo.heroTop = H * 0.05;
    /* Sunk far enough that the ring clearly continues out of frame, but not so
       far that a card-sized stage only ever shows two of the eight. */
    geo.orbitY = H * 0.95;
    geo.ry = H * 0.15;
    geo.rx = clamp(W * 0.33, 70, 320);
    geo.base = clamp(H * 0.13, 26, 64);
    geo.idleScale = 0.60;

    const radius = Math.round(Math.min(geo.heroW, geo.heroH) * 0.028) + 3;

    stage.style.setProperty('--r', radius + 'px');
    hero.style.width = geo.heroW + 'px';
    hero.style.height = geo.heroH + 'px';
    hero.style.top = geo.heroTop + 'px';
    hero.style.marginLeft = (-geo.heroW / 2) + 'px';
    hero.style.borderRadius = radius + 'px';
    rim.style.borderRadius = (radius + 1) + 'px';

    glow.style.width = (geo.heroW * 1.75) + 'px';
    glow.style.height = (geo.heroH * 1.4) + 'px';
    glow.style.top = (geo.heroTop + geo.heroH * 0.46) + 'px';

    floor.style.width = (geo.heroW * 1.5) + 'px';
    floor.style.height = (geo.heroH * 0.30) + 'px';
    floor.style.top = (geo.heroTop + geo.heroH * 0.94) + 'px';

    ring.style.width = (geo.rx * 2) + 'px';
    ring.style.height = (geo.ry * 2) + 'px';
    ring.style.left = geo.cx + 'px';
    ring.style.top = geo.orbitY + 'px';

    label.style.top = (geo.heroTop + geo.heroH + H * 0.035) + 'px';
    nameEl.style.fontSize = clamp(H * 0.052, 11, 21) + 'px';
    countEl.style.fontSize = clamp(H * 0.028, 8, 11) + 'px';

    for (let i = 0; i < dots.length; i++) {
      dots[i].style.width = geo.base + 'px';
      dots[i].style.height = geo.base + 'px';
      dots[i].style.marginLeft = (-geo.base / 2) + 'px';
      dots[i].style.marginTop = (-geo.base / 2) + 'px';
      dots[i].style.borderWidth = (geo.base < 34 ? 1 : 1.5) + 'px';
    }
  }

  /* ------------------------------------------------------------------ dots */
  function buildDots() {
    for (let i = 0; i < N; i++) {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = S + 'd';
      d.setAttribute('aria-label', PRODUCTS[i].name);
      d.tabIndex = -1;

      const img = document.createElement('img');
      img.src = thumbSrc[i];
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      d.appendChild(img);

      d.addEventListener('click', function (e) {
        e.preventDefault();
        select(i, 0.85);
      });
      d.addEventListener('pointerenter', function () { hoverDot = i; });
      d.addEventListener('pointerleave', function () { if (hoverDot === i) hoverDot = -1; });

      orbit.appendChild(d);
      dots.push(d);
    }
  }

  /* The ring spends most of its life parked between advances. Repainting eight
     transforms every frame for a stage that has not moved is the single most
     expensive thing this module could do in a grid of live previews, so a
     frame that would paint an identical result is skipped outright. */
  let lastRot = NaN;
  let lastEnt = NaN;
  let lastHover = -2;

  function paintDots(force) {
    if (!force &&
        rotation === lastRot &&
        entrance === lastEnt &&
        hoverDot === lastHover) {
      return;
    }
    lastRot = rotation;
    lastEnt = entrance;
    lastHover = hoverDot;

    for (let i = 0; i < N; i++) {
      const a = i * STEP + rotation - Math.PI / 2;
      const sin = Math.sin(a);
      const x = geo.cx + Math.cos(a) * geo.rx;
      const y = geo.orbitY + sin * geo.ry;

      /* depth runs 0 at twelve o'clock to 1 at the bottom of the ring */
      const depth = (sin + 1) / 2;
      const isActive = i === index;
      const near = 1 - Math.min(1, Math.abs(shortestDelta(a, -Math.PI / 2)) / STEP);

      let s = geo.idleScale + (1 - geo.idleScale) * near;
      s *= 1 - depth * 0.34;
      if (hoverDot === i) s *= 1.22;
      s *= entrance;

      const op = (isActive ? 1 : Math.max(0.18, 0.92 - depth * 0.78)) * entrance;

      const d = dots[i];
      d.style.transform =
        'translate3d(' + (Math.round(x * 10) / 10) + 'px,' +
        (Math.round((y + (1 - entrance) * geo.ry * 1.6) * 10) / 10) + 'px,0) scale(' +
        (Math.round(s * 1000) / 1000) + ')';
      d.style.opacity = Math.round(op * 100) / 100;
      /* z only reorders when a circle actually crosses another; writing it
         every frame costs a stacking recalc for nothing. */
      const z = Math.round(50 - sin * 40);
      if (z !== (d._z | 0)) {
        d._z = z;
        d.style.zIndex = z;
      }
      const on = isActive && near > 0.5;
      if (on !== (d.dataset.on === '1')) {
        d.dataset.on = on ? '1' : '0';
        d.classList.toggle('on', on);
      }
    }
  }

  /* ------------------------------------------------------------ hero swap */
  function showProduct(i, instant) {
    if (i === shown) return;
    shown = i;
    wantHero(i);
    /* The ring only ever moves to a neighbour, so warming both sides means the
       large asset is already decoded by the time it is needed and the holder
       image is never actually seen after the first product. */
    wantHero((i + 1) % N);
    wantHero((i - 1 + N) % N);

    if (instant) {
      front.src = srcFor(i);
      front.style.opacity = '1';
      back.style.opacity = '0';
      nameEl.textContent = PRODUCTS[i].name;
      countEl.textContent = pad(i + 1) + ' / ' + pad(N);
      swap = 0;
      labT = 1;
      return;
    }

    swap = 1;
    swapT = 0;
    labT = 0;
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function commitSwap() {
    /* Paint into the hidden layer, then cross the two, so a slow decode can
       never leave the frame empty. */
    back.src = srcFor(shown);
    const t = front;
    front = back;
    back = t;
    nameEl.textContent = PRODUCTS[shown].name;
    countEl.textContent = pad(shown + 1) + ' / ' + pad(N);
  }

  /* ------------------------------------------------------------- selection */
  function select(i, dur) {
    const target = rotationFor(i);
    rFrom = rotation;
    rTo = rotation + shortestDelta(rotation, target);
    rT = 0;
    rDur = dur || 0.85;
  }

  function snapToNearest(dur) {
    select(indexFor(rotation), dur);
  }

  /* --------------------------------------------------------------- pointer */
  function localX(e) {
    const r = stage.getBoundingClientRect();
    return e.clientX - r.left;
  }

  function onEnter(e) {
    if (!active || reduced) return;
    hovering = true;
    px = localX(e);
    hasPx = true;
    sinceMove = 0;
  }

  function onMove(e) {
    if (!active || reduced) return;
    const x = localX(e);
    if (!hovering) {
      hovering = true;
      px = x;
      hasPx = true;
      return;
    }
    if (hasPx) {
      /* Scrubbing the stage turns the ring. One stage width is a little over
         one full revolution, which keeps the gearing tight without making a
         small nudge fling it. */
      const dx = x - px;
      rotation -= (dx / Math.max(W, 1)) * TAU * 1.15;
      rT = 1;
    }
    px = x;
    hasPx = true;
    sinceMove = 0;
  }

  function onLeave(e) {
    if (e && e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    hovering = false;
    hasPx = false;
    hoverDot = -1;
    if (!reduced) snapToNearest(0.55);
  }

  if (!reduced) {
    stage.addEventListener('pointerenter', onEnter, { passive: true });
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerleave', onLeave, { passive: true });
  }

  /* ------------------------------------------------------------------- api */
  function resize(w, h) {
    if (destroyed) return;
    W = Math.max(1, Math.round(w || root.clientWidth || 1));
    H = Math.max(1, Math.round(h || root.clientHeight || 1));
    layout();
    /* Geometry moved under an unchanged rotation, so the dirty check would
       otherwise skip the one paint that matters. */
    paintDots(true);
  }

  function update(dt) {
    if (destroyed || reduced || !active) return;
    const d = Math.min(Math.max(dt, 0), 0.05);

    if (entrance < 1) {
      entrance = Math.min(1, entrance + d / 0.9);
    }

    /* Untouched, the ring keeps working through the catalogue on its own —
       a card in a grid must never read as a still. Any pointer takes over
       immediately and the auto-advance stands down. */
    if (!hovering) {
      idleHold += d;
      const wait = preview ? 2.4 : 4.2;
      if (rT >= 1 && idleHold > wait) {
        idleHold = 0;
        select(((index + 1) % N), 1.05);
      }
    } else {
      idleHold = 0;
      sinceMove += d;
      /* Let go of the dial and it settles onto the nearest detent. */
      if (rT >= 1 && sinceMove > 0.42) {
        sinceMove = -1e9;
        snapToNearest(0.5);
      }
    }

    if (rT < 1) {
      rT = Math.min(1, rT + d / rDur);
      rotation = rFrom + (rTo - rFrom) * easeInOutCubic(rT);
    }

    const nextIndex = indexFor(rotation);
    if (nextIndex !== index) index = nextIndex;
    if (index !== shown) showProduct(index, false);

    /* hero swap */
    if (swap === 1) {
      swapT += d / 0.22;
      if (swapT >= 1) {
        commitSwap();
        swap = 2;
        swapT = 0;
      } else {
        const t = swapT;
        hero.style.transform = 'scale(' + (1 - 0.12 * t) + ')';
        hero.style.opacity = String(1 - 0.65 * t);
      }
    } else if (swap === 2) {
      swapT += d / 0.55;
      const t = Math.min(1, swapT);
      const e = easeOutCubic(t);
      hero.style.transform = 'scale(' + (1.08 - 0.08 * e) + ')';
      hero.style.opacity = String(0.35 + 0.65 * e);
      front.style.opacity = String(e);
      back.style.opacity = String(1 - e);
      if (t >= 1) {
        swap = 0;
        hero.style.transform = 'scale(1)';
        hero.style.opacity = '1';
      }
    }

    if (labT < 1) {
      labT = Math.min(1, labT + d / 0.5);
      const e = easeOutBack(labT);
      label.style.opacity = String(Math.min(1, labT * 1.6));
      label.style.transform = 'translateY(' + ((1 - e) * 12) + 'px)';
    }

    paintDots();
  }

  /* The rise-from-underground only advances while update() is being called.
     A card that is mounted and then paused before it ever gets a frame — the
     grid does exactly that for anything offscreen — would otherwise be left
     holding the start of the entrance, which is an empty stage. Whenever the
     module stops receiving frames, resolve it to the composed state instead. */
  function settle() {
    entrance = 1;
    swap = 0;
    labT = 1;
    hero.style.transform = 'scale(1)';
    hero.style.opacity = '1';
    front.style.opacity = '1';
    back.style.opacity = '0';
    label.style.opacity = '1';
    label.style.transform = 'none';
    paintDots(true);
  }

  function activate() {
    if (destroyed) return;
    active = true;
  }

  function deactivate() {
    active = false;
    hovering = false;
    hasPx = false;
    hoverDot = -1;
    if (!destroyed && entrance < 1) settle();
  }

  function setPreview(next) {
    preview = !!next;
    /* Nothing to re-fetch — the hero is already the large asset either way.
       Only the geometry differs, and the orchestrator forces a resize. */
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    active = false;
    if (!reduced) {
      stage.removeEventListener('pointerenter', onEnter);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    }
    if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    if (stage.parentNode) stage.parentNode.removeChild(stage);
    dots.length = 0;
  }

  /* ------------------------------------------------------------------ boot */
  buildDots();
  resize(root.clientWidth, root.clientHeight);
  rotation = rotationFor(0);
  index = 0;
  showProduct(0, true);

  if (reduced) {
    /* A composed still, not a blank stage and not a half-played frame. */
    settle();
  } else {
    label.style.opacity = '0';
    hero.style.opacity = '0';
    hero.style.transform = 'scale(1.12)';
    /* the hero settles in from oversize as the ring rises from underground */
    swap = 2;
    swapT = 0;
    labT = 0;
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
