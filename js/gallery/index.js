/* ==========================================================================
   NULLRIFT — GALLERY ORCHESTRATOR
   Owns the single RAF, lazy-mounts each exhibit module on approach, pauses
   anything offscreen, and drives the library chrome (entrance, hover
   ownership, progress rail, per-frame status).
   Every exhibit module is an ES module with a default export:
     create({ root, reduced, preview })
       -> { setPreview, resize, update, activate, deactivate, destroy }
   ========================================================================== */

/* gallery.html cache-busts this file with ?v=N, but a relative specifier drops
   the query when it resolves — so every exhibit module and the prompt table
   would keep loading from cache after an edit. Carry the version across, and
   one bump in the markup invalidates the whole graph. */
const VERSION = new URL(import.meta.url).search;

function versioned(spec) {
  const url = new URL(spec, import.meta.url);
  if (VERSION && !url.search) url.search = VERSION;
  return url.href;
}

/* Loaded eagerly, but through the versioned URL, so it cannot go stale. */
const promptsReady = import(versioned('./prompts.js'));
let prompts = null;
promptsReady.then(function (m) { prompts = m; }, function () { prompts = null; });

/* ==========================================================================
   COMMERCE CONFIG — the only block you edit to go live.

   CONTACT_MAIL   the address the pricing section writes to.
   CHECKOUT       one hosted-checkout URL per tier. Paste the payment links
                  from whichever processor you use (Stripe Payment Links,
                  Gumroad, Lemon Squeezy, Paddle — all give you a plain URL).

   A tier left blank renders as visibly disabled rather than as a buy button
   that goes nowhere. Never ship a live-looking checkout that cannot take
   money — that is how you lose a customer permanently.
   ========================================================================== */
const CONTACT_MAIL = 'hello@nullrift.design';

const CHECKOUT = {
  monthly: '',
  pro: '',
  team: '',
  studio: ''
};

const html = document.documentElement;
html.classList.add('g-js');

const reduced = window.NR
  ? !!window.NR.prefersReducedMotion
  : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MOUNT_MARGIN = '30% 0px 30% 0px';
const MAX_DT = 0.05;

/* Only one exhibit can be under the cursor. That one is worth every frame; the
   rest are drifting on ambient loops where half the frame rate is invisible.
   Splitting the two is what keeps a grid of live WebGL inside the 60fps budget
   without dropping resolution — which is the thing you can actually see. */
const IDLE_STEP = 1 / 32;

/* ---------------------------------------------------------------- registry */

class Exhibit {
  constructor(el) {
    this.el = el;
    this.id = el.dataset.exhibit;
    this.specifier = el.dataset.module;
    this.stage = el.querySelector('[data-stage]');
    this.frame = el.querySelector('.exhibit__frame');
    this.statusEl = el.querySelector('[data-mount-status]');
    this.instance = null;
    this.state = 'idle';
    this.active = false;
    this.pendingSize = null;
    this.lastW = 0;
    this.lastH = 0;
    this.acc = 0;
    /* Geometry differs between a card and full page; resolution no longer does.
       Modules read this to size their element counts, not their framebuffers. */
    this.preview = true;
  }

  /* Modules that expose setPreview re-derive their own resolution and element
     counts; the forced measure below is what actually applies the new budget. */
  setPreview(next) {
    if (this.preview === next) return;
    this.preview = next;
    if (!this.instance) return;
    if (typeof this.instance.setPreview === 'function') {
      this.guard(() => this.instance.setPreview(next));
      this.measure(true);
    }
  }

  setStatus(label, state) {
    if (!this.statusEl) return;
    this.statusEl.textContent = label;
    this.statusEl.dataset.state = state;
  }

  async mount() {
    if (this.state !== 'idle') return;
    this.state = 'mounting';
    this.setStatus('BOOT', 'loading');
    try {
      const mod = await import(versioned(this.specifier));
      const factory = mod && (mod.default || mod.create);
      if (typeof factory !== 'function') throw new Error('no factory');
      this.instance = factory({ root: this.stage, reduced, preview: this.preview });
      this.state = 'ready';
      this.measure(true);
      if (this.active) this.resume();
      else this.setStatus(reduced ? 'STATIC' : 'READY', 'ready');
    } catch (err) {
      this.state = 'failed';
      this.instance = null;
      this.setStatus('UNAVAILABLE', 'failed');
    }
  }

  measure(force) {
    if (!this.instance || typeof this.instance.resize !== 'function') return;
    const rect = this.stage.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (!w || !h) return;
    if (!force && w === this.lastW && h === this.lastH) return;
    this.lastW = w;
    this.lastH = h;
    this.guard(() => this.instance.resize(w, h));
  }

