/* ═══════════════════════════════════════════════════════════════════
   OBLIQUE — Tilted Grid Gallery
   Eighteen prints on a coloured table. Each one keeps its own angle.

   Each card is three nested layers so no two features ever write the
   same transform:
     .card        absolute box, never transformed — ScrollTrigger reads it
     .card-drift  scroll parallax + velocity skew
     .card-pose   entrance / hover / expand

   The rule that makes collapse exact: a card's resting pose is ALWAYS
   { x:0, y:0, scale:1, rotation:tilt } on .card-pose. Expanding only
   writes a delta onto that, so collapsing is a literal return to zero.
   ═══════════════════════════════════════════════════════════════════ */

const CONFIG = {
  backgroundColor: "#1500E1",
  accentColor: "#ffffff",
  cardCount: 18,

  /* ── scatter ─────────────────────────────────────────────────────
     Change layoutSeed to re-roll the whole arrangement. Angles are
     drawn one per band across ±[rotationMin…rotationMax] and then
     shuffled, so every seed is guaranteed to give clearly distinct
     tilts with an even left/right lean — a flat random() happily
     hands you near-identical angles all leaning the same way, which
     reads as a bug rather than art direction.                        */
  layoutSeed: 8,
  rotationMin: 1.4, // no card is ever close enough to 0 to look accidental
  rotationMax: 7,
  jitter: 20, // ± px of positional noise per card

  cardAspect: 280 / 360, // portrait print
  expandedHeight: 0.55, // expanded card height, as a share of viewport height

  /* ── motion ───────────────────────────────────────────────────── */
  smooth: 0.105, // scroll ease, normalised to 60fps. lower is heavier, 1 = native
  wheelStep: 1, // wheel sensitivity multiplier
  parallax: 34, // ± px a card drifts against the scroll, scaled by depth
  skewMax: 2.6, // deg of shear at full scroll velocity
  marqueeSpeed: 54, // px per SECOND at rest

  items: [
    { image: null, tone: "#F2EDE3", mark: "#FF3B1F", year: "2026",
      title: "Meridian", category: "Branding",
      description: "A wordmark and type system for a cartography house that had outgrown its own map." },
    { image: null, tone: "#FF3B1F", mark: "#F7F2E8", year: "2025",
      title: "Halfmoon", category: "Art Direction",
      description: "Six weeks of studio photography for a furniture label that only sells at night." },
    { image: null, tone: "#111111", mark: "#D9FF3D", year: "2025",
      title: "Verso", category: "Typography",
      description: "A variable serif drawn for long-form reading on very bad screens." },
    { image: null, tone: "#D9FF3D", mark: "#111111", year: "2024",
      title: "Tilt", category: "Motion",
      description: "Title sequence and broadcast package for an independent film festival." },
    { image: null, tone: "#FF9EC4", mark: "#2B0A5E", year: "2024",
      title: "Cassette", category: "Identity",
      description: "Reviving a dormant record label without pretending the nineties never ended." },
    { image: null, tone: "#FFB627", mark: "#111111", year: "2023",
      title: "Foldout", category: "Editorial",
      description: "Four issues of a quarterly printed on paper thin enough to read through." },
    { image: null, tone: "#00E5A0", mark: "#0A2E22", year: "2022",
      title: "Signal", category: "Interaction",
      description: "An interface for reading seismic data that a geologist can use one-handed." },
    { image: null, tone: "#BFE3FF", mark: "#1500E1", year: "2019",
      title: "Northbound", category: "Packaging",
      description: "Structural packaging for a coffee roaster shipping to places without addresses." },
    { image: null, tone: "#7A1327", mark: "#FFC9C2", year: "2023",
      title: "Ember", category: "Campaign",
      description: "A winter campaign shot entirely by firelight, with no lighting rig on set." },
    { image: null, tone: "#E4C9A0", mark: "#4A2C12", year: "2021",
      title: "Quarry", category: "Print",
      description: "A stone merchant's catalogue, letterpressed onto paper made from its own dust." },
    { image: null, tone: "#0E7C86", mark: "#CFF6F2", year: "2022",
      title: "Tidewell", category: "Wayfinding",
      description: "Signage for a harbour that floods twice a day and reorganises itself each time." },
    { image: null, tone: "#C6B4FF", mark: "#17103A", year: "2020",
      title: "Nocturne", category: "Album Art",
      description: "Twelve sleeves for a piano series, each one darker than the last." },
    { image: null, tone: "#3B5F1E", mark: "#C9F24D", year: "2021",
      title: "Meadowline", category: "Environmental",
      description: "Trail markers for a wildflower reserve, legible at dusk and from a bicycle." },
    { image: null, tone: "#FF6B4A", mark: "#FFF1E2", year: "2024",
      title: "Solstice", category: "Exhibition",
      description: "A single-room show about daylight, hung so it changes hourly." },
    { image: null, tone: "#2E3440", mark: "#D8E1EC", year: "2020",
      title: "Ledger", category: "Data Design",
      description: "Annual reporting for a co-operative bank, rebuilt so members actually read it." },
    { image: null, tone: "#FF2D78", mark: "#FFEAF2", year: "2018",
      title: "Bombshell", category: "Music",
      description: "Tour identity for a band that changed its name three weeks before the first date." },
    { image: null, tone: "#C87E12", mark: "#FFF4DE", year: "2017",
      title: "Kiln", category: "Ceramics",
      description: "Marks, stamps and labels for a pottery that fires once a season." },
    { image: null, tone: "#EDEDE8", mark: "#1500E1", year: "2016",
      title: "Paperweight", category: "Stationery",
      description: "A stationery range for a law firm that wanted to feel less like a law firm." },
  ],
};

