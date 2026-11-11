/* NULLRIFT — shared card for full-site templates

   A whole site owns window scroll, its own render loop and often a WebGL
   canvas, so it cannot share a stage box with the gallery. Each one runs in
   its own document inside an iframe:

     - as a card it is laid out at a desktop width and scaled down, so the
       thumbnail shows the layout a buyer will actually ship, not the phone
       layout a card-sized viewport would trigger;
     - hovering the card scrolls the page a little way down, a quick flick
       through the template;
     - the frame ignores the pointer while it is a card, so a click lands on
       the card link and opens it, and takes the pointer back in fullscreen.

   09-oblique.js is the original, long-form version of the same idea.
   ========================================================================== */

let UID = 0;

const DESKTOP_W = 1440;

/**
 * @param {object} cfg
 * @param {string} cfg.page        absolute URL of the template's index.html
 * @param {string} cfg.title       iframe title (accessible name)
 * @param {string} cfg.background  colour shown before the page paints
 * @param {number} [cfg.peekDepth] share of the scrollable height a hover travels
 * @param {number} [cfg.peekIn]    seconds to reach the peek
 * @param {number} [cfg.peekOut]   seconds to come back
 */
export function frameTemplate(cfg) {
  const PEEK_DEPTH = cfg.peekDepth == null ? 0.15 : cfg.peekDepth;
  const PEEK_IN = cfg.peekIn || 6;
  const PEEK_OUT = cfg.peekOut || 1.1;

  return function create(ctx) {
    const root = ctx && ctx.root;
    if (!root) {
      return { setPreview() {}, resize() {}, update() {}, activate() {}, deactivate() {}, destroy() {} };
    }

    const S = 'nrxtpl' + (++UID);
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
      'display:block;background:' + cfg.background + ';pointer-events:none;transform-origin:0 0;}' +
      '.' + S + '.is-live{pointer-events:auto;}';
    document.head.appendChild(styleEl);

    const frame = document.createElement('iframe');
    frame.className = S;
    frame.src = cfg.page;
    frame.title = cfg.title;
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

    /* Smooth-scroll libraries (Lenis and friends) adopt native scroll they did
       not cause, so a plain scrollTo moves the page rather than fighting it. */
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
      /* Blanking the src releases WebGL contexts and tickers now, rather than
         whenever the detached frame is collected. */
      try { frame.src = 'about:blank'; } catch (err) { /* already gone */ }
      if (frame.parentNode) frame.parentNode.removeChild(frame);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    }

    return {
      setPreview: setPreview,
      resize: resize,
      update: update,
      activate() {},
      deactivate() { hover = false; },
      destroy: destroy
    };
  };
}
