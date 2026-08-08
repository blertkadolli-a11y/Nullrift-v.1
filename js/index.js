/* ==========================================================================
   NULLRIFT — index.js

   Section 0  the opening moment (scroll is locked until it resolves)
   Section A  brand hero reveal (mark + wordmark — no fold / plate / wireframe)
   Section B  homepage reveals, magnetic CTA, page-exit rift.
   ========================================================================== */

(function () {
  "use strict";

  var NR = (window.NR = window.NR || {});
  if (typeof NR.lerp !== "function") {
    NR.lerp = function (a, b, t) {
      return a + (b - a) * t;
    };
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  NR.prefersReducedMotion = reduced;

  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  function noop() {}

  /* ----------------------------------------------------------------------
     Scroll lock — engaged synchronously at boot so there is no window in
     which the fold can be scrolled before the opening moment has resolved.
     Locking at scrollY 0 with a stable scrollbar gutter means no layout or
     scroll-position jump on release.
     ---------------------------------------------------------------------- */

  var scrollLock = (function () {
    var root = document.documentElement;
    var locked = false;
    var onInput = noop;
    var onRelease = noop;

    var BLOCKED_KEYS = {
      " ": 1,
      Spacebar: 1,
      ArrowUp: 1,
      ArrowDown: 1,
      PageUp: 1,
      PageDown: 1,
      Home: 1,
      End: 1
    };

    function blockScroll(event) {
      event.preventDefault();
      onInput();
    }

    function blockKeys(event) {
      if (BLOCKED_KEYS[event.key]) {
        event.preventDefault();
        onInput();
      }
    }

    return {
      get locked() {
        return locked;
      },
      onInput: function (fn) {
        onInput = fn;
      },
      onRelease: function (fn) {
        onRelease = fn;
      },
      lock: function () {
        if (locked) return;
        locked = true;
        window.scrollTo(0, 0);
        root.classList.add("is-locked");
        window.addEventListener("wheel", blockScroll, { passive: false });
        window.addEventListener("touchmove", blockScroll, { passive: false });
        window.addEventListener("keydown", blockKeys);
      },
      unlock: function () {
        if (!locked) return;
        locked = false;
        root.classList.remove("is-locked");
        window.removeEventListener("wheel", blockScroll);
        window.removeEventListener("touchmove", blockScroll);
        window.removeEventListener("keydown", blockKeys);
        if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
        onRelease();
      }
    };
  })();

  /* ======================================================================
     SECTION A — BRAND HERO
     ====================================================================== */

  function initHero() {
    var hero = document.getElementById("hero");
    var brand = document.getElementById("hero-brand");
    if (!hero || !brand) return { reveal: noop };

    function show() {
      if (!hasGSAP || reduced) {
        hero.classList.add("is-static");
        return;
      }
      gsap.fromTo(
        brand,
        { opacity: 0, y: 12, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.05,
          ease: "expo.out",
          overwrite: true
        }
      );
    }

    return { reveal: show };
  }

  /* ======================================================================
     SECTION 0 — OPENING MOMENT
     ====================================================================== */

  var SCRAMBLE_GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789/\\<>*#~=+-_∅";

  function scrambleString(text, resolved) {
    var out = "";
    for (var i = 0; i < text.length; i += 1) {
      var ch = text.charAt(i);
      if (ch === " " || i < resolved) {
        out += ch;
      } else {
        out += SCRAMBLE_GLYPHS.charAt(
          (Math.random() * SCRAMBLE_GLYPHS.length) | 0
        );
      }
    }
    return out;
  }

  function initIntro(fold) {
    var intro = document.getElementById("intro");
    if (!intro) {
      fold.reveal();
      return;
    }

    var inner = document.getElementById("intro-inner");
    var veil = document.getElementById("intro-veil");
    var head = document.getElementById("intro-head");
    var sub = document.getElementById("intro-sub");
    var cue = document.getElementById("intro-cue");
    var rule = intro.querySelector(".intro__rule");
    var words = intro.querySelectorAll(".intro__word");
    var inners = intro.querySelectorAll(".intro__word-in");
    var chrome = document.querySelectorAll(".nr-nav, .nr-corner");
    var subText = sub ? sub.textContent : "";

    var dismissed = false;
    var timeline = null;

    /* Any scroll attempt during the lock speeds the reveal up rather than
       stalling the visitor — it can still only end in a finished state. */
    scrollLock.onInput(function () {
      if (timeline) timeline.timeScale(2.8);
    });

    scrollLock.onRelease(function () {
      window.addEventListener("scroll", onScroll, { passive: true });
    });

    function unlock() {
      scrollLock.unlock();
    }

    function remove() {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      window.removeEventListener("scroll", onScroll);
      if (hasGSAP && !reduced) {
        gsap.to(intro, {
          autoAlpha: 0,
          duration: 0.34,
          ease: "power2.out",
          onComplete: remove
        });
      } else {
        remove();
      }
    }

    function onScroll() {
      if (window.pageYOffset > 0) dismiss();
    }

    /* --- no GSAP, or reduced motion: present the same words, no animation - */
    if (!hasGSAP || reduced) {
      intro.classList.add("is-static");
      fold.reveal();
      scrollLock.unlock();
      window.addEventListener("scroll", onScroll, { passive: true });
      return;
    }

    gsap.set(chrome, { autoAlpha: 0 });
    gsap.set(rule, { scaleX: 0, transformOrigin: "0% 50%" });
    gsap.set(words, { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set(inners, { xPercent: -12 });
    gsap.set(sub, { autoAlpha: 0 });
    gsap.set(cue, { autoAlpha: 0, y: 10 });

    function buildScramble() {
      var state = { progress: 0 };
      return gsap.to(state, {
        progress: 1,
        duration: 0.78,
        ease: "power2.inOut",
        onStart: function () {
          sub.textContent = scrambleString(subText, 0);
        },
        onUpdate: function () {
          var resolved = Math.floor(state.progress * subText.length);
          sub.textContent = scrambleString(subText, resolved);
        },
        onComplete: function () {
          sub.textContent = subText;
        }
      });
    }

    var EXIT = 2.02;

    timeline = gsap.timeline({
      defaults: { ease: "expo.out" },
      onComplete: function () {
        unlock();
      }
    });

    timeline
      /* the hairline strikes first — everything else hangs off it */
      .to(rule, { scaleX: 1, duration: 0.5 }, 0)
      /* headline: hard left-to-right clip wipe, no fade */
      .to(
        words,
        {
          clipPath: "inset(-10% -4% -16% 0%)",
          duration: 0.58,
          stagger: 0.075
        },
        0.26
      )
      .to(inners, { xPercent: 0, duration: 0.58, stagger: 0.075 }, 0.26)
      .to(rule, { opacity: 0.24, duration: 0.5, ease: "power2.out" }, 0.54)
      /* subline: mono scramble, one beat behind the headline */
      .set(sub, { autoAlpha: 1 }, 0.52)
      .add(buildScramble(), 0.52)

      /* --- hold, then break --- */
      .call(
        function () {
          head.classList.add("is-glitch");
        },
        null,
        EXIT - 0.2
      )
      .call(
        function () {
          head.classList.remove("is-glitch");
        },
        null,
        EXIT + 0.02
      )
      .fromTo(
        inner,
        { clipPath: "inset(0% 0% 0% 0%)" },
        {
          clipPath: "inset(50% 0% 50% 0%)",
          duration: 0.34,
          ease: "power4.in"
        },
        EXIT
      )
      .to(inner, { autoAlpha: 0, duration: 0.16 }, EXIT + 0.24)
      /* the black lifts and the brand is already there behind it */
      .call(
        function () {
          fold.reveal();
        },
        null,
        EXIT + 0.14
      )
      .to(
        veil,
        { autoAlpha: 0, duration: 0.72, ease: "power2.inOut" },
        EXIT + 0.16
      )
      .to(
        chrome,
        { autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: "power2.out" },
        EXIT + 0.46
      )
      .to(cue, { autoAlpha: 1, y: 0, duration: 0.62 }, EXIT + 0.58)
      .call(unlock, null, EXIT + 0.78);
  }

  /* ======================================================================
     SECTION B — HOMEPAGE
     ====================================================================== */

  function initReveals() {
    if (!hasGSAP || reduced) return;
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal]")
    );
    nodes.forEach(function (node) {
      gsap.from(node, {
        y: 28,
        autoAlpha: 0,
        duration: 0.95,
        ease: "expo.out",
        scrollTrigger: {
          trigger: node,
          start: "top 88%",
          once: true
        }
      });
    });
  }

  function initMagnetic() {
    var stage = document.getElementById("cta-stage");
    if (!stage || !hasGSAP || reduced || coarse) return;

    var button = stage.querySelector(".enter");
    var label = stage.querySelector(".enter__inner");
    if (!button || !label) return;

    var moveX = gsap.quickTo(button, "x", { duration: 0.55, ease: "expo.out" });
    var moveY = gsap.quickTo(button, "y", { duration: 0.55, ease: "expo.out" });
    var labelX = gsap.quickTo(label, "x", { duration: 0.7, ease: "expo.out" });
    var labelY = gsap.quickTo(label, "y", { duration: 0.7, ease: "expo.out" });

    var rect = null;
    var clamp = gsap.utils.clamp(-26, 26);

    function measure() {
      rect = button.getBoundingClientRect();
    }

    function reset() {
      rect = null;
      moveX(0);
      moveY(0);
      labelX(0);
      labelY(0);
    }

    stage.addEventListener("pointerenter", measure);
    stage.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", function () {
      if (rect) measure();
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (rect) measure();
    });

    stage.addEventListener(
      "pointermove",
      function (event) {
        if (!rect) measure();
        var dx = event.clientX - (rect.left + rect.width / 2);
        var dy = event.clientY - (rect.top + rect.height / 2);
        moveX(clamp(dx * 0.3));
        moveY(clamp(dy * 0.42));
        labelX(clamp(dx * 0.1));
        labelY(clamp(dy * 0.14));
      },
      { passive: true }
    );
  }

  function initExitRift() {
    var rift = document.getElementById("rift");

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var target = event.target;
      if (!target || typeof target.closest !== "function") return;

      var link = target.closest("a[data-nr-exit]");
      if (!link) return;
      if (link.target && link.target !== "_self") return;

      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;

      /* Without GSAP, reduced motion, or the rift element, the plain link wins. */
      if (!rift || !hasGSAP || reduced) return;

      event.preventDefault();
      gsap.set(rift, { visibility: "visible", scaleX: 0 });
      gsap.to(rift, {
        scaleX: 1,
        duration: 0.38,
        ease: "power4.inOut",
        onComplete: function () {
          window.location.href = href;
        }
      });
    });

    window.addEventListener("pageshow", function (event) {
      if (event.persisted && rift && hasGSAP) {
        gsap.set(rift, { visibility: "hidden", scaleX: 0 });
      }
    });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */

  function boot() {
    var fold = initHero();
    initReveals();
    initMagnetic();
    initExitRift();

    /* Lock first, ask questions later: the hero must never be reachable
       before the opening moment has played out. */
    if (hasGSAP && !reduced && document.getElementById("intro")) {
      scrollLock.lock();
      /* Never leave the page locked — or the brand invisible — if anything
         downstream fails to resolve the opening moment. */
      window.setTimeout(function () {
        if (!scrollLock.locked) return;
        var stuck = document.getElementById("intro");
        if (stuck && stuck.parentNode) stuck.parentNode.removeChild(stuck);
        fold.reveal();
        scrollLock.unlock();
      }, 9000);
    }

    /* Hold the opening moment until the display face is real, so the wipe
       never resolves onto fallback glyphs. */
    var started = false;
    var start = function () {
      if (started) return;
      started = true;
      initIntro(fold);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start).catch(start);
      window.setTimeout(start, 1200);
    } else {
      start();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