/* ═══ helpers ═══════════════════════════════════════════════════════ */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

/* deterministic PRNG — the same seed always rebuilds the same table */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toRgb = (hex) => {
  let h = String(hex).replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const relLum = (hex) =>
  toRgb(hex)
    .map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    })
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);

const contrast = (a, b) => {
  const la = relLum(a), lb = relLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/* pick whichever of near-black / white is legible on a given colour —
   this is what keeps the demo readable after a buyer swaps the palette */
const readableOn = (hex) =>
  contrast(hex, "#0a0a0a") >= contrast(hex, "#ffffff") ? "#0a0a0a" : "#ffffff";

/* ═══ scatter ═══════════════════════════════════════════════════════ */

function scatter(seed, n) {
  const rand = mulberry32(seed);
  const half = Math.ceil(n / 2);
  const span = (CONFIG.rotationMax - CONFIG.rotationMin) / half;
  const pad = span * 0.2; // keeps neighbouring bands from touching
  const tilts = [];

  for (let side = 0; side < 2; side++) {
    for (let b = 0; b < half; b++) {
      const lo = CONFIG.rotationMin + b * span + pad;
      const hi = CONFIG.rotationMin + (b + 1) * span - pad;
      tilts.push((lo + rand() * (hi - lo)) * (side ? 1 : -1));
    }
  }
  for (let i = tilts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tilts[i], tilts[j]] = [tilts[j], tilts[i]];
  }

  return Array.from({ length: n }, (_, i) => ({
    tilt: +tilts[i].toFixed(2),
    jx: (rand() * 2 - 1) * CONFIG.jitter,
    jy: (rand() * 2 - 1) * CONFIG.jitter,
    depth: 0.28 + rand() * 0.72, // how hard this print resists the scroll
  }));
}

/* ═══ state ═════════════════════════════════════════════════════════ */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const D = REDUCED ? 0.001 : 1; // global duration scale

const el = {};
const ITEMS = CONFIG.items.slice(0, CONFIG.cardCount);
const cards = [];
const byEl = new Map();

let expanded = null; // index of the open card, or null
let homing = null; // a card still travelling back to its resting pose
let tl = null; // the single live expand/collapse timeline
let dimmed = []; // the exact cards dimmed for this expand
let geom = null; // live expanded geometry
let lastPointer = { x: -1, y: -1 };
let gTop = 0; // the gallery's document offset, cached at layout

/* ═══ theme ═════════════════════════════════════════════════════════ */

function paintTheme() {
  const root = document.documentElement.style;
  root.setProperty("--bg", CONFIG.backgroundColor);
  root.setProperty("--accent", CONFIG.accentColor);
  root.setProperty("--on-accent", readableOn(CONFIG.accentColor));

  /* title in accent, or white if accent doesn't hold up on the bg */
  const titleColor =
    contrast(CONFIG.accentColor, CONFIG.backgroundColor) >= 3.5
      ? CONFIG.accentColor
      : contrast("#ffffff", CONFIG.backgroundColor) >= contrast("#0a0a0a", CONFIG.backgroundColor)
      ? "#ffffff"
      : "#0a0a0a";
  root.setProperty("--panel-title", titleColor);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", CONFIG.backgroundColor);
}

/* ═══ build ═════════════════════════════════════════════════════════ */

