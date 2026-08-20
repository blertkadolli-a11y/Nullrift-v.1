/* ==========================================================================
   Catalogue metadata for each exhibit.

   Deliberately NOT the prompt bodies. Everything in this file is already
   visible on the cards, so it is safe to ship to the browser. The prompt text
   itself is the product — it lives in api/_data/prompt-bodies.js, is never
   served as a static asset, and is only released by api/prompt.js to a
   request that proves who it is.
   ========================================================================== */

export const PROMPTS = {
  '01': {
    id: '01',
    title: 'Liquid Chrome Field',
    tech: 'WebGL · FBO fluid · Stable Fluids',
    use: 'Hero mastheads that liquefy under pointer velocity.',
    file: 'NR-01-liquid-chrome-field.md'
  },

  '02': {
    id: '02',
    title: 'Cauchy Lattice',
    tech: 'WebGL2 · Cauchy lens · Jacobian caustics',
    use: 'Spacetime-fold heroes steered by a pointer singularity.',
    file: 'NR-02-cauchy-lattice.md'
  },

  '03': {
    id: '03',
    title: 'Respirant Type',
    tech: 'DOM · Variable axes · Per-glyph springs',
    use: 'Editorial headlines that thicken toward the reader.',
    file: 'NR-03-respirant-type.md'
  },

  '04': {
    id: '04',
    title: 'Routed Rift',
    tech: 'SVG · Octilinear autorouter',
    use: 'Self-drawing schematics for process and architecture sections.',
    file: 'NR-04-routed-rift.md'
  },

  '05': {
    id: '05',
    title: 'Null Cloud',
    tech: 'WebGL · GPU points · Inertial scrub',
    use: 'Scroll-scrubbed formation morphs for feature reveals.',
    file: 'NR-05-null-cloud.md'
  },

  '06': {
    id: '06',
    title: 'Impact Grid',
    tech: 'DOM · CSS 3D · Wave-front springs',
    use: 'Tactile tile grids that answer every click with a shockwave.',
    file: 'NR-06-impact-grid.md'
  },

  '07': {
    id: '07',
    title: 'Product Orbit',
    tech: 'DOM · Elliptical orbit · Scrub + detent',
    use: 'Product pickers that feel like operating premium machinery.',
    file: 'NR-07-product-orbit.md'
  },

  '08': {
    id: '08',
    title: 'Dot Reveal',
    tech: 'Canvas 2D · Image-sampled dot field · Spotlight mask',
    use: 'Portrait and product reveals that make the visitor go looking.',
    file: 'NR-08-dot-reveal.md'
  }
};

export function getPrompt(id) {
  if (id == null) return null;
  const key = String(id).padStart(2, '0');
  return PROMPTS[key] || PROMPTS[String(id)] || null;
}
