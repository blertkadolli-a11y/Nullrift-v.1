/* ==========================================================================
   NULLRIFT — index.js

   Section 0  the opening moment (scroll is locked until it resolves)
   Section A  the fold — ported verbatim from _source/fold-source.html.
              Geometry, act structure, durations, positions, staggers and
              easings are unchanged; only the printed artwork is new. The one
              sequencing change: the sheet's entrance tween is built paused and
              played the instant the opening moment clears, so the fold is
              never assembling behind an opaque overlay.
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
     SECTION A — THE FOLD
     ====================================================================== */

  function foldGlyph(className) {
    return (
      '<svg class="' +
      className +
      '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<circle cx="32" cy="32" r="19"></circle>' +
      '<path d="M14.68 49.32 49.32 14.68"></path>' +
      "</svg>"
    );
  }

  /* The recto keeps the source study's polygon coordinates — same composition,
     new palette — with the wordmark set in real type so it never distorts. */
  var FACET_MARKUP =
    '<div class="card">' +
    '<div class="face front">' +
    '<div class="plate">' +
    '<svg class="plate__geo" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<polygon class="geo--1" points="-8,7 31,-4 53,100 14,100"></polygon>' +
    '<polygon class="geo--2" points="66,0 100,0 100,31 77,43"></polygon>' +
    '<polygon class="geo--3" points="0,67 48,52 75,100 0,100"></polygon>' +
    '<polygon class="geo--2" points="53,27 100,49 100,59 49,38"></polygon>' +
    '<path class="geo-line" vector-effect="non-scaling-stroke" d="M-4 22 L104 80"></path>' +
    '<ellipse class="geo-line" vector-effect="non-scaling-stroke" cx="67" cy="42" rx="23" ry="23"></ellipse>' +
    '<ellipse class="geo-line geo-line--soft" vector-effect="non-scaling-stroke" cx="67" cy="42" rx="16" ry="16"></ellipse>' +
    "</svg>" +
    '<div class="plate__body">' +
    '<span class="plate__eyebrow">Motion system &mdash; study no. 04</span>' +
    '<span class="plate__mark">' +
    foldGlyph("plate__glyph") +
    '<span class="plate__divider"></span>' +
    '<span class="plate__word">NULLRIFT</span>' +
    "</span>" +
    '<span class="plate__rule"></span>' +
    '<span class="plate__meta"><span>Recto</span><span>100 &times; 100</span></span>' +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="face back">' +
    '<div class="plate plate--reverse">' +
    '<span class="plate__halo"></span>' +
    foldGlyph("plate__glyph plate__glyph--big") +
    "</div>" +
    "</div>" +
    "</div>";

  function initFold() {
    var story = document.getElementById("story");
    var pin = document.getElementById("pin");
    var sheet = document.getElementById("sheet");
    var facetHost = document.getElementById("facets");
    var creaseMap = document.querySelector(".crease-map");
    var reverseMap = document.querySelector(".reverse-map");
    var frames = Array.prototype.slice.call(
      document.querySelectorAll(".depth-frame")
    );
    var edgeFlash = document.querySelector(".edge-flash");

    if (!story || !pin || !sheet || !facetHost) return { reveal: noop };

    var desktopBounds = {
      x: [0, 11, 23, 34, 41],
      xr: [100, 89, 77, 66, 59],
      y: [0, 14, 27, 38, 44],
      yb: [100, 86, 73, 62, 56]
    };

    var mobileBounds = {
      x: [0, 8, 18, 29, 36],
      xr: [100, 92, 82, 71, 64],
      y: [0, 15, 29, 40, 44],
      yb: [100, 85, 71, 60, 56]
    };

    var facets = [];

    function pointsToPolygon(points) {
      return (
        "polygon(" +
        points
          .map(function (pair) {
            return pair[0] + "% " + pair[1] + "%";
          })
          .join(",") +
        ")"
      );
    }

    function createFacet(meta) {
      var facet = document.createElement("div");
      facet.className = "facet facet--" + meta.side;
      /* acid green lands on alternating facets only */
      if (facets.length % 2) facet.classList.add("facet--alt");
      facet.dataset.ring = meta.ring;
      facet.dataset.side = meta.side;
      facet.innerHTML = FACET_MARKUP;
      facetHost.appendChild(facet);
      facets.push({
        element: facet,
        ring: meta.ring,
        side: meta.side,
        core: meta.core
      });
    }

    for (var ring = 0; ring < 4; ring += 1) {
      ["top", "right", "bottom", "left"].forEach(function (side) {
        createFacet({ ring: ring, side: side, core: false });
      });
    }

    ["top", "right", "bottom", "left"].forEach(function (side) {
      createFacet({ ring: 4, side: side, core: true });
    });

    function geometryFor(meta, bounds) {
      var ringIndex = meta.ring;
      var outer =
        ringIndex < 4
          ? {
              left: bounds.x[ringIndex],
              right: bounds.xr[ringIndex],
              top: bounds.y[ringIndex],
              bottom: bounds.yb[ringIndex]
            }
          : {
              left: bounds.x[4],
              right: bounds.xr[4],
              top: bounds.y[4],
              bottom: bounds.yb[4]
            };
      var inner =
        ringIndex < 4
          ? {
              left: bounds.x[ringIndex + 1],
              right: bounds.xr[ringIndex + 1],
              top: bounds.y[ringIndex + 1],
              bottom: bounds.yb[ringIndex + 1]
            }
          : { left: 50, right: 50, top: 50, bottom: 50 };

      var shapes = {
        top: [
          [outer.left, outer.top],
          [outer.right, outer.top],
          [inner.right, inner.top],
          [inner.left, inner.top]
        ],
        right: [
          [outer.right, outer.top],
          [outer.right, outer.bottom],
          [inner.right, inner.bottom],
          [inner.right, inner.top]
        ],
        bottom: [
          [outer.right, outer.bottom],
          [outer.left, outer.bottom],
          [inner.left, inner.bottom],
          [inner.right, inner.bottom]
        ],
        left: [
          [outer.left, outer.bottom],
          [outer.left, outer.top],
          [inner.left, inner.top],
          [inner.left, inner.bottom]
        ]
      };

      var origins = {
        top: "50% " + outer.top + "%",
        right: outer.right + "% 50%",
        bottom: "50% " + outer.bottom + "%",
        left: outer.left + "% 50%"
      };

      return {
        clipPath: pointsToPolygon(shapes[meta.side]),
        transformOrigin: meta.core ? "50% 50%" : origins[meta.side]
      };
    }

    function applyGeometry(isMobile) {
      var bounds = isMobile ? mobileBounds : desktopBounds;
      facets.forEach(function (facet) {
        var geometry = geometryFor(facet, bounds);
        facet.element.style.clipPath = geometry.clipPath;
        facet.element.style.webkitClipPath = geometry.clipPath;
        facet.element.style.transformOrigin = geometry.transformOrigin;
      });
    }

    applyGeometry(window.matchMedia("(max-width: 700px)").matches);

    if (!hasGSAP) {
      document.body.classList.add("static-reverse");
      return { reveal: noop };
    }

    gsap.registerPlugin(ScrollTrigger);

    var elements = facets.map(function (facet) {
      return facet.element;
    });
    var cards = elements.map(function (element) {
      return element.querySelector(".card");
    });

    if (reduced) {
      gsap.set(sheet, { opacity: 1 });
      gsap.set(cards, { rotationY: 180, force3D: true });
      gsap.set(creaseMap, { opacity: 0 });
      gsap.set(reverseMap, { opacity: 0.82 });
      return { reveal: noop };
    }

    gsap.set(elements, {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      opacity: 1,
      force3D: true
    });
    gsap.set(cards, {
      rotationY: 0,
      force3D: true
    });
    gsap.set(frames, {
      xPercent: -50,
      yPercent: -50,
      scale: function (index) {
        return 0.72 + index * 0.07;
      },
      z: function (index) {
        return -480 - index * 170;
      },
      rotationZ: function (index) {
        return index % 2 ? 4 : -4;
      },
      opacity: 0,
      force3D: true
    });
    gsap.set(edgeFlash, {
      xPercent: -50,
      yPercent: -50,
      scale: 0.32,
      rotationZ: 45,
      opacity: 0,
      force3D: true
    });

    /* Same tween as the source study, held until the opening moment clears. */
    var entrance = gsap.fromTo(
      sheet,
      { opacity: 0, scale: 1.035, z: -30 },
      {
        opacity: 1,
        scale: 1,
        z: 0,
        duration: 1.25,
        ease: "power4.out",
        paused: true
      }
    );

    var sideAxis = {
      top: "x",
      right: "y",
      bottom: "x",
      left: "y"
    };

    var towardSign = {
      top: 1,
      right: 1,
      bottom: -1,
      left: -1
    };

    var recessSign = {
      top: -1,
      right: -1,
      bottom: 1,
      left: 1
    };

    function axisRotation(meta, amount, signs) {
      return sideAxis[meta.side] === "x"
        ? { rotationX: signs[meta.side] * amount, rotationY: 0 }
        : { rotationX: 0, rotationY: signs[meta.side] * amount };
    }

    function rotationValue(axis, phase, index) {
      var meta = facets[index];
      var amounts = {
        tension: [2.4, 4.2, 5.4, 7.2, 10],
        cross: [34, 56, 69, 78, 84],
        tunnel: [28, 46, 63, 77, 86]
      };
      var signs = phase === "tunnel" ? recessSign : towardSign;
      var direction = phase === "cross" && meta.ring % 2 ? -1 : 1;
      var rotation = axisRotation(
        meta,
        amounts[phase][meta.ring] * direction,
        signs
      );
      return axis === "x" ? rotation.rotationX : rotation.rotationY;
    }

    function buildStory(isMobile) {
      applyGeometry(isMobile);

      var tunnelDepths = isMobile
        ? [70, -125, -330, -570, -860]
        : [80, -80, -245, -430, -680];
      var crossDepths = isMobile
        ? [130, 310, 90, 390, 520]
        : [120, 270, 80, 330, 470];

      var timeline = gsap.timeline({
        defaults: { ease: "power4.out" },
        scrollTrigger: {
          trigger: story,
          start: "top top",
          // 7.2 viewports gives the folds enough physical weight; the aperture
          // reaches camera-threshold around 59% rather than flashing past.
          end: function () {
            return "+=" + Math.round(window.innerHeight * 7.2);
          },
          pin: pin,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      /*
        ACT I — FLAT / TENSION
        Alternating hinges lift only a few degrees. The printed image remains
        continuous, so the viewport still reads as one stressed sheet.
      */
      timeline
        .to(
          creaseMap,
          {
            opacity: 0.96,
            scale: 1.003,
            duration: 0.72
          },
          0
        )
        .to(
          elements,
          {
            rotationX: function (index) {
              return rotationValue("x", "tension", index);
            },
            rotationY: function (index) {
              return rotationValue("y", "tension", index);
            },
            z: function (index) {
              return (
                (facets[index].ring % 2 ? -1 : 1) * (10 + facets[index].ring * 8)
              );
            },
            duration: 1.16,
            stagger: 0.08,
            ease: "expo.out"
          },
          0.22
        )
        .to(
          elements,
          {
            z: function (index) {
              return facets[index].side === "top" || facets[index].side === "left"
                ? 34 + facets[index].ring * 12
                : -18 - facets[index].ring * 10;
            },
            rotationZ: function (index) {
              return (index % 2 ? 0.22 : -0.22) * (facets[index].ring + 1);
            },
            duration: 0.82,
            stagger: 0.08,
            ease: "expo.out"
          },
          1.02
        )
        .to(
          creaseMap,
          {
            opacity: 0.28,
            duration: 0.58
          },
          1.46
        );

      /*
        ACT II — IMPOSSIBLE FOLD / PASSAGE
        Concentric rings alternate their hinge direction while crossing in Z.
        This deliberate interpenetration is the physical impossibility.
      */
      timeline
        .to(
          elements,
          {
            rotationX: function (index) {
              return rotationValue("x", "cross", index);
            },
            rotationY: function (index) {
              return rotationValue("y", "cross", index);
            },
            rotationZ: 0,
            z: function (index) {
              return crossDepths[facets[index].ring];
            },
            scale: function (index) {
              return facets[index].core ? 1.12 : 1;
            },
            duration: 1.32,
            stagger: 0.08,
            ease: "expo.out"
          },
          1.7
        )
        .to(
          frames,
          {
            opacity: function (index) {
              return 0.95 - index * 0.12;
            },
            scale: function (index) {
              return 0.98 - index * 0.06;
            },
            rotationZ: function (index) {
              return index % 2 ? -2 : 2;
            },
            duration: 0.92,
            stagger: 0.08,
            ease: "expo.out"
          },
          2.22
        )
        .to(
          edgeFlash,
          {
            opacity: 0.94,
            scale: 1,
            rotationZ: 45,
            duration: 0.74
          },
          2.36
        )
        .to(
          edgeFlash,
          {
            opacity: 0,
            scale: 1.62,
            duration: 0.64
          },
          2.98
        )
        .to(
          elements,
          {
            rotationX: function (index) {
              return rotationValue("x", "tunnel", index);
            },
            rotationY: function (index) {
              return rotationValue("y", "tunnel", index);
            },
            z: function (index) {
              return tunnelDepths[facets[index].ring];
            },
            scale: function (index) {
              return facets[index].core ? 0.72 : 1;
            },
            opacity: function (index) {
              return facets[index].core ? 0.08 : 1;
            },
            duration: 1.58,
            stagger: 0.08,
            ease: "expo.out"
          },
          2.86
        )
        .to(
          frames,
          {
            z: function (index) {
              return -100 - index * (isMobile ? 155 : 120);
            },
            scale: function (index) {
              return 1.08 - index * 0.09;
            },
            rotationZ: function (index) {
              return index % 2 ? 5 : -5;
            },
            duration: 1.34,
            stagger: 0.08,
            ease: "expo.out"
          },
          3.08
        )
        .to(
          sheet,
          {
            scale: isMobile ? 4.65 : 3.85,
            z: isMobile ? 390 : 460,
            duration: 1.5
          },
          4.18
        )
        .to(
          frames,
          {
            scale: function (index) {
              return (1.72 - index * 0.13) * (isMobile ? 1.24 : 1);
            },
            z: function (index) {
              return 160 + index * 70;
            },
            duration: 1.38,
            stagger: 0.08,
            ease: "expo.out"
          },
          4.22
        )
        // Hold at camera-threshold; the inside-out crossing crests near 62%.
        .to({}, { duration: 0.54 });

      /*
        ACT III — INSIDE-OUT CODA
        The sheet is larger than the viewport while every facet rolls onto
        its back. It then returns as a single cyan-marked plane.
      */
      timeline
        .to(
          elements,
          {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            z: 0,
            scale: 1,
            opacity: 1,
            duration: 1.42,
            stagger: {
              each: 0.08,
              from: "center"
            },
            ease: "expo.out"
          },
          6.18
        )
        .to(
          cards,
          {
            rotationY: 180,
            duration: 1.42,
            stagger: {
              each: 0.08,
              from: "center"
            },
            ease: "expo.out"
          },
          6.18
        )
        .to(
          frames,
          {
            opacity: 0,
            scale: 2.2,
            duration: 0.72,
            stagger: 0.08,
            ease: "expo.out"
          },
          6.18
        )
        .to(
          sheet,
          {
            scale: 1,
            z: 0,
            duration: 1.5
          },
          6.34
        )
        .to(
          reverseMap,
          {
            opacity: 0.78,
            duration: 0.64
          },
          7.14
        )
        .to(
          creaseMap,
          {
            opacity: 0,
            duration: 0.42
          },
          7.14
        )
        .to(
          elements.filter(function (_, index) {
            return index >= 12 && index <= 17;
          }),
          {
            rotationX: function (index) {
              return index % 2 ? 0 : 17;
            },
            rotationY: function (index) {
              return index % 2 ? -17 : 0;
            },
            z: function (index) {
              return index % 2 ? 82 : 118;
            },
            duration: 0.58,
            stagger: 0.08,
            ease: "expo.out"
          },
          8.02
        )
        .to(
          elements.filter(function (_, index) {
            return index >= 12 && index <= 17;
          }),
          {
            rotationX: 0,
            rotationY: 0,
            z: 0,
            duration: 0.32,
            stagger: 0.08,
            ease: "expo.out"
          },
          8.62
        )
        // The dead-flat ending is held long enough to compare both sides.
        .to({}, { duration: 1.16 });

      return function () {
        timeline.kill();
      };
    }

    var media = gsap.matchMedia();
    media.add(
      {
        isMobile: "(max-width: 700px)",
        isDesktop: "(min-width: 701px)"
      },
      function (context) {
        return buildStory(context.conditions.isMobile);
      }
    );

    return {
      reveal: function () {
        entrance.play();
      }
    };
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
      /* the black lifts and the fold is already there behind it */
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
    var fold = initFold();
    initReveals();
    initMagnetic();
    initExitRift();

    /* Lock first, ask questions later: the fold must never be reachable
       before the opening moment has played out. */
    if (hasGSAP && !reduced && document.getElementById("intro")) {
      scrollLock.lock();
      /* Never leave the page locked — or the sheet invisible — if anything
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