function build() {
  const pose = scatter(CONFIG.layoutSeed, ITEMS.length);
  const frag = document.createDocumentFragment();

  ITEMS.forEach((item, i) => {
    const n = String(i + 1).padStart(2, "0");
    const btn = document.createElement("button");
    btn.className = "card";
    btn.type = "button";
    btn.dataset.cursor = "grow";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", `${item.title}, ${item.category}. Open project.`);
    btn.style.setProperty("--tone", item.tone);
    btn.style.setProperty("--mark", item.mark);
    btn.style.setProperty("--tone-ink", readableOn(item.tone));

    const art = item.image
      ? `<img src="${esc(item.image)}" alt="${esc(item.title)}" />`
      : `<span class="card-motif m${(i % 18) + 1}"></span>`;

    btn.innerHTML =
      `<span class="card-drift"><span class="card-pose">` +
        `<span class="card-lift"></span>` +
        `<span class="card-print">` +
          `<span class="card-media">` +
            `<span class="card-frame">${art}</span>` +
            `<span class="card-wash"></span>` +
            `<span class="card-grain"></span>` +
            `<span class="card-num">${n}</span>` +
            `<span class="card-ghost">${esc(item.title)}</span>` +
          `</span>` +
          `<span class="card-cap">` +
            `<span class="card-cap-i">${n}</span>` +
            `<span class="card-cap-t">${esc(item.title)}</span>` +
            `<span class="card-cap-c">${esc(item.category)}</span>` +
          `</span>` +
        `</span>` +
      `</span></span>`;

    /* later cards stack over earlier ones, so overlaps read as a pile */
    const baseZ = 10 + i;
    btn.style.zIndex = baseZ;

    const c = {
      i, el: btn, item, baseZ,
      drift: btn.querySelector(".card-drift"),
      pose: btn.querySelector(".card-pose"),
      lift: btn.querySelector(".card-lift"),
      frame: btn.querySelector(".card-frame"),
      tilt: pose[i].tilt,
      jx: pose[i].jx,
      jy: pose[i].jy,
      depth: pose[i].depth,
      x: 0, y: 0, w: 0, h: 0,
      driftY: 0,
      landed: false,
    };
    c.setY = gsap.quickSetter(c.drift, "y", "px");
    c.setSkew = gsap.quickSetter(c.drift, "skewY", "deg");

    cards.push(c);
    byEl.set(btn, c);
    frag.appendChild(btn);
  });

  el.gallery.appendChild(frag);
  buildMarquee();
}

function buildMarquee() {
  const words = ["Selected commissions", "Eighteen prints", "Nothing here is straight", "Archive 2016—2026"];
  let html = "";
  for (let r = 0; r < 6; r++) {
    words.forEach((w) => {
      html += `<span class="marquee-item">${esc(w)}<i class="marquee-dot"></i></span>`;
    });
  }
  el.marquee.innerHTML = html + html; // doubled — the loop wraps at half width
}

/* ═══ layout ════════════════════════════════════════════════════════ */

function tier() {
  const w = window.innerWidth;
  if (w >= 1600) return { cols: 4, cardW: 268, gapX: 74, gapY: 74, drift: [0, 112, 44, 150], jf: 1 };
  if (w >= 1360) return { cols: 4, cardW: 232, gapX: 58, gapY: 64, drift: [0, 96, 38, 128], jf: 1 };
  if (w >= 1100) return { cols: 3, cardW: 262, gapX: 68, gapY: 64, drift: [0, 106, 42], jf: 1 };
  if (w >= 860)  return { cols: 3, cardW: 212, gapX: 50, gapY: 56, drift: [0, 84, 32], jf: 0.85 };
  if (w >= 620)  return { cols: 2, cardW: 232, gapX: 48, gapY: 56, drift: [0, 86], jf: 0.8 };
  return { cols: 1, cardW: Math.min(272, w - 124), gapX: 0, gapY: 40, drift: [0], jf: 0.5 };
}

function layout() {
  const t = tier();
  const W = el.gallery.clientWidth;
  const cardW = Math.round(t.cardW);
  const cardH = Math.round(cardW / CONFIG.cardAspect);

  /* how far a corner swings past the box at max tilt — the safe margin */
  const over = Math.ceil((cardW * 0.9925 + cardH * 0.1219 - cardW) / 2) + 4;

  const gridW = t.cols * cardW + (t.cols - 1) * t.gapX;
  const originX = (W - gridW) / 2;

  /* a final row that doesn't fill its columns gets centred, so the grid
     ends on a deliberate note instead of a hole where a card isn't */
  const lastRow = Math.floor((cards.length - 1) / t.cols);
  const lastCount = cards.length - lastRow * t.cols;
  const lastNudge = ((t.cols - lastCount) * (cardW + t.gapX)) / 2;

  const padTop = clamp(window.innerHeight * 0.05, 16, 64);
  let bottom = 0;

  cards.forEach((c, i) => {
    const col = i % t.cols;
    const row = Math.floor(i / t.cols);
    /* a single column would stack dead straight — swing it off-axis */
    const swing =
      (t.cols === 1 ? (row % 2 ? 1 : -1) * 12 : 0) + (row === lastRow ? lastNudge : 0);

    c.w = cardW;
    c.h = cardH;
    c.x = Math.round(
      clamp(
        originX + col * (cardW + t.gapX) + c.jx * t.jf + swing,
        over,
        Math.max(over, W - cardW - over)
      )
    );
    c.y = Math.round(padTop + row * (cardH + t.gapY) + (t.drift[col] || 0) + c.jy * t.jf);

    c.el.style.width = cardW + "px";
    c.el.style.height = cardH + "px";
    c.el.style.left = c.x + "px";
    c.el.style.top = c.y + "px";

    bottom = Math.max(bottom, c.y + cardH);
  });

  el.gallery.style.height = Math.round(bottom + over + 24) + "px";
  gTop = el.gallery.getBoundingClientRect().top + window.scrollY;
  el.marqW = el.marquee.scrollWidth / 2;
}

/* ═══ entrance ══════════════════════════════════════════════════════ */

