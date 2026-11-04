/* NULLRIFT — TPL.01 OBLIQUE

   This exhibit is a frame, not a port.

   Oblique is a whole page: it owns window scroll, runs its own smooth-scroll
   loop off the wheel and keyboard, locks document.body while a print is open,
   and adds its own gsap.ticker frame. Every other module here is sandboxed
   into a stage box and forbidden from touching page scroll — so dropping
   Oblique's code in directly would have it fighting the gallery for the wheel,
   and adapting it would mean rewriting the scroll core it is built on.

   An iframe gives it its own document. The page in public/oblique/ is the
   author's build, byte for byte, with nothing rewritten: it owns scroll inside
   its own frame, where owning scroll is free.

   As a card it is a thumbnail of the template, so it has to look like the
   site someone will actually ship. A frame the width of a card is a phone
   viewport, and would show the mobile layout of a desktop-first page. So the
   preview renders at a desktop width and is scaled down to the card; only
   fullscreen gets the real viewport. Hovering the card peeks down the page,
   the way you would flick through a template before opening it.

   The trade is honest: heavier than a canvas module, and the frame only mounts
   when the card is actually on screen, then unloads when it is destroyed.
   ========================================================================== */

let UID = 0;

const PAGE = new URL('../../oblique/index.html', import.meta.url).href;

/* The width the thumbnail is laid out at. A common laptop viewport: wide
   enough for the desktop layout, narrow enough that type stays readable once
   it is scaled into a card. */
const DESKTOP_W = 1440;

/* How far down the page a hover peek travels, as a share of what is
   scrollable, and how long it takes to get there. Slow on purpose: it is a
   browse, not a scroll-jack. */
const PEEK_DEPTH = 0.55;
const PEEK_IN = 9;
const PEEK_OUT = 1.1;

export default function create(ctx) {
  const root = ctx && ctx.root;
  if (!root) {
    return { setPreview() {}, resize() {}, update() {}, activate() {}, deactivate() {}, destroy() {} };
  }

  const S = 'nrx9o' + (++UID);
  const reduced = !!ctx.reduced;
  let destroyed = false;
  let preview = ctx.preview !== false;
  let stageW = 0;
  let stageH = 0;

  /* Peek state. `want` is 0 (top) or 1 (peeked); `t` eases toward it. */
  let hover = false;
  let t = 0;

  const styleEl = document.createElement('style');
  styleEl.textContent =
    '.' + S + '{position:absolute;top:0;left:0;width:100%;height:100%;border:0;' +
    'display:block;background:#1500E1;pointer-events:none;transform-origin:0 0;}' +
    /* Only fullscreen does the frame take the pointer. See setPreview. */
    '.' + S + '.is-live{pointer-events:auto;}';
  document.head.appendChild(styleEl);

  const frame = document.createElement('iframe');
  frame.className = S;
  frame.src = PAGE;
  frame.title = 'Oblique — tilted grid portfolio template';
  frame.setAttribute('loading', 'lazy');
  /* The thumbnail is decoration; the card's own heading names it. Keyboard
     users reach the page through fullscreen, where the frame is live. */
  frame.setAttribute('tabindex', '-1');
  /* Same origin, so the page can load its own stylesheet and CDN scripts.
     scrolling stays on: the whole point is that it keeps its own scroll. */
  frame.setAttribute('scrolling', 'yes');
  root.appendChild(frame);

  /* The child document, once it can be reached. Same origin, so this only
     fails while the frame is mid-navigation. */
  function view() {
    try {
      const w = frame.contentWindow;
      return w && w.document && w.document.documentElement ? w : null;
    } catch (err) {
      return null;
    }
  }

  function layout() {
    if (destroyed) return;
    if (!preview || !stageW || !stageH) {
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.transform = '';
      return;
    }
    const scale = stageW / DESKTOP_W;
    frame.style.width = DESKTOP_W + 'px';
    frame.style.height = Math.ceil(stageH / scale) + 'px';
    frame.style.transform = 'scale(' + scale.toFixed(5) + ')';
  }

  /* Oblique adopts any scroll position it did not set itself (its engine
     re-syncs when window.scrollY drifts from its own value), so driving the
     child's scroll from here cooperates with it rather than fighting it. */
  function scrollChildTo(y) {
    const w = view();
    if (!w) return;
    const max = w.document.documentElement.scrollHeight - w.innerHeight;
    if (max <= 0) return;
    w.scrollTo(0, Math.round(Math.max(0, Math.min(1, y)) * max * PEEK_DEPTH));
  }

  function onEnter() { if (preview && !reduced) hover = true; }
  function onLeave() { hover = false; }
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);

  function update(dt) {
    if (!preview || reduced) return;
    const want = hover ? 1 : 0;
    if (t === want) return;
    /* Linear in time toward the target, eased on the way out to the page. A
       hover that ends halfway reverses from wherever it got to. */
    const rate = hover ? 1 / PEEK_IN : 1 / PEEK_OUT;
    t = want > t ? Math.min(want, t + dt * rate) : Math.max(want, t - dt * rate);
    const eased = t * t * (3 - 2 * t);
    scrollChildTo(eased);
  }

  function resize(w, h) {
    stageW = w;
    stageH = h;
    layout();
  }

  function activate() {}
  function deactivate() { hover = false; }

  /* An iframe is its own hit-testing world: a click inside it is delivered to
     the child document and never surfaces as an event on this page. Every
     other exhibit is a canvas or a pile of divs, so the card's capture-phase
     click handler sees the press and opens the exhibit; here that handler was
     never reached, and the card simply could not be opened.

     So the frame is inert while it is a card — the pointer falls straight
     through to the card, which is a link, and clicking the preview navigates
     like every other card does. Fullscreen it takes the pointer back, because
     there the whole point is that you can scroll and hover the thing. */
  function setPreview(isPreview) {
    if (destroyed) return;
    preview = isPreview;
    frame.classList.toggle('is-live', !isPreview);
    frame.setAttribute('tabindex', isPreview ? '-1' : '0');
    /* Opening it starts at the top of the template, the way a visitor would
       land on it; closing it hands back a card resting on its hero. */
    hover = false;
    t = 0;
    scrollChildTo(0);
    layout();
  }

  /* ctx.preview is false when a deep link opens straight into fullscreen. */
  if (!preview) setPreview(false);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    root.removeEventListener('pointerenter', onEnter);
    root.removeEventListener('pointerleave', onLeave);
    /* Blank the src first: without it the frame's timers and GSAP ticker can
       outlive the element for a beat. */
    try { frame.src = 'about:blank'; } catch (err) { /* already gone */ }
    if (frame.parentNode) frame.parentNode.removeChild(frame);
    if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
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