  resume() {
    if (this.state !== 'ready' || !this.instance) return;
    this.measure(false);
    this.guard(() => this.instance.activate && this.instance.activate());
    this.setStatus(reduced ? 'STATIC' : 'LIVE', reduced ? 'ready' : 'live');
  }

  pause() {
    if (this.state !== 'ready' || !this.instance) return;
    this.guard(() => this.instance.deactivate && this.instance.deactivate());
    this.setStatus('PAUSED', 'ready');
  }

  tick(dt, elapsed) {
    if (reduced || !this.active || this.state !== 'ready' || !this.instance) return;
    if (typeof this.instance.update !== 'function') return;

    /* The hovered exhibit — and a fullscreen one, which is the whole page —
       runs every frame. Everything else coalesces to ~32Hz and is handed the
       accumulated dt, so its motion stays correct, just resolved less often. */
    if (this !== hot && this !== expanded) {
      this.acc += dt;
      if (this.acc < IDLE_STEP) return;
      dt = this.acc;
      this.acc = 0;
    }

    this.guard(() => this.instance.update(dt, elapsed));
  }

  destroy() {
    if (this.instance) this.guard(() => this.instance.destroy && this.instance.destroy());
    this.instance = null;
    this.state = 'destroyed';
  }

  /* A module that throws is retired rather than allowed to spam the console. */
  guard(fn) {
    try {
      fn();
    } catch (err) {
      this.instance = null;
      this.state = 'failed';
      this.active = false;
      this.setStatus('UNAVAILABLE', 'failed');
    }
  }
}

const exhibits = Array.from(document.querySelectorAll('[data-exhibit]'), (el) => new Exhibit(el));
const byEl = new Map(exhibits.map((ex) => [ex.el, ex]));

/* The catalogue grows, so nothing states its own size in the markup. Every
   printed count is derived from the cards actually on the page — add a card
   and the masthead follows on its own. The HTML keeps a plausible value as
   the no-JS fallback. */
function stampCounts() {
  const pad = (n) => String(n).padStart(2, '0');
  const total = pad(exhibits.length);
  document.querySelectorAll('[data-count-total]').forEach((el) => {
    el.textContent = total;
  });
  document.querySelectorAll('[data-count-range]').forEach((el) => {
    el.textContent = 'EX. 01 — ' + total;
  });
}
stampCounts();

/* ------------------------------------------------------------- commerce ui */

function wireCommerce() {
  const mail = document.querySelector('[data-contact-mail]');
  if (mail) {
    mail.textContent = CONTACT_MAIL;
    mail.href = 'mailto:' + CONTACT_MAIL +
      '?subject=' + encodeURIComponent('NULLRIFT — commission a system');
  }

  document.querySelectorAll('[data-checkout]').forEach((el) => {
    const url = CHECKOUT[el.dataset.checkout];
    const label = el.querySelector('span') || el;
    if (url) {
      el.href = url;
      el.removeAttribute('data-unwired');
      el.removeAttribute('aria-disabled');
      return;
    }
    /* No processor connected yet — say so plainly instead of pretending. */
    el.setAttribute('data-unwired', '');
    el.setAttribute('aria-disabled', 'true');
    el.removeAttribute('href');
    el.dataset.label = label.textContent;
    label.textContent = 'Checkout not connected';
  });
}
wireCommerce();

/* --------------------------------------------------------------- lifecycle */

const mountObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const ex = byEl.get(entry.target);
    if (!ex) return;
    if (entry.isIntersecting) {
      ex.active = true;
      if (ex.state === 'idle') ex.mount();
      else ex.resume();
    } else if (ex.active) {
      ex.active = false;
      ex.pause();
    }
  });
}, { rootMargin: MOUNT_MARGIN, threshold: 0 });

exhibits.forEach((ex) => mountObserver.observe(ex.el));

/* Resize is debounced so a drag-resize does not rebuild every scene per frame. */
let resizeTimer = 0;
const resizeObserver = new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    exhibits.forEach((ex) => ex.measure(false));
  }, 140);
});
exhibits.forEach((ex) => resizeObserver.observe(ex.stage));

/* Moving the window between displays changes DPR; force a full re-measure. */
let dprQuery = null;
function watchPixelRatio() {
  if (dprQuery) dprQuery.removeEventListener('change', onPixelRatio);
  dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  dprQuery.addEventListener('change', onPixelRatio);
}
function onPixelRatio() {
  exhibits.forEach((ex) => ex.measure(true));
  watchPixelRatio();
}
watchPixelRatio();