function intro() {
  if (REDUCED) {
    gsap.set(".hero-word, .hero-eyebrow, .hero-sub, .hero-cue, .mast, .marquee", { opacity: 1, y: 0 });
    return;
  }
  gsap.set(".hero-word", { yPercent: 108 });
  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .to(".mast", { opacity: 1, duration: 0.8 }, 0.1)
    .from(".hero-eyebrow", { opacity: 0, y: 14, duration: 0.7 }, 0.2)
    .to(".hero-word", { yPercent: 0, duration: 1.05, stagger: 0.075 }, 0.28)
    .from(".hero-sub", { opacity: 0, y: 18, duration: 0.8 }, 0.72)
    .from(".hero-cue", { opacity: 0, duration: 0.8 }, 0.95)
    .to(".marquee", { opacity: 1, duration: 0.8 }, 0.8);
}

function landTween(list) {
  return gsap.to(
    list.map((c) => c.pose),
    {
      opacity: 1,
      y: 0,
      scale: 1,
      rotation: (i) => list[i].tilt,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.06,
    }
  );
}

function entrance() {
  if (REDUCED) {
    cards.forEach((c) => {
      gsap.set(c.pose, { opacity: 1, x: 0, y: 0, scale: 1, rotation: c.tilt });
      c.landed = true;
    });
    return;
  }

  /* flat and low on arrival — it settles INTO its tilt */
  gsap.set(cards.map((c) => c.pose), { opacity: 0, y: 60, scale: 0.94, rotation: 0 });

  /* batch, so cards crossing the line together stagger together.
     `once` is deliberately NOT used: it kills each trigger the moment
     it toggles, which can outrun batch's debounced callback and leave
     a card marked un-landed. The landed flag is the guard instead. */
  ScrollTrigger.batch(
    cards.map((c) => c.el),
    {
      start: "top 85%",
      onEnter: (batch) => {
        const fresh = batch.map((t) => byEl.get(t)).filter((c) => !c.landed);
        if (!fresh.length) return;
        fresh.forEach((c) => (c.landed = true));
        landTween(fresh);
      },
    }
  );

  ScrollTrigger.refresh();
  ensureLanded();
}

/* anything already sitting above the line — a reload part-way down the
   page, a resize that pulls cards up — still has to become visible */
function ensureLanded() {
  const late = cards.filter(
    (c) => !c.landed && c.el.getBoundingClientRect().top < window.innerHeight * 0.85
  );
  if (!late.length) return;
  late.forEach((c) => (c.landed = true));
  landTween(late);
}

/* used when navigating to a card that hasn't scrolled into view yet */
function landNow(c) {
  if (c.landed) return;
  c.landed = true;
  gsap.set(c.pose, { opacity: 1, x: 0, y: 0, scale: 1, rotation: c.tilt });
}

/* ═══ smooth scroll ═════════════════════════════════════════════════
   Native scroll stays the single source of truth — we only ease the
   value we hand to window.scrollTo. That keeps every getBoundingClientRect
   honest, so ScrollTrigger and the expand maths need no special casing. */

const scroller = { on: false, target: 0, current: 0, locked: false };
let scrollNow = 0;
let vel = 0;
let marqX = 0;

const maxScroll = () =>
  Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

function initSmooth() {
  scrollNow = scroller.current = scroller.target = window.scrollY;
  /* coarse pointers keep their native momentum — it's better than ours */
  if (REDUCED || CONFIG.smooth >= 1 || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("scroll", () => { scrollNow = window.scrollY; }, { passive: true });
    return;
  }
  scroller.on = true;

  window.addEventListener("wheel", (e) => {
    if (scroller.locked) return;
    e.preventDefault();
    /* deltaMode differs per device: pixels, lines, or pages. Normalise,
       then cap one event — a mouse notch is ~100px and a trackpad sends
       many small deltas, so anything past ~240 is a driver spike that
       would teleport the page. */
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const step = clamp(e.deltaY * unit * CONFIG.wheelStep, -240, 240);
    scroller.target = clamp(scroller.target + step, 0, maxScroll());
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (scroller.locked || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    const vh = window.innerHeight;
    const step = { ArrowDown: 90, ArrowUp: -90, PageDown: vh * 0.9, PageUp: -vh * 0.9 };
    let to = null;
    if (e.key in step) to = scroller.target + step[e.key];
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = maxScroll();
    else if (e.key === " " && tag !== "button") to = scroller.target + vh * 0.9;
    if (to === null) return;
    e.preventDefault();
    scroller.target = clamp(to, 0, maxScroll());
  });

  /* scrollbar drags, anchors and find-in-page bypass us — resync */
  window.addEventListener("scroll", () => {
    if (Math.abs(window.scrollY - scroller.current) > 2.5) {
      scroller.current = scroller.target = scrollNow = window.scrollY;
    }
  }, { passive: true });
}

/* one place writes drift, so it can also be driven synchronously when
   a jump has to land before the next frame */
function driftAll(at, skew) {
  const vh = window.innerHeight;
  const mid = at + vh / 2;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const rel = clamp((gTop + c.y + c.h / 2 - mid) / vh, -1.4, 1.4);
    c.driftY = rel * c.depth * CONFIG.parallax;
    c.setY(c.driftY);
    c.setSkew(skew);
  }
}

