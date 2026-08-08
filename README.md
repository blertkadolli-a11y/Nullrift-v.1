# NULLRIFT

Scroll-driven motion studies for the open web. Plain HTML, CSS and JavaScript;
GSAP + ScrollTrigger from a CDN. No framework, no build step, no npm.

The homepage entrance is a retexture of `_source/fold-source.html` ("Fold Study
No. 04") — an impossible-fold sequence pinned across ~7.2 viewports. Its
geometry, three-act structure and every timing value are unchanged; only the
palette and the printed artwork are new.

## Run it

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080/>.

Any static file server works. There is nothing to install or compile.

## File map

```
index.html            homepage: opening moment + the fold + statement + CTA
gallery.html          the studies (owned separately)

css/base.css          shared brand tokens + site chrome  (every page)
css/index.css         homepage only
css/gallery.css       gallery only (owned separately)

js/chrome.js          shared chrome behaviour             (every page)
js/index.js           opening moment, the fold, homepage interactions
js/gallery/           gallery scripts (owned separately)

assets/null.svg           ∅ mark, cyan stroke, transparent
assets/favicon.svg        ∅ mark on black, sized for favicon use
assets/nullrift-logo.png  raster logo, PNG favicon fallback

_source/fold-source.html  the original study, kept for reference
```

## Shared contract

`css/base.css` + `js/chrome.js` are the only files both pages load. Anything
page-specific belongs in that page's own CSS/JS.

### Custom properties (on `:root`)

| Token                  | Value                                     |
| ---------------------- | ----------------------------------------- |
| `--void`               | `#000000`                                 |
| `--cyan`               | `#00ffdb`                                 |
| `--acid`               | `#00ff87`                                 |
| `--ash`                | `#888888`                                 |
| `--text`               | `#e6fbf6`                                 |
| `--hair`               | `rgba(0, 255, 219, 0.22)`                 |
| `--hair-soft`          | `rgba(255, 255, 255, 0.09)`               |
| `--font-display`       | `"Space Grotesk", …`                      |
| `--font-mono`          | `"JetBrains Mono", …`                     |
| `--font-body`          | `"Inter", …`                              |
| `--ease-out-expo`      | `cubic-bezier(0.16, 1, 0.3, 1)`           |
| `--ease-in-out-quart`  | `cubic-bezier(0.76, 0, 0.24, 1)`          |
| `--gutter`             | `clamp(1.05rem, 3.1vw, 2.75rem)`          |
| `--z-chrome`           | `100`                                     |
| `--z-grain`            | `9000`                                    |
| `--z-cursor`           | `10000`                                   |
| `--nr-grain-tex`       | noise tile (replaced at runtime)          |

### Chrome markup

Paste this into any page; `css/base.css` styles it and `js/chrome.js` wires it.

```html
<a class="nr-skip" href="#main">Skip to content</a>
<div class="nr-grain" aria-hidden="true"></div>
<div class="nr-cursor" aria-hidden="true"></div>
<header class="nr-nav">
  <a class="nr-nav__mark" href="index.html" aria-label="NULLRIFT home">
    <svg class="nr-nav__glyph" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="19"></circle>
      <path d="M14.68 49.32 49.32 14.68"></path>
    </svg>
    <span class="nr-nav__label">// NULLRIFT</span>
  </a>
  <nav class="nr-nav__links"><a href="gallery.html" class="nr-link">GALLERY</a></nav>
</header>
<div class="nr-corner nr-corner--bl">nullrift.design</div>
<div class="nr-corner nr-corner--br" data-nr-status>SYSTEM NOMINAL</div>
```

Classes styled by `css/base.css`: `.nr-skip`, `.nr-grain`, `.nr-cursor`
(`.is-active`, `.is-hover`, `.is-down`), `.nr-nav`, `.nr-nav__mark`,
`.nr-nav__glyph`, `.nr-nav__label`, `.nr-nav__links`, `.nr-link`, `.nr-corner`,
`.nr-corner--bl`, `.nr-corner--br` (`.is-glitch`), `.sr-only`. It also sets
`cursor: none` under `html.nr-cursor-on`, a class `js/chrome.js` adds only on
fine-pointer devices.

The nav glyph inherits `stroke: currentColor` and `fill: none` from
`.nr-nav__glyph`, so any inline ∅ SVG renders correctly without extra
attributes.

### Behaviour

`js/chrome.js` is loaded with `defer`, self-initialises on `DOMContentLoaded`,
takes no configuration, and does nothing if a chrome element is absent.

- **Cursor** — square cyan dot with lerped follow, a rotated square ring on
  hover. Reacts to `a`, `button`, `summary`, form controls, `[role="button"]`
  and `[data-cursor="hover"]` via delegation, so elements added later still
  work. Removed entirely on coarse/touch pointers, where the native cursor
  stays.
- **Grain** — one composited overlay tiled with a canvas-generated noise
  texture, drifted by a stepped CSS transform. No per-frame JavaScript.
- **Status flicker** — `[data-nr-status]` scrambles and resettles at irregular
  intervals, pausing while the tab is hidden.
- **Reduced motion** — `prefers-reduced-motion: reduce` disables the grain
  drift, the cursor lerp and the flicker.

`js/chrome.js` exports one global, `window.NR`, safe to load twice:

```js
NR.prefersReducedMotion; // boolean
NR.lerp(a, b, t); // number
```

## Notes

- Space Grotesk ships weights 300–700; display type is set at 700 (its
  heaviest real weight) rather than faux-bolding to 900.
- The homepage locks scroll while the opening moment plays and releases it the
  moment the reveal resolves, so the fold can never be scrolled into
  half-assembled. Release happens at scroll position 0 with a stable scrollbar
  gutter, so nothing jumps.
- Links marked `data-nr-exit` play a short cyan wipe before navigating. Without
  JavaScript, or with reduced motion, they are ordinary links.
