/* NULLRIFT — TPL.02 HADAL

   Framed the same way as Oblique (09-oblique.js), for the same reason: HADAL
   is a whole site. It owns window scroll (Lenis), pins chapters with
   ScrollTrigger and runs one persistent WebGL canvas behind the page, so it
   gets its own document in an iframe instead of a stage box.

   The page in public/hadal/ is the author's Vite build of the HADAL project,
   built with base /hadal/ so its assets resolve under this site:

     cd ../HADAL && npx vite build --base /hadal/ --outDir <tmp>
     # MODEL_URL is a hard-coded string, which a base does not rewrite:
     sed -i '' 's#`/models/hadal.glb`#`/hadal/models/hadal.glb`#' <tmp>/assets/index-*.js
     rm -rf public/hadal && cp -R <tmp> public/hadal

   The card renders the desktop layout scaled down; hovering it sinks a little
   way into the dive, the template's own idea in miniature. Fullscreen hands
   the frame the real viewport and the pointer.
   ========================================================================== */

let UID = 0;

const PAGE = new URL('../../hadal/index.html', import.meta.url).href;

const DESKTOP_W = 1440;

/* HADAL is long — eleven pinned chapters — so a peek goes only as far as the
   plunge below the surface, not half the site. */
const PEEK_DEPTH = 0.12;
const PEEK_IN = 6;
const PEEK_OUT = 1.1;

export default function create(ctx) {
  const root = ctx && ctx.root;
  if (!root) {
    return { setPreview() {}, resize() {}, update() {}, activate() {}, deactivate() {}, destroy() {} };
  }

  const S = 'nrx10h' + (++UID);
  const reduced = !!ctx.reduced;
  let destroyed = false;
  let preview = ctx.preview !== false;
  let stageW = 0;
  let stageH = 0;
  let hover = false;
  let t = 0;

  const styleEl = document.createElement('style');
  styleEl.textContent =
    '.' + S + '{position:absolute;top:0;left:0;width:100%;height:100%;border:0;' +
    'display:block;background:#03060A;pointer-events:none;transform-origin:0 0;}' +
    '.' + S + '.is-live{pointer-events:auto;}';
  document.head.appendChild(styleEl);

  const frame = document.createElement('iframe');
  frame.className = S;
  frame.src = PAGE;
  frame.title = 'HADAL — scroll-driven 3D submersible site template';
  frame.setAttribute('loading', 'lazy');
  frame.setAttribute('tabindex', '-1');
  frame.setAttribute('scrolling', 'yes');
  root.appendChild(frame);

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

  /* Lenis adopts native scroll it did not cause, so a plain scrollTo from
     here moves the dive rather than fighting it. While the preloader runs the
     page is locked and the call is simply a no-op. */
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
    const rate = hover ? 1 / PEEK_IN : 1 / PEEK_OUT;
    t = want > t ? Math.min(want, t + dt * rate) : Math.max(want, t - dt * rate);
    scrollChildTo(t * t * (3 - 2 * t));
  }

  function resize(w, h) {
    stageW = w;
    stageH = h;
    layout();
  }

  function activate() {}
  function deactivate() { hover = false; }

  /* Inert as a card so clicks reach the card link; live in fullscreen. See
     09-oblique.js for the long version. */
  function setPreview(isPreview) {
    if (destroyed) return;
    preview = isPreview;
    frame.classList.toggle('is-live', !isPreview);
    frame.setAttribute('tabindex', isPreview ? '-1' : '0');
    hover = false;
    t = 0;
    scrollChildTo(0);
    layout();
  }

  if (!preview) setPreview(false);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    root.removeEventListener('pointerenter', onEnter);
    root.removeEventListener('pointerleave', onLeave);
    /* Blanking the src releases the WebGL context and the GSAP ticker now,
       rather than whenever the detached frame is collected. */
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