/* ------------------------------------------------------------------- clock */

let rafId = 0;
let last = 0;
let elapsed = 0;
let running = false;

function frame(now) {
  rafId = requestAnimationFrame(frame);
  const dt = last ? Math.min((now - last) / 1000, MAX_DT) : 1 / 60;
  last = now;
  elapsed += dt;
  for (let i = 0; i < exhibits.length; i += 1) exhibits[i].tick(dt, elapsed);
  updateProgress();
}

function startClock() {
  if (running) return;
  running = true;
  last = 0;
  rafId = requestAnimationFrame(frame);
}

function stopClock() {
  running = false;
  cancelAnimationFrame(rafId);
}

function onVisibility() {
  if (document.hidden) {
    stopClock();
    exhibits.forEach((ex) => { if (ex.active) ex.pause(); });
  } else {
    exhibits.forEach((ex) => { if (ex.active) ex.resume(); });
    startClock();
  }
}
document.addEventListener('visibilitychange', onVisibility);

/* ---------------------------------------------------------- progress rail */

const progressBar = document.querySelector('[data-progress-bar]');
let lastProgress = -1;

function updateProgress() {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (Math.abs(p - lastProgress) < 0.0008) return;
  lastProgress = p;
  progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
}

/* --------------------------------------------------------- anchor scrolling */

function onAnchorClick(event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  /* Card links open the exhibit rather than scrolling to it. */
  if (link.hasAttribute('data-card-open')) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  const offset = target.getBoundingClientRect().top + window.scrollY - 24;
  window.scrollTo({ top: offset, behavior: reduced ? 'auto' : 'smooth' });
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}
document.addEventListener('click', onAnchorClick);

/* ----------------------------------------------------- card hover ownership

   Every preview shares one cursor, so exactly one card may be "hot" at a time.
   Direct-mounted stages sit at real page coordinates, so a hovered module gets
   genuine pointer events with no remapping — the others simply never receive
   any and stay on their own idle loops.

   Clicks are a different matter: the card is a link, so pointerdown/up/click
   are swallowed in the capture phase before a module can treat them as input.
   Inside fullscreen the card is no longer a link and everything passes through.
------------------------------------------------------------------------------ */

let hot = null;

function setHot(ex) {
  if (hot === ex) return;
  if (hot) hot.el.classList.remove('is-hot');
  hot = ex;
  if (hot) hot.el.classList.add('is-hot');
}

exhibits.forEach((ex) => {
  const el = ex.el;

  el.addEventListener('pointerenter', () => { if (!expanded) setHot(ex); });
  el.addEventListener('pointerleave', () => { if (hot === ex) setHot(null); });

  ['pointerdown', 'pointerup'].forEach((type) => {
    el.addEventListener(type, (event) => {
      if (expanded || event.target.closest('.card__info')) return;
      event.stopPropagation();
    }, true);
  });

  /* A click on the preview is a click on the card, i.e. a navigation. */
  el.addEventListener('click', (event) => {
    if (expanded || event.target.closest('.card__info')) return;
    event.stopPropagation();
    event.preventDefault();
    openExhibit(ex);
  }, true);

  /* A card preview must never eat the page scroll. */
  el.addEventListener('wheel', (event) => {
    if (!expanded) event.stopPropagation();
  }, true);
});

/* ------------------------------------------- expand + buyer prompt chrome */

let expanded = null;
const expandBar = document.getElementById('expand-bar');
const expandIdEl = document.querySelector('[data-expand-id]');
const expandTitleEl = document.querySelector('[data-expand-title]');

/* Opening an exhibit is a real navigation: it writes a history entry, so the
   URL is shareable and Back returns to the grid. */
function openExhibit(ex) {
  if (!ex || expanded === ex) return;
  const hash = '#' + ex.el.id;
  if (window.location.hash !== hash) {
    window.history.pushState({ nrExhibit: ex.id }, '', hash);
  }
  openExpand(ex);
}

function onPopState() {
  const id = (window.location.hash || '').replace('#', '');
  const target = id ? exhibits.find((ex) => ex.el.id === id) : null;
  if (target) openExpand(target);
  else closeExpand(true);
}
window.addEventListener('popstate', onPopState);

