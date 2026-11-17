/* NULLRIFT — frame shim for the full-site templates
   ==========================================================================

   Loaded as the very first script of every template page (oblique/, hadal/,
   wobl/, autocars/), before the template's own code, so everything the page
   builds afterwards goes through it. Opened on its own — a new tab, a direct
   link — it does nothing at all.

   Inside a card on templates.html it lets the shelf decide how hard each
   template may work, through two attributes the shelf sets on the <iframe>:

     data-nr-run   "run"   every frame (hovered card, fullscreen)
                   "idle"  about 30 frames a second (on screen, not hovered)
                   "pause" no frames at all (scrolled away)

     data-nr-dpr   the pixel ratio to report while the page is a card. A card
                   shows a 1440px-wide page in a box a third of that, so
                   rendering it at the screen's full ratio draws several times
                   the pixels anyone can see. Removed for fullscreen.

   Pausing works by owning requestAnimationFrame: every render loop, smooth
   scroller and tween ticker in the template asks for frames through it, so
   holding them back stops the WebGL, the physics and the scroll together,
   without the template knowing. The templates already cap the time step
   they take after a gap, so they resume without a jump.
   ========================================================================== */
(function () {
  'use strict';

  var host;
  try {
    if (window.parent === window) return;
    host = window.frameElement;
  } catch (err) {
    return;
  }
  if (!host || !host.hasAttribute('data-nr-run')) return;

  var nativeRaf = window.requestAnimationFrame.bind(window);
  var IDLE_GAP = 1000 / 30 - 2;

  var queue = new Map();
  var nextId = 1;
  var pending = 0;
  var lastFlush = 0;

  function mode() {
    var m = host.getAttribute('data-nr-run');
    return m === 'pause' || m === 'idle' ? m : 'run';
  }

  function schedule() {
    if (!pending) pending = nativeRaf(pump);
  }

  function pump(now) {
    pending = 0;
    if (!queue.size) return;
    var m = mode();
    /* Paused: keep what was asked for and stop. wake() picks it up. */
    if (m === 'pause') return;
    if (m === 'idle' && now - lastFlush < IDLE_GAP) {
      schedule();
      return;
    }
    lastFlush = now;
    var batch = queue;
    queue = new Map();
    batch.forEach(function (cb) {
      try {
        cb(now);
      } catch (err) {
        setTimeout(function () { throw err; });
      }
    });
  }

  window.requestAnimationFrame = function (cb) {
    var id = nextId++;
    queue.set(id, cb);
    if (mode() !== 'pause') schedule();
    return id;
  };

  window.cancelAnimationFrame = function (id) {
    queue.delete(id);
  };

  /* The shelf calls this after changing data-nr-run. */
  window.__nrWake = function () {
    if (mode() !== 'pause' && queue.size) schedule();
  };

  /* Pixel ratio. Read live, so a page that re-reads it on resize picks up the
     full ratio again as soon as it goes fullscreen. */
  var desc =
    Object.getOwnPropertyDescriptor(window, 'devicePixelRatio') ||
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'devicePixelRatio') ||
    (typeof Window !== 'undefined' && Object.getOwnPropertyDescriptor(Window.prototype, 'devicePixelRatio'));
  if (desc && desc.get) {
    var realDpr = desc.get;
    try {
      Object.defineProperty(window, 'devicePixelRatio', {
        configurable: true,
        enumerable: true,
        get: function () {
          var real = realDpr.call(window);
          var cap = parseFloat(host.getAttribute('data-nr-dpr'));
          return cap > 0 ? Math.min(real, cap) : real;
        }
      });
    } catch (err) {
      /* Not redefinable here: the page renders at full ratio, nothing breaks. */
    }
  }
})();
