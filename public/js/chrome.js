/* ==========================================================================
   NULLRIFT — chrome.js
   Shared chrome behaviour: theme switch, film grain, status flicker.
   The pointer is the system cursor — a bespoke one costs precision and
   accessibility for nothing a visitor asked for.
   Self-initialising, zero config, safe when any chrome element is missing.
   Exposes exactly one global: window.NR
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var NR = (window.NR = window.NR || {});
  NR.prefersReducedMotion = reduced;
  if (typeof NR.lerp !== "function") {
    NR.lerp = function (a, b, t) {
      return a + (b - a) * t;
    };
  }

  /* ----------------------------------------------------------------- grain */

  function initGrain() {
    var el = document.querySelector(".nr-grain");
    if (!el) return;

    /* One 128px monochrome tile, generated once, then tiled and drifted by
       the CSS transform animation. No per-frame work after this. */
    try {
      var size = 128;
      var canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext("2d");
      if (!ctx) return;

      var image = ctx.createImageData(size, size);
      var data = image.data;
      for (var i = 0; i < data.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = (Math.random() * 190) | 0;
      }
      ctx.putImageData(image, 0, 0);
      el.style.setProperty("--nr-grain-tex", 'url("' + canvas.toDataURL("image/png") + '")');
      el.style.backgroundSize = size + "px " + size + "px";
    } catch (err) {
      /* keep the CSS feTurbulence fallback */
    }
  }

  /* ---------------------------------------------------------------- status */

  function initStatus() {
    var nodes = document.querySelectorAll("[data-nr-status]");
    if (!nodes.length || reduced) return;

    var GLYPHS = "01∅/\\<>[]{}#*+=-_~^%$&";

    function scramble(node) {
      var text = node.dataset.nrStatusText || node.textContent;
      node.dataset.nrStatusText = text;

      var steps = 5 + ((Math.random() * 4) | 0);
      var step = 0;
      node.classList.add("is-glitch");

      var id = window.setInterval(function () {
        step += 1;
        if (step >= steps) {
          window.clearInterval(id);
          node.textContent = text;
          node.classList.remove("is-glitch");
          return;
        }
        var out = "";
        var hold = step / steps;
        for (var i = 0; i < text.length; i += 1) {
          var ch = text.charAt(i);
          if (ch === " " || Math.random() < hold) {
            out += ch;
          } else {
            out += GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
          }
        }
        node.textContent = out;
      }, 52);
    }

    function schedule(node) {
      var wait = 4200 + Math.random() * 9000;
      window.setTimeout(function () {
        if (!document.hidden && node.isConnected) scramble(node);
        schedule(node);
      }, wait);
    }

    Array.prototype.forEach.call(nodes, function (node) {
      node.dataset.nrStatusText = node.textContent;
      schedule(node);
    });
  }

  /* ------------------------------------------------------------------- nav */

  /* The header has no bar of its own at the top of the page. It grows one the
     moment anything scrolls beneath it, which is the only point at which the
     labels need a surface to stay readable. */
  function initNav() {
    var nav = document.querySelector(".nr-nav");
    if (!nav) return;

    var stuck = null;

    /* The homepage pins a full-bleed hero for several viewports, so raw scroll
       position says "scrolled" while the visitor is still looking at the first
       screen — and the bar would appear over the artwork immediately. Where a
       hero exists, the surface waits until the hero has actually left; the
       controls themselves stay visible the whole time. */
    var hero = document.querySelector("[data-nav-hero]");

    /* Synchronous rather than rAF-batched: this is one class toggle guarded by
       an unchanged-state early out, which is cheaper than the frame bookkeeping
       and cannot be left stale by a throttled rAF. */
    function paint() {
      var next;
      if (hero) {
        /* Bottom of the hero measured against the bar's own height, so the
           surface arrives exactly as real content slides underneath it. */
        next = hero.getBoundingClientRect().bottom <= nav.offsetHeight;
      } else {
        next = window.pageYOffset > 8;
      }
      if (next === stuck) return;
      stuck = next;
      nav.classList.toggle("is-stuck", next);
    }

    window.addEventListener("scroll", paint, { passive: true });
    paint();
  }

  /* ------------------------------------------------------------------ boot */

  /* ----------------------------------------------------------------- theme */

  function initTheme() {
    var group = document.querySelector(".nr-theme");
    if (!group) return;

    var buttons = group.querySelectorAll("[data-theme-set]");

    function current() {
      return document.documentElement.dataset.theme || "auto";
    }

    function paint() {
      var now = current();
      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.themeSet === now));
      });
    }

    function apply(next) {
      if (next === "auto") {
        /* Removing the attribute is what hands control back to the OS — the
           auto rule in CSS is scoped to :root:not([data-theme]). */
        delete document.documentElement.dataset.theme;
      } else {
        document.documentElement.dataset.theme = next;
      }
      try {
        if (next === "auto") localStorage.removeItem("nr-theme");
        else localStorage.setItem("nr-theme", next);
      } catch (e) { /* private mode: the choice just will not persist */ }
      paint();
    }

    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener("click", function () { apply(b.dataset.themeSet); });
    });

    paint();
  }

  function boot() {
    initTheme();
    initNav();
    initGrain();
    initStatus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
