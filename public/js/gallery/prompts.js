/* ==========================================================================
   Catalogue metadata for each exhibit.

   Deliberately NOT the prompt bodies. Everything in this file is already
   visible on the cards, so it is safe to ship to the browser. The prompt text
   itself is the product — it lives in api/_data/prompt-bodies.js, is never
   served as a static asset, and is only released by api/prompt.js to a
   request that proves who it is.

   `kind` decides which shelf an entry lives on: 'animation' is a drop-in
   section (gallery.html), 'template' is a complete page (templates.html).
   ========================================================================== */

export const PROMPTS = {
  '01': {
    id: '01',
    kind: 'animation',
    title: 'Liquid Chrome Field',
    tech: 'WebGL · FBO fluid · Stable Fluids',
    use: 'Hero mastheads that liquefy under pointer velocity.',
    file: 'NR-01-liquid-chrome-field.md'
  },

  '02': {
    id: '02',
    kind: 'animation',
    title: 'Cauchy Lattice',
    tech: 'WebGL2 · Cauchy lens · Jacobian caustics',
    use: 'Spacetime-fold heroes steered by a pointer singularity.',
    file: 'NR-02-cauchy-lattice.md'
  },

  '03': {
    id: '03',
    kind: 'animation',
    title: 'Respirant Type',
    tech: 'DOM · Variable axes · Per-glyph springs',
    use: 'Editorial headlines that thicken toward the reader.',
    file: 'NR-03-respirant-type.md'
  },

  '04': {
    id: '04',
    kind: 'animation',
    title: 'Routed Rift',
    tech: 'SVG · Octilinear autorouter',
    use: 'Self-drawing schematics for process and architecture sections.',
    file: 'NR-04-routed-rift.md'
  },

  '05': {
    id: '05',
    kind: 'animation',
    title: 'Null Cloud',
    tech: 'WebGL · GPU points · Inertial scrub',
    use: 'Scroll-scrubbed formation morphs for feature reveals.',
    file: 'NR-05-null-cloud.md'
  },

  '06': {
    id: '06',
    kind: 'animation',
    title: 'Impact Grid',
    tech: 'DOM · CSS 3D · Wave-front springs',
    use: 'Tactile tile grids that answer every click with a shockwave.',
    file: 'NR-06-impact-grid.md'
  },

  '07': {
    id: '07',
    kind: 'animation',
    title: 'Product Orbit',
    tech: 'DOM · Elliptical orbit · Scrub + detent',
    use: 'Product pickers that feel like operating premium machinery.',
    file: 'NR-07-product-orbit.md'
  },

  '08': {
    id: '08',
    kind: 'animation',
    title: 'Dot Reveal',
    tech: 'Canvas 2D · Image-sampled dot field · Spotlight mask',
    use: 'Portrait and product reveals that make the visitor go looking.',
    file: 'NR-08-dot-reveal.md'
  },

  '09': {
    id: '09',
    kind: 'template',
    title: 'Oblique',
    tech: 'Full page · GSAP · custom smooth scroll',
    use: 'Portfolio and case-study indexes that should feel like prints on a table.',
    file: 'NR-09-oblique-grid.md'
  }
};

/* How many of each kind exist, across both shelves. The gallery and the
   templates page each only hold their own cards, but the switch between them
   quotes both counts — so they come from here, the one table that knows the
   whole catalogue, rather than being typed into two pages and left to drift. */
export function countByKind() {
  const out = { animation: 0, template: 0 };
  Object.keys(PROMPTS).forEach((key) => {
    const kind = PROMPTS[key].kind;
    if (kind in out) out[kind] += 1;
  });
  return out;
}

export function getPrompt(id) {
  if (id == null) return null;
  const key = String(id).padStart(2, '0');
  return PROMPTS[key] || PROMPTS[String(id)] || null;
}