/* Everything here is time-based, not frame-based. A per-frame lerp runs
   twice as fast on a 120Hz display as on 60Hz — the same site would feel
   noticeably snappier on a ProMotion Mac than on an external monitor.
   Correcting by delta time makes the feel identical on any refresh rate. */
let lastSkew = 0;

function frame(_t, dtMs) {
  const dt = Math.min(dtMs || 16.7, 50) / 1000; // seconds; clamped so a
  const f = dt * 60;                            // tab-switch can't lurch
  const prev = scrollNow;

  if (scroller.on && !scroller.locked) {
    /* Self-heal: if the real scroll has moved without us (scrollbar drag,
       anchor jump, devtools, or a scroll event we simply never received)
       adopt it rather than yanking the page back. Our own scrollTo lands
       within a pixel, so this can't false-trigger on us. */
    if (Math.abs(window.scrollY - scroller.current) > 2.5) {
      scroller.current = scroller.target = window.scrollY;
    }
    const d = scroller.target - scroller.current;
    if (Math.abs(d) > 0.08) {
      /* the 60fps-equivalent of `current += d * smooth`, at any dt */
      scroller.current += d * (1 - Math.pow(1 - CONFIG.smooth, f));
      window.scrollTo(0, scroller.current);
    } else if (d !== 0) {
      scroller.current = scroller.target;
      window.scrollTo(0, scroller.current);
    }
    scrollNow = scroller.current;
  } else if (!scroller.on) {
    scrollNow = window.scrollY;
  }

  /* velocity in px per second, so shear reads the same at any frame rate */
  const raw = (scrollNow - prev) / dt;
  vel += (raw - vel) * (1 - Math.pow(0.86, f));
  const skew = expanded !== null ? 0 : clamp(vel * 0.00125, -CONFIG.skewMax, CONFIG.skewMax);

  /* eighteen cards is cheap, but not free — skip the write when the page
     is sitting still and the shear has already relaxed */
  const moved = Math.abs(scrollNow - prev) > 0.01;
  if (moved || Math.abs(skew - lastSkew) > 0.001) {
    driftAll(scrollNow, skew);
    lastSkew = skew;
  }

  /* the hero hangs back a little as the page leaves it */
  if (moved && scrollNow < window.innerHeight * 1.3) {
    el.setHero(scrollNow * 0.22);
  }

  /* the band runs on its own, and the scroll shoves it along */
  if (el.marqW > 0) {
    marqX = (marqX + (CONFIG.marqueeSpeed + vel * 0.55) * dt) % el.marqW;
    if (marqX < 0) marqX += el.marqW;
    el.setMarq(-marqX);
  }

  if (scroller.on) ScrollTrigger.update();
}

/* ═══ hover ═════════════════════════════════════════════════════════ */