function openExpand(ex) {
  if (!ex || expanded === ex) return;
  if (expanded) closeExpand(true);

  setHot(null);
  expanded = ex;
  const title =
    (ex.el.querySelector('.card__title') || {}).textContent || 'EXHIBIT';
  ex.el.classList.add('is-expanded');
  html.classList.add('is-expanded');

  if (expandBar) {
    expandBar.hidden = false;
    if (expandIdEl) expandIdEl.textContent = 'EX.' + ex.id;
    if (expandTitleEl) expandTitleEl.textContent = title.trim().toUpperCase();
  }

  /* Ensure the module is live, promoted to full quality, and sized to the
     new stage. setPreview must land before the forced measure. */
  ex.active = true;
  if (ex.state === 'idle') ex.mount().then(() => {
    ex.setPreview(false);
    ex.resume();
    ex.measure(true);
  });
  else {
    ex.setPreview(false);
    ex.resume();
    requestAnimationFrame(() => ex.measure(true));
  }

  const closeBtn = expandBar && expandBar.querySelector('[data-expand-close]');
  if (closeBtn) closeBtn.focus({ preventScroll: true });
}

function closeExpand(silent) {
  if (!expanded) return;
  const ex = expanded;
  expanded = null;
  ex.el.classList.remove('is-expanded');
  html.classList.remove('is-expanded');
  if (expandBar) expandBar.hidden = true;

  /* Back down to card quality so the grid stays cheap. */
  ex.setPreview(true);

  requestAnimationFrame(() => {
    ex.measure(true);
    if (!silent) {
      const link = ex.el.querySelector('[data-card-open]');
      if (link) link.focus({ preventScroll: true });
    }
  });
}

/* ---- prompt panel ------------------------------------------------------- */

const promptPanel = document.getElementById('prompt-panel');
const promptFields = {
  id: document.querySelector('[data-prompt-id]'),
  title: document.querySelector('[data-prompt-title]'),
  tech: document.querySelector('[data-prompt-tech]'),
  use: document.querySelector('[data-prompt-use]'),
  file: document.querySelector('[data-prompt-file]'),
  body: document.querySelector('[data-prompt-body]'),
  copyLabel: document.querySelector('[data-prompt-copy-label]')
};
let promptOpenFor = null;
let copyTimer = 0;
let lastFocus = null;

async function openPrompt(ex) {
  /* The table is a separate module now, so wait for it rather than assuming
     it has landed. In practice it resolves long before anyone can click. */
  const api = prompts || await promptsReady.catch(function () { return null; });
  const data = api && api.getPrompt(ex.id);
  if (!data || !promptPanel) return;

  lastFocus = document.activeElement;
  promptOpenFor = ex;
  if (promptFields.id) promptFields.id.textContent = 'EX.' + data.id;
  if (promptFields.title) promptFields.title.textContent = data.title;
  if (promptFields.tech) promptFields.tech.textContent = data.tech;
  if (promptFields.use) promptFields.use.textContent = data.use;
  if (promptFields.file) promptFields.file.textContent = data.file;
  if (promptFields.body) promptFields.body.textContent = data.body;
  if (promptFields.copyLabel) promptFields.copyLabel.textContent = 'Copy prompt';

  const copyBtn = promptPanel.querySelector('[data-prompt-copy]');
  if (copyBtn) copyBtn.classList.remove('is-copied');

  promptPanel.hidden = false;
  html.classList.add('is-prompt-open');
  document.body.style.overflow = expanded ? 'hidden' : 'hidden';

  const closeBtn = promptPanel.querySelector('.prompt__x');
  if (closeBtn) closeBtn.focus({ preventScroll: true });
}

function closePrompt() {
  if (!promptPanel || promptPanel.hidden) return;
  promptPanel.hidden = true;
  html.classList.remove('is-prompt-open');
  if (!expanded) document.body.style.overflow = '';
  const restore = lastFocus;
  lastFocus = null;
  promptOpenFor = null;
  if (restore && typeof restore.focus === 'function') {
    restore.focus({ preventScroll: true });
  }
}

async function copyPrompt() {
  const data = promptOpenFor && prompts ? prompts.getPrompt(promptOpenFor.id) : null;
  if (!data) return;
  const label = promptFields.copyLabel;
  const btn = promptPanel && promptPanel.querySelector('[data-prompt-copy]');
  try {
    await navigator.clipboard.writeText(data.body);
  } catch (err) {
    /* Fallback for older engines / insecure contexts */
    const ta = document.createElement('textarea');
    ta.value = data.body;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  if (label) label.textContent = 'Copied';
  if (btn) btn.classList.add('is-copied');
  clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => {
    if (label) label.textContent = 'Copy prompt';
    if (btn) btn.classList.remove('is-copied');
  }, 1800);
}