function hover(c, on) {
  if (expanded !== null || homing || !c.landed) return;
  gsap.to(c.pose, {
    rotation: on ? c.tilt * 0.4 : c.tilt, // straightens by 60%, never fully flat
    scale: on ? 1.03 : 1,
    duration: 0.4,
    ease: "power2.out",
    overwrite: "auto",
  });
  gsap.to(c.lift, { opacity: on ? 1 : 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
  gsap.to(c.frame, { scale: on ? 1.06 : 1, duration: 0.6, ease: "power2.out", overwrite: "auto" });
  c.el.style.zIndex = on ? 30 : c.baseZ;
}

/* ═══ expanded geometry ═════════════════════════════════════════════ */

/* Sizing has to know two things flat percentages don't: how tall the
   panel actually is once filled, and how big the card already is in the
   grid. Without the second, a short viewport "expands" a card to
   smaller than it started. Call only after fillPanel(). */
function measure(c) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const A = CONFIG.cardAspect;
  const stacked = vw < 900;

  if (stacked) {
    const margin = 20;
    const gap = 26;
    const panelW = vw - margin * 2;

    el.panel.classList.add("is-below");
    el.panel.style.width = panelW + "px";
    const ph = el.panel.offsetHeight;

    let top = Math.max(margin + 30, vh * 0.06);
    let h = Math.max(vh - top - ph - gap - margin, c.h * 1.05);
    let w = h * A;
    if (w > vw - margin * 2) { w = vw - margin * 2; h = w / A; }
    top = Math.max(12, Math.min(top, vh - h - gap - ph - 12));

    return { stacked, w, h, left: (vw - w) / 2, top,
             panelLeft: margin, panelTop: top + h + gap, panelW };
  }

  const margin = clamp(vw * 0.05, 28, 72);
  const gutter = clamp(vw * 0.045, 30, 76);
  const panelW = clamp(vw * 0.29, 290, 430);

  /* 55% of viewport height, but never so small that opening a card
     reads as shrinking it */
  let h = clamp(vh * CONFIG.expandedHeight, c.h * 1.25, vh - 88);
  let w = h * A;

  const room = vw - margin * 2 - gutter - panelW;
  if (w > room) { w = room; h = w / A; }

  const left = (vw - (w + gutter + panelW)) / 2;
  return { stacked, w, h, left, top: (vh - h) / 2,
           panelLeft: left + w + gutter, panelTop: 0, panelW };
}

function fillPanel(item, i) {
  el.panelTag.textContent = item.category;
  el.panelTitle.textContent = item.title;
  el.panelDesc.textContent = item.description;
  el.panelIdx.textContent = `${String(i + 1).padStart(2, "0")} / ${String(ITEMS.length).padStart(2, "0")}`;
  el.panelYear.textContent = item.year || "";
}

function placePanel(g) {
  el.panel.classList.toggle("is-below", g.stacked);
  el.panel.style.width = Math.round(g.panelW) + "px";
  el.panel.style.left = Math.round(g.panelLeft) + "px";
  el.panel.style.top = "0px";

  /* measured while still hidden — visibility:hidden keeps layout intact */
  const ph = el.panel.offsetHeight;
  const top = g.stacked
    ? g.panelTop
    : clamp(g.top + (g.h - ph) / 2, 88, Math.max(88, window.innerHeight - ph - 20));
  el.panel.style.top = Math.round(top) + "px";
}

/* the delta that carries a card from its resting box to the open slot.
   driftY is part of where the card actually is, so it has to be in here */
function delta(c, g) {
  const gr = el.gallery.getBoundingClientRect();
  return {
    x: g.left + g.w / 2 - (gr.left + c.x + c.w / 2),
    y: g.top + g.h / 2 - (gr.top + c.y + c.h / 2 + c.driftY),
    scale: g.h / c.h,
  };
}

function lockScroll(on) {
  scroller.locked = on;
  document.body.style.overflow = on ? "hidden" : "";
  if (!on) scroller.current = scroller.target = window.scrollY;
}

/* Bring a card's resting slot into view without the open card appearing
   to move: jump the scroll, re-drift, then re-derive the delta — the
   same trick reflow() uses for a resize mid-expand. */
function syncScroll(target) {
  const want = clamp(gTop + target.y + target.h / 2 - window.innerHeight / 2, 0, maxScroll());
  if (Math.abs(want - window.scrollY) < 1) return;

  const wasLocked = scroller.locked;
  if (wasLocked) document.body.style.overflow = "";
  window.scrollTo(0, want);
  scroller.current = scroller.target = scrollNow = window.scrollY;
  if (wasLocked) document.body.style.overflow = "hidden";

  driftAll(scrollNow, 0);
  if (expanded !== null && geom) {
    const c = cards[expanded];
    const d = delta(c, geom);
    gsap.set(c.pose, { x: d.x, y: d.y, scale: d.scale, rotation: 0 });
  }
}

/* ═══ expand ════════════════════════════════════════════════════════ */

function expand(i) {
  if (expanded !== null) return; // never two at once
  const c = cards[i];
  if (!c.landed) return;

  /* every tween below lands on an absolute value, so cutting off an
     in-flight collapse is safe — the motion just changes its mind */
  if (tl) tl.kill();
  const returning = homing && homing !== c ? homing : null;
  homing = null;
  expanded = i;

  lockScroll(true);
  fillPanel(c.item, i);
  geom = measure(c);
  placePanel(geom);
  const d = delta(c, geom);

  /* only cards that have actually landed may be dimmed — touching one
     that hasn't entered yet would pop it on screen without its intro */
  dimmed = cards.filter((o) => o !== c && o.landed && o !== returning);
  cards.forEach((o) => { if (o !== c) o.el.style.pointerEvents = "none"; });

  gsap.killTweensOf([c.pose, c.frame, c.lift]);
  gsap.set(c.el, { zIndex: 60 });
  c.el.setAttribute("aria-expanded", "true");
  if (returning) returning.el.setAttribute("aria-expanded", "false");
  el.panel.setAttribute("aria-hidden", "false");
  el.panel.classList.add("is-on");
  el.scrim.classList.add("is-on");
  el.mastCount.textContent = String(i + 1).padStart(2, "0");

  const lines = el.panel.querySelectorAll(".panel-body > *");

  tl = gsap.timeline({ onComplete: () => { tl = null; } });
  /* opacity:1 matters when this card was itself dimmed a moment ago —
     expanding out of an interrupted collapse would otherwise leave the
     open card sitting at 0.15 */
  tl.to(c.pose, { x: d.x, y: d.y, scale: d.scale, rotation: 0, opacity: 1,
                  duration: 0.6 * D, ease: "power3.inOut" }, 0)
    .to(c.drift, { skewY: 0, duration: 0.4 * D, ease: "power2.out" }, 0)
    .to(c.frame, { scale: 1, duration: 0.6 * D, ease: "power3.inOut" }, 0)
    .to(c.lift, { opacity: 1, duration: 0.6 * D, ease: "power3.inOut" }, 0)
    .to(dimmed.map((o) => o.pose), { opacity: 0.15, scale: 0.96, duration: 0.4 * D, ease: "power2.out" }, 0)
    .to(el.scrim, { opacity: 1, duration: 0.45 * D, ease: "power2.out" }, 0)
    .to(el.chrome, { opacity: 0, duration: 0.4 * D, ease: "power2.out" }, 0)
    .to(el.panelClose, { opacity: 0.62, duration: 0.4 * D }, 0.3 * D)
    .fromTo(
      el.panel,
      { opacity: 0, x: geom.stacked ? 0 : 30, y: geom.stacked ? 24 : 0 },
      { opacity: 1, x: 0, y: 0, duration: 0.5 * D, ease: "power3.out" },
      0.2 * D
    )
    .fromTo(
      lines,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5 * D, ease: "power3.out", stagger: 0.055 * D },
      0.26 * D
    );

  /* a card abandoned mid-collapse folds its trip home into this same
     timeline, so an impatient click still reads as one motion */
  if (returning) {
    dimmed.push(returning);
    tl.to(returning.pose, {
        x: 0, y: 0, scale: 0.96, rotation: returning.tilt, opacity: 0.15,
        duration: 0.5 * D, ease: "power3.inOut",
        onComplete: () => { returning.el.style.zIndex = returning.baseZ; },
      }, 0)
      .to(returning.lift, { opacity: 0, duration: 0.4 * D }, 0)
      .to(returning.frame, { scale: 1, duration: 0.4 * D }, 0);
  }

  if (!REDUCED) gsap.to(el.cursorDot, { width: 10, height: 10, duration: 0.3, ease: "power3.out" });
}

/* ═══ collapse ══════════════════════════════════════════════════════ */

function collapse() {
  if (expanded === null) return; // interrupting an expand is fine — this isn't
  const c = cards[expanded];
  const g = geom;

  if (tl) tl.kill();
  expanded = null;
  homing = c; // blocks hover until it's actually home

  const lines = el.panel.querySelectorAll(".panel-body > *");

  tl = gsap.timeline({
    onComplete() {
      c.el.style.zIndex = c.baseZ;
      c.el.setAttribute("aria-expanded", "false");
      el.panel.setAttribute("aria-hidden", "true");
      el.panel.classList.remove("is-on");
      el.scrim.classList.remove("is-on");
      el.mastCount.textContent = String(ITEMS.length).padStart(2, "0");
      cards.forEach((o) => (o.el.style.pointerEvents = ""));
      lockScroll(false);
      gsap.set(lines, { clearProps: "opacity,transform" });
      homing = null;
      tl = null;
      geom = null;
      dimmed = [];
      resumeHover();
    },
  });

  /* the panel leaves first, then the card follows it home — offset by
     0.08s so the two read as one reversal instead of two events */
  tl.to(el.panel, { opacity: 0, x: g && !g.stacked ? 30 : 0, y: g && g.stacked ? 24 : 0,
                    duration: 0.28 * D, ease: "power2.in" }, 0)
    .to(el.panelClose, { opacity: 0, duration: 0.22 * D }, 0)
    .to(c.pose, { x: 0, y: 0, scale: 1, rotation: c.tilt, duration: 0.6 * D, ease: "power3.inOut" }, 0.08 * D)
    .to(c.lift, { opacity: 0, duration: 0.5 * D, ease: "power2.out" }, 0.08 * D)
    .to(dimmed.map((o) => o.pose), { opacity: 1, scale: 1, duration: 0.45 * D, ease: "power2.out" }, 0.14 * D)
    .to(el.scrim, { opacity: 0, duration: 0.4 * D, ease: "power2.out" }, 0.14 * D)
    .to(el.chrome, { opacity: (i, t) => t._rest, duration: 0.45 * D, ease: "power2.out" }, 0.14 * D);
}

/* walk to the neighbouring print without closing first */
function stepTo(dir) {
  if (expanded === null) return;
  const next = (expanded + dir + cards.length) % cards.length;
  const c = cards[next];
  landNow(c);
  syncScroll(c); // bring its slot into view first, so nothing flies in from three screens away
  collapse();
  expand(next);
}

/* after closing, honour whatever the pointer is actually sitting on */
function resumeHover() {
  if (lastPointer.x < 0 || expanded !== null) return;
  const under = document.elementFromPoint(lastPointer.x, lastPointer.y);
  const card = under && under.closest(".card");
  if (card && byEl.has(card)) hover(byEl.get(card), true);
}

/* ═══ cursor ════════════════════════════════════════════════════════ */