function onGalleryClick(event) {
  const cardLink = event.target.closest('[data-card-open]');
  if (cardLink) {
    const article = cardLink.closest('[data-exhibit]');
    const ex = article && byEl.get(article);
    if (ex) {
      event.preventDefault();
      openExhibit(ex);
    }
    return;
  }

  if (event.target.closest('[data-expand-close]')) {
    event.preventDefault();
    /* Unwind the history entry openExhibit pushed. */
    if (window.history.state && window.history.state.nrExhibit) window.history.back();
    else closeExpand(false);
    return;
  }

  const promptBtn = event.target.closest('[data-prompt]');
  if (promptBtn) {
    const article = promptBtn.closest('[data-exhibit]');
    const ex = article && byEl.get(article);
    if (ex) {
      event.preventDefault();
      openPrompt(ex);
    }
    return;
  }

  if (event.target.closest('[data-prompt-close]')) {
    event.preventDefault();
    closePrompt();
    return;
  }

  if (event.target.closest('[data-prompt-copy]')) {
    event.preventDefault();
    copyPrompt();
  }
}

function onGalleryKey(event) {
  if (event.key === 'Escape') {
    if (promptPanel && !promptPanel.hidden) {
      closePrompt();
      return;
    }
    if (expanded) {
      if (window.history.state && window.history.state.nrExhibit) window.history.back();
      else closeExpand(false);
    }
  }
}

document.addEventListener('click', onGalleryClick);
document.addEventListener('keydown', onGalleryKey);

/* ------------------------------------------------------------ the entrance */

function composeEntrance() {
  const gsap = window.gsap;
  if (!gsap || reduced) {
    html.classList.add('g-static');
    return;
  }

  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  /* The masthead headline is deliberately absent from this timeline. It is
     plain text that paints with the document and glitches itself in CSS, so it
     can never be held hostage by a CDN script that has not arrived yet. Only
     the secondary copy fades, and that is allowed to wait. */
  const fades = document.querySelectorAll('[data-reveal-fade]');

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });

  /* The CSS start states resolve to pixels in the computed matrix, so every
     entrance tween declares its own from-state rather than reading them back. */
  /* The old masthead rule is gone with the hero rebuild, so only tween what is
     actually on the page — GSAP warns loudly about empty targets otherwise. */
  const rule = document.querySelectorAll('[data-reveal-rule]');
  if (rule.length) intro.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.1 }, 0);
  if (fades.length) {
    intro.fromTo(fades, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.05, stagger: 0.055 }, 0.3);
  }

  /* A starved ticker — a tab that boots in the background — can resolve the
     timeline's clock without ever rendering it, reporting "finished" over copy
     that is still invisible. A timer is not rAF-driven, so it still fires in
     that state and asserts the resting values directly. */
  window.setTimeout(function () {
    intro.progress(1);
    if (rule.length) gsap.set(rule, { scaleX: 1 });
    if (fades.length) gsap.set(fades, { opacity: 1, y: 0 });
  }, 4000);

  if (!window.ScrollTrigger) {
    gsap.set('.card', { opacity: 1 });
    return;
  }

  /* The grid reveals row by row. Cards animate opacity only — transform is
     reserved for the hover lift, which CSS owns, so the two never fight. */
  gsap.fromTo(
    '.card',
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.9,
      stagger: 0.07,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.library__grid', start: 'top 82%', once: true }
    }
  );
}

/* ----------------------------------------------------------------- teardown */

function teardown() {
  stopClock();
  mountObserver.disconnect();
  resizeObserver.disconnect();
  clearTimeout(resizeTimer);
  if (dprQuery) dprQuery.removeEventListener('change', onPixelRatio);
  window.removeEventListener('popstate', onPopState);
  document.removeEventListener('visibilitychange', onVisibility);
  document.removeEventListener('click', onAnchorClick);
  document.removeEventListener('click', onGalleryClick);
  document.removeEventListener('keydown', onGalleryKey);
  closePrompt();
  closeExpand(true);
  exhibits.forEach((ex) => ex.destroy());
}
window.addEventListener('pagehide', teardown, { once: true });

/* --------------------------------------------------------------------- boot */

function boot() {
  try {
    composeEntrance();
  } catch (err) {
    html.classList.add('g-static');
  }
  updateProgress();
  startClock();

  /* Deep link: /gallery.html#ex-04 opens that exhibit directly. */
  const id = (window.location.hash || '').replace('#', '');
  if (id) {
    const target = exhibits.find((ex) => ex.el.id === id);
    if (target) {
      window.history.replaceState({ nrExhibit: target.id }, '', '#' + id);
      openExpand(target);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