function initCursor() {
  if (REDUCED || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.body.classList.add("has-cursor");

  const qx = gsap.quickTo(el.cursor, "x", { duration: 0.15, ease: "power3.out" });
  const qy = gsap.quickTo(el.cursor, "y", { duration: 0.15, ease: "power3.out" });
  let seen = false;

  window.addEventListener("pointermove", (e) => {
    qx(e.clientX);
    qy(e.clientY);
    if (!seen) {
      seen = true;
      gsap.set(el.cursor, { x: e.clientX, y: e.clientY });
      gsap.to(el.cursor, { opacity: 1, duration: 0.3 });
    }
  });

  const HOT = "[data-cursor], .panel-close, .panel-arrow, .mast-brand";
  document.addEventListener("pointerover", (e) => {
    if (!e.target.closest(HOT)) return;
    gsap.to(el.cursorDot, { width: 16, height: 16, duration: 0.3, ease: "power3.out" });
  });
  document.addEventListener("pointerout", (e) => {
    const t = e.target.closest(HOT);
    if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
    gsap.to(el.cursorDot, { width: 10, height: 10, duration: 0.3, ease: "power3.out" });
  });
}

/* ═══ wiring ════════════════════════════════════════════════════════ */

function bind() {
  cards.forEach((c) => {
    c.el.addEventListener("click", () => (expanded === c.i ? collapse() : expand(c.i)));
    c.el.addEventListener("pointerenter", () => hover(c, true));
    c.el.addEventListener("pointerleave", () => hover(c, false));
    c.el.addEventListener("focus", () => hover(c, true));
    c.el.addEventListener("blur", () => hover(c, false));
  });

  el.scrim.addEventListener("click", collapse);
  el.panelClose.addEventListener("click", collapse);
  el.panelPrev.addEventListener("click", () => stepTo(-1));
  el.panelNext.addEventListener("click", () => stepTo(1));

  const fade = (node, to) => () => {
    if (expanded !== null) gsap.to(node, { opacity: to, duration: 0.25, ease: "power2.out" });
  };
  el.panelClose.addEventListener("pointerenter", fade(el.panelClose, 1));
  el.panelClose.addEventListener("pointerleave", fade(el.panelClose, 0.62));

  [el.panelPrev, el.panelNext].forEach((b) => {
    b.addEventListener("pointerenter", () => gsap.to(b, { scale: 1.12, duration: 0.3, ease: "power2.out" }));
    b.addEventListener("pointerleave", () => gsap.to(b, { scale: 1, duration: 0.3, ease: "power2.out" }));
  });

  window.addEventListener("keydown", (e) => {
    if (expanded === null) return;
    if (e.key === "Escape") {
      const card = cards[expanded].el;
      collapse();
      card.focus({ preventScroll: true });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepTo(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepTo(-1);
    }
  });

  window.addEventListener("pointermove", (e) => {
    lastPointer = { x: e.clientX, y: e.clientY };
  });

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(reflow, 140);
  });
}

/* a resize mid-expand re-derives the delta from the new resting box,
   so the card stays put on screen and still collapses home exactly */
function reflow() {
  layout();
  /* the grid re-tiers on resize and the page can get shorter — clamp or
     we're left parked past the new bottom */
  scroller.current = scroller.target = scrollNow = clamp(window.scrollY, 0, maxScroll());
  if (scroller.on) window.scrollTo(0, scrollNow);
  driftAll(scrollNow, 0);
  if (expanded !== null) {
    const c = cards[expanded];
    geom = measure(c);
    placePanel(geom);
    const d = delta(c, geom);
    gsap.set(c.pose, { x: d.x, y: d.y, scale: d.scale, rotation: 0 });
  }
  if (!REDUCED) {
    ScrollTrigger.refresh();
    ensureLanded();
  }
}

/* ═══ boot ══════════════════════════════════════════════════════════ */

function init() {
  [
    "gallery", "cursor", "cursorDot", "scrim", "panel", "panelClose",
    "panelTag", "panelTitle", "panelDesc", "panelIdx", "panelYear", "mastCount",
    "panelPrev", "panelNext",
  ].forEach((id) => (el[id] = document.getElementById(id)));
  el.marquee = document.getElementById("marqueeTrack");

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  if (!REDUCED) gsap.registerPlugin(ScrollTrigger);
  gsap.set(el.panelClose, { opacity: 0 });
  if (!REDUCED) gsap.set(".mast, .marquee", { opacity: 0 });

  /* page furniture the panel would otherwise read straight through —
     the panel is deliberately transparent, so anything behind it has to
     get out of the way rather than be covered up */
  el.chrome = Array.from(document.querySelectorAll(".hero, .marquee, .colophon, .corner"));
  el.chrome.forEach((n) => (n._rest = parseFloat(getComputedStyle(n).opacity) || 1));
  el.setHero = gsap.quickSetter(document.getElementById("heroShift"), "y", "px");
  el.setMarq = gsap.quickSetter(document.getElementById("marqueeTrack"), "x", "px");
  el.marqW = 0;

  paintTheme();
  build();
  layout();
  el.mastCount.textContent = String(ITEMS.length).padStart(2, "0");
  document.querySelector(".mast-count i").textContent = `/ ${String(ITEMS.length).padStart(2, "0")}`;

  entrance();
  intro();
  initSmooth();
  initCursor();
  bind();
  /* reduced motion means no parallax, no shear, no marquee drift and no
     eased scrolling — the layout stays exactly as it is, it just stops
     moving on its own. initSmooth() keeps scrollNow current without it. */
  if (!REDUCED) gsap.ticker.add(frame);

  /* web fonts land after init and change the hero's height, which moves
     every card — recompute or the entrance triggers fire at the wrong
     scroll positions (or never) */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      layout();
      if (!REDUCED) {
        ScrollTrigger.refresh();
        ensureLanded();
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
