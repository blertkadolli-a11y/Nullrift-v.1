/* ==========================================================================
   THE PRODUCT.

   This file sits outside public/, so Vercel never serves it as a static
   asset and there is no URL that returns it. It is imported only by
   api/prompt.js, which releases a single body per request and only after
   checking the caller's session.

   Do not import this from anything under public/ — that would ship the whole
   catalogue to every visitor again, which is the exact hole this closes.
   ========================================================================== */

export const BODIES = {
  '01': `Build a production-ready interactive WebGL fluid field for a premium site hero.

TECHNICAL REQUIREMENTS
- Three.js via ESM/CDN. No build step. No physics library.
- GPU Stable Fluids (Jos Stam style) on ping-pong FBOs, in this order each frame:
  1. splat pointer velocity into the velocity field along the pointer trail segment
  2. splat dye (density + heat + phase) along the same trail
  3. compute curl, apply vorticity confinement
  4. compute divergence
  5. Jacobi pressure solve (about 16–26 iterations)
  6. subtract pressure gradient from velocity
  7. advect velocity with decay
  8. advect dye with per-channel decay
- Prefer half-float render targets. If unavailable, pack signed fields into UNSIGNED_BYTE around 0.5 with a documented encode/decode scale.
- Cap devicePixelRatio at 2. On small viewports, lower simulation and dye grid resolution while keeping the same look.
- Handle webglcontextlost and webglcontextrestored cleanly.
- If WebGL cannot be created, fall back to a Canvas 2D composed still of the same visual identity — not a blank stage.
- Export create({ root, reduced }) → { resize, update, activate, deactivate, destroy }.
- Parent page owns the RAF and calls update(dt). activate/deactivate pause work when offscreen.
- prefers-reduced-motion: seed once, run a short offline settle, freeze. update() is a no-op after that.

VISUAL IDENTITY
- Near-black ground (about #030304). Mercury / liquid-chrome surface.
- Cool silver metal with multi-stop thin-film iridescence (magenta, violet, teal, gold) in high-curvature / high-speed regions.
- Distort an underlying wordmark substrate so large centered typography reads through the fluid, not as a sticker on top. Sample a heavy geometric sans (Space Grotesk 700/900 or equivalent); the drawn string is buyer-substitutable brand typography, not a fixed product name.
- Include subtle shader grain. Sharp edges only. No rounded cards. No purple-on-white UI chrome.

INTERACTION
- Pointer and touch velocity inject momentum (direction + magnitude) along the pointer trail segment.
- Until first real interaction, run a quiet idle injector (slow phantom path + rare accents) so the surface is alive. After first contact, idle injection stops.
- Dissipation/decay returns the surface to rest when the pointer stops.
- Hint label: "MOVE POINTER TO STIR" — mute it after first contact.

DELIVERABLE
- Single self-contained module: create({ root, reduced }) → { resize, update, activate, deactivate, destroy }.
- One-line use case: "Hero mastheads that liquefy under pointer velocity."`,

  '02': `Build a production-ready interactive WebGL2 gravitational-lens spacetime fold — a continuous “Cauchy Lattice.”

TECHNICAL REQUIREMENTS
- WebGL2 only. Fullscreen (or stage-filling) canvas, no depth/stencil, antialias off, high-performance, opaque. No build step, no frameworks.
- Vertex: attribute-less fullscreen triangle (gl_VertexID). Fragment: highp GLSL ES 3.00.
- Dual-stage lensWarp(p, center, mass, twist): soft gravitational pull, spin/frame-drag, Schwarzschild-like soft horizon fold mixing toward radial inversion.
- Second opposing weaker lens at anti-pointer (−ptr * ~0.45) for richer fold / moiré.
- Finite-difference Jacobian of the composed warp → caustic ridges where space folds.
- Lattice = major grid + finer offset minor grid + rotated diagonal grid + radial rings/spokes around the singularity, all sampled in warped space. Compare to unwarped Euclidean grid for copper moiré.
- Potential filaments via log-distance + soft noise isolines, stronger near horizon.
- Expanding impulse shell (Gaussian ring on |dist − shellR|) fired on pointerdown, decaying ~1.35/s.
- Brand relief: offscreen 2D canvas paints substitutable heavy display typography (Syne 800 or equivalent, slight blur pass) → GL texture; warp-displaced UVs sample it so glyphs densify the continuum (steel edge / copper core) — not a flat HTML overlay.
- Soft vignette, intro fade (~1.55s smoothstep), subtle hash grain, mild gamma (~0.9). Idle breathe on mass when motion allowed; pulse on lattice brightness.
- Uniforms: resolution, time, pointer, press, intro, reduced flag, impulse, word texture.
- Cap devicePixelRatio at 2. Pointer Events (mouse + touch). Exponential damping on pointer (~11) and press (~7.5). Press/hold deepens mass, twist, density, horizon, and caustics.
- Export create({ root, reduced }) → { resize, update, activate, deactivate, destroy }. Parent page owns RAF and offscreen pause.
- If WebGL2 unavailable: composed still of the same visual identity — not blank.
- prefers-reduced-motion: freeze to a gentle static fold (no idle pulse / no impulse chase), brand readable — not blank.

VISUAL IDENTITY
- Near-black ground (#040506 / #0b0e12). Steel #9db0c4, copper #c49a6c, rift cyan #6ec4c8. Ink #e8ebef.
- Chromatic split must be cyan (rift) vs copper — never red/blue or purple pairs. No purple/violet/indigo “AI glow” aesthetic.
- No particle confetti, starfields, or floating orbs as the main idea. Spacetime geometry is the material.

INTERACTION
- Pointer steers the singularity. Press to deepen the fold. Release to settle. Impulse ring on down.
- Hint: "MOVE · PRESS · RELEASE".

DELIVERABLE
- Single self-contained module with the API above.
- Use case: "Spacetime-fold heroes steered by a pointer singularity."`,

  '03': `Build a production-ready kinetic typography system with zero canvas and zero WebGL.

TECHNICAL REQUIREMENTS
- Pure DOM/CSS/JS. Every glyph is its own element.
- Use a real variable font (Roboto Flex from Google Fonts). Per glyph, drive font-variation-settings for wght, wdth, GRAD, slnt, and opsz from a proximity falloff field plus scroll velocity.
- Per-glyph spring damping so weight/width/grade/slant settle smoothly.
- RGB chromatic fringes on display glyphs (red #FF0033 and blue #0038FF, screen blend) that offset with motion and re-converge at rest.
- Also apply light per-glyph translate, skewX, and scaleY from the same field so scroll velocity visibly shears the line.
- When no pointer is present, drive the field from a slow ambient Lissajous path so the type keeps breathing. Disable ambient motion under prefers-reduced-motion.
- Do not own a requestAnimationFrame. Export create({ root, reduced }) → { resize, update, activate, deactivate, destroy } and let the parent page tick update(dt).
- prefers-reduced-motion: render a hand-set weight/width gradient still — deliberate, readable, not a frozen accident.
- Must work at 360px wide. Use pointer events so touch proximity works.

VISUAL IDENTITY
- Ground #08080A. Type #F2F0EA. Fringes #FF0033 and #0038FF.
- Large editorial lockup on two display lines (e.g. "TYPE THAT" / "BREATHES") plus supporting mono lines for axis copy.
- JetBrains Mono for labels and readouts. Sharp edges only.

INTERACTION
- Pointer proximity thickens and widens nearby glyphs.
- Scroll velocity shears slant and vertical scale.
- Hint: "MOVE ACROSS THE TYPE · SCROLL TO SHEAR".

DELIVERABLE
- Single self-contained module with the API above.
- Use case: "Editorial headlines that thicken toward the reader."`,

  '04': `Build a production-ready generative SVG autorouter that feels like a live phosphor schematic.

TECHNICAL REQUIREMENTS
- SVG only for the drawing surface. No canvas, no WebGL.
- Octilinear autorouter on a warped lattice (8 directions, 45° steps). Routes grow from a seed, never reuse occupied edges, and terminate on pads.
- Pad shapes must include squares, diamonds, and circles.
- Stroke-dash reveal while growing. On reseed, morph trunk paths and rebuild branches.
- Energy packets travel along live routes and fork at junctions.
- Click/tap to reseed at the pointer. Mouse hover energises the nearest branch (brighter + amber). Ignore hover energise for touch pointers.
- While idle, keep the plate alive with trunk pulses and occasional leaf micro-reroutes (~4.5–8s). This is not a morph autoplay; it is quiet network activity.
- Drive everything from update(dt). Parent page owns RAF and offscreen pause.
- prefers-reduced-motion: show a finished composed network immediately. No growth animation.

VISUAL IDENTITY
- Phosphor green #39FF6A on #03110A. Amber #FFB000 for energy. Hot near-white greens for peaks.
- Scanlines, soft radial vignette, dotted grid. Pads as squares, diamonds, and circles.
- Monospace HUD for seed coordinates and counts. Sharp edges only.

INTERACTION
- Click to reseed. Hover (mouse) to energise.
- Hint: "CLICK ANYWHERE TO RESEED THE NETWORK".

DELIVERABLE
- Single self-contained module with the API above.
- Use case: "Self-drawing schematics for process and architecture sections."`,

  '05': `Build a production-ready GPU point-cloud morph that the user scrubs by hand — matching exhibit "Null Cloud".

TECHNICAL REQUIREMENTS
- Three.js Points in a single draw call. Bake six target formations into vertex attributes and morph on the GPU.
- Formations, in order: NULL GLYPH (sampled ∅), TORN SHELL, TREFOIL KNOT, DATA LATTICE, SPIRAL DRIFT, WORDMARK (sampled heavy sans typography — buyer substitutes their own lockup string).
- Scrub progress with horizontal drag and wheel. Apply inertia and snap toward formation indices. Never autoplay the morph progress.
- Idle rotation/flow is fine and expected: slow yaw, light bob, shader flow over time. The morph sequence itself must stay user-driven.
- Cap devicePixelRatio at 2. Scale point count with viewport (roughly 15k–96k).
- Keep points readable on black: larger point size and stronger alpha for sparse formations (especially DATA LATTICE) and during morph midpoints where blend weights thin the cloud — compensate with size/alpha, not denser geometry.
- If WebGL is unavailable, render a composed dark-violet plate with HUD — not an empty stage.
- Export create({ root, reduced }) → { resize, update, activate, deactivate, destroy }. Parent page owns RAF and offscreen pause.
- prefers-reduced-motion: show NULL GLYPH only, no scrub animation.

VISUAL IDENTITY
- Background #05030E. Point ramp #7B5CFF → #FF3EA5 (violet to magenta). Additive points, no bloom post-process.
- HUD with formation name, index (01–06), and scrub percent. Sharp edges. No rounded cards. Do not brand HUD chrome with a vendor name.

INTERACTION
- Drag horizontally or scrub with wheel. Release coasts with inertia, then snaps toward the nearest formation.
- Hint: "DRAG SIDEWAYS TO SCRUB THE MORPH".

DELIVERABLE
- Single self-contained module with the API above.
- Use case: "Scroll-scrubbed formation morphs for feature reveals."`,

  '06': `Build a production-ready DOM 3D impact grid — a struck steel membrane. No canvas. No WebGL.

TECHNICAL REQUIREMENTS
- A perspective grid of DOM tiles. Each tile springs on rotateX, rotateY, and translateZ.
- Static plate rake of about 4 degrees so the grid reads as a physical membrane.
- On click/tap, cast a wave from the hit point. Delay each tile by distance / wave speed. Multiple strikes superpose.
- Reflect the wave once at each edge with reduced amplitude (~0.42). This is required.
- Pointer proximity applies a continuous tilt field separate from strike impulses.
- Use Pointer Events so mouse and touch both work. Hit-test on the root, not on every transformed tile.
- Export create({ root, reduced }) → { resize, update, activate, deactivate, destroy }. Parent page owns RAF and offscreen pause.
- prefers-reduced-motion: show a composed, slightly raked still grid with readable HUD — not blank, not mid-animation.

VISUAL IDENTITY
- Background #0B0B0C. Heat ramp: warm grey → ember → #FF7A18 → #FFC24A → near white.
- Thin hard tile borders. Corner ticks. HUD: TILES / IMPULSE / SETTLE.
- Sharp edges only. No rounded cards. No purple theme.

INTERACTION
- Click to strike. Move to tilt.
- Hint: "CLICK THE PLATE".

DELIVERABLE
- Single self-contained module with the API above.
- Use case: "Tactile tile grids that answer every click with a shockwave."`,

  '07': `Build a production-ready elliptical product orbit. No canvas. No WebGL. DOM only.

CONCEPT
A hero product sits centre stage under soft gallery light. Below it, the whole catalogue
is arranged as circular thumbnails on a FLAT ELLIPSE. Whatever sits at twelve o'clock is
the hero. The lower half of the ellipse runs below the stage — underground — so the ring
reads as a mechanism that continues out of sight.

TECHNICAL REQUIREMENTS
- Export create({ root, reduced, preview }) -> { setPreview, resize, update, activate, deactivate, destroy }.
  The parent page owns the RAF and offscreen pause. Do not start your own loop and do not
  animate with CSS transitions — every orbit position is written per frame from update(dt).
- Lay everything out from the root element's box, never from window dimensions. The same
  module must compose at small card size and at full page with no separate code path.
- Ellipse: centreY at ~0.985 of stage height, radiusY ~0.135 of height, radiusX ~0.30 of
  width (clamped). For item i: angle = i * (2PI/N) + rotation - PI/2, then
  x = cx + cos(angle) * rx, y = cy + sin(angle) * ry.
- Never a steep U-arc that throws items off screen. It is a flat ellipse.
- Give every thumbnail one fixed box and vary it only through transform: scale, so nothing
  relayouts per frame. Write transform and opacity only.
- Depth: items scale down and fade as they sink toward the bottom of the ring. The item at
  twelve o'clock is largest and fully opaque.
- Turn the ring as ONE piece on the shortest angular path. Never stagger items on select.

INTERACTION
- Scrub: dragging the pointer horizontally across the stage rotates the ring, roughly one
  revolution per stage width. Release, and it settles onto the nearest detent with an
  ease-in-out over ~0.5s. This is the primary interaction and must work on hover alone.
- Click a thumbnail to send it to twelve o'clock directly (~0.85s, ease-in-out).
- Hover a thumbnail: scale only, about 1.22. Never move the accent border on hover — the
  accent belongs to the active item alone.
- Idle: with no pointer on the stage, advance one item at a time on a timer so the
  component is never a still frame. Any pointer input cancels it instantly.

HERO SWAP
- When the item at twelve o'clock changes: shrink and fade the hero (scale 0.88, ~0.22s),
  swap the source, then pop back from slight oversize (scale 1.08 -> 1, ~0.55s).
- Use two stacked image layers and cross them, so a slow decode can never show an empty
  frame. Paint the incoming source into the hidden layer first.
- Label: name plus an index counter (01 / 08). Fade and spring it in with the swap.

PERFORMANCE
- Ship two asset sizes: a small thumbnail set and a large hero set. In preview context use
  the thumbnails for the hero too — at card size they are already sharp, and the whole
  exhibit then costs a few tens of kilobytes. On promotion to full page, fetch the large
  assets in the background and swap them in only once decoded.

VISUAL IDENTITY
- Background near-black. One accent colour, used for the active ring, the orbit hairline
  and the counter. Nothing else is coloured.
- Lighting on the hero: a single unified bloom behind it, a thin luminous gradient rim
  hugging the frame, a soft key-light wash down the top of the glass, and a floor pool
  beneath so it stands on something. Never four separate corner glow blobs.
- Draw the orbit path itself as a faint hairline ellipse so the mechanism reads even while
  half the ring is underground.
- Vignette the stage corners.
- prefers-reduced-motion: a composed still — hero, label and ring all resolved and legible.
  Never blank, never mid-animation.

FEEL
The ring turns as one machine. The chosen item climbs to twelve o'clock and grows. The hero
shrinks away and snaps back. It should be hard to stop scrubbing.

DELIVERABLE
- Single self-contained module with the API above.
- Use case: "Product pickers that feel like operating premium machinery."`,

  '08': `Build a production-ready interactive Canvas 2D dot-reveal field. No WebGL, no framework, no build step.

CONCEPT
A photograph is hidden under a dense, evenly spaced grid of small circles. Each circle is tinted
with the colour of the photo at its own position, so the field reads as a halftone of the image
without ever showing it. Move the pointer and the dots around it swell, fade and lean toward the
cursor, while a soft-edged circular crop of the real photograph is drawn underneath — the picture
only exists where the visitor is looking.

TECHNICAL REQUIREMENTS
- Export create({ root, reduced, preview }) -> { setPreview, resize, update, activate, deactivate, destroy }.
  The parent page owns the RAF and the offscreen pause. Do not start your own loop.
- Size everything from the root element's box, never from window dimensions. The same module must
  compose in a small card and at full page with no separate code path.
- Cap devicePixelRatio at 2. Set the canvas transform once per resize; draw in CSS pixels.
- Three offscreen buffers, and they are not interchangeable:
    1. a hi-DPI buffer of the photo, drawn cover, used for the spotlight crop
    2. a 1:1 CSS-pixel buffer of the same photo, used only for getImageData colour sampling
    3. a small buffer the size of the spotlight, for compositing the soft edge
  Sampling from the hi-DPI buffer returns the wrong pixel for a given dot — the two must be separate.
- Pad the photo buffers by more than half the spotlight diameter so the spotlight can sit against an
  edge without sampling past the buffer.
- Dot pitch is derived from the stage: aim for roughly 20 CSS pixels between dots, then reduce the
  column count until the total dot count is under budget. A card should look like the same artwork
  as the full page with fewer dots, not like a zoomed-in crop.

COLOUR
- Sample the photo once per dot at that dot's position. Push saturation away from the per-pixel
  average (about 1.85x), then lift the result so the brightest channel clears ~180 — an unboosted
  sample is too dark to read as a dot field on black.
- Store a perceptual luminance per dot (sqrt of the 0.299/0.587/0.114 mix) and use it to scale dot
  radius, so bright regions of the photo carry visibly larger dots.

INTERACTION
- Within a reach radius of the pointer, each dot gets a falloff t = 1 - dist/reach, raised to ~0.85
  and smoothstepped. That value drives three things at once: reveal (fades the dot out), radius
  (swells it), and a pull of about 0.42 * ease toward the cursor.
- The reach is a fraction of the stage's short side (about 0.40, clamped), never a fixed pixel
  count. A fixed 300px spotlight swallows an entire card and leaves nothing to reveal.
- Only recompute targets for dots inside the reach — walk the column/row window, not the whole grid.
- Read the canvas bounding box on each pointer event. Caching it at layout time breaks as soon as
  the page scrolls, which is exactly what a card in a long grid does.

SPOTLIGHT
- Draw the padded photo buffer into the spotlight buffer, then mask it with a radial gradient using
  destination-in: opaque to about 55% of the radius, ~0.35 alpha at 86%, transparent at the edge.
  Composite that over the dot field. A hard-edged circle looks like a cut-out; the soft edge is the
  whole effect.

MOTION
- All easing must be frame-rate independent: k = 1 - exp(-rate * dt), never a fixed per-frame lerp.
  A parent that coalesces idle exhibits to a lower tick rate would otherwise halve the speed.
- Give the dots a slow per-column breathe (a sine of time offset by column x) so the field is never
  completely static.
- Idle: with no pointer on the stage, drive the same reveal machinery from a phantom pointer
  wandering a slow Lissajous path. Any real pointer takes over immediately, and the drift resumes
  when it leaves. A grid of live previews must never contain a still frame.
- Short intro fade so the field assembles rather than appearing.
- prefers-reduced-motion: render one composed still — dots, tints and a spotlight parked off-centre.
  Never blank, never mid-animation.

VISUAL IDENTITY
- Solid black stage. No text, no chrome, no captions. The photograph and the dots are the whole
  composition.
- Pick a high-contrast image with a strong silhouette. The effect dies on a busy, evenly-lit photo —
  it needs large areas of flat colour for the dot field to read as a shape.

DELIVERABLE
- Single self-contained module with the API above, plus one image asset.
- Use case: "Portrait and product reveals that make the visitor go looking."`,

  '09': `# Oblique — Tilted Grid Gallery · Build Prompt

**What this builds:** a scroll-animated gallery of tilted "prints" on a bold colour
field, with smooth scroll, per-card parallax, and click-to-expand detail panels.
Vanilla HTML/CSS/JS + GSAP. No build step, no framework.

**Works with:** Claude Code, Cursor, Windsurf, Copilot Agent, ChatGPT, or any coding
model that can write files. Paste the whole thing as a single message.

**Expect ~1,900 lines across 4 files.** If your tool has a short output limit, add
this line to the end: *"Emit one file per message in this order: index.html,
styles.css, main.js. Wait for me to say 'next' between files."*

**Honest note to buyers:** language models are non-deterministic, so two runs will
differ in comment wording and minor structure. Every number, rule and failure mode
below is pinned, so any competent model produces a working, correct build. Run the
acceptance checks at the bottom — they're the contract.

═══════════════════════════════════════════════════════════════════════════
COPY EVERYTHING BELOW THIS LINE
═══════════════════════════════════════════════════════════════════════════

You are a senior creative developer building a production component for a premium
animation library. Judge your output against Awwwards Site-of-the-Day work. Build
exactly what is specified — every number here was derived from a working, tested
implementation. Do not simplify, do not substitute, do not "improve" the numbers.

## Stack & files

Vanilla HTML/CSS/JS. No framework, no bundler, no npm. Four files:

\`\`\`
index.html    markup + page chrome
styles.css    tokens, card anatomy, 18 placeholder motifs
main.js       CONFIG, scatter, layout, scroll engine, expand/collapse
README.md     what it is, how to reskin
\`\`\`

GSAP 3.12.5 + ScrollTrigger from cdnjs, \`defer\`:
\`\`\`
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
\`\`\`

Fonts (Google Fonts): **Inter Tight** 300–800 (display/body), **Instrument Serif**
roman + italic (project titles, card watermark), **JetBrains Mono** 400/500 (all
small caps meta). Three type voices, used consistently.

## The concept

Cards are **photographic prints laid on a coloured table** — not UI cards. Each has
a white matte border with the caption printed on the bottom matte, and a real drop
shadow. That single decision is what stops this reading as a generic hover-card
component. Do not use rounded corners, gradients-on-cards, or glassmorphism.

## THE ONE ARCHITECTURAL RULE

Read this twice; everything depends on it.

Each card is **three nested layers**, one owner each, so no two features ever write
the same transform:

\`\`\`html
<button class="card">          <!-- absolute box. NEVER transformed. ScrollTrigger measures this -->
  <span class="card-drift">    <!-- scroll parallax + velocity skew, nothing else -->
    <span class="card-pose">   <!-- entrance / hover / expand — GSAP only -->
      <span class="card-lift"></span>
      <span class="card-print">
        <span class="card-media">
          <span class="card-frame"><!-- motif or <img> --></span>
          <span class="card-wash"></span>
          <span class="card-grain"></span>
          <span class="card-num">01</span>
          <span class="card-ghost">Title</span>
        </span>
        <span class="card-cap">
          <span class="card-cap-i">01</span>
          <span class="card-cap-t">Title</span>
          <span class="card-cap-c">Category</span>
        </span>
      </span>
    </span>
  </span>
</button>
\`\`\`

A card's **resting pose is always** \`{ x:0, y:0, scale:1, rotation:tilt }\` on
\`.card-pose\`, sitting on a plain \`left\`/\`top\` box owned by CSS. Expanding only ever
writes a *delta* onto that pose. Collapsing is therefore a literal return to zero,
not a recalculated trip back — so the card cannot accumulate drift, ever, including
across a resize while open.

\`.card\` itself is never transformed, so \`getBoundingClientRect()\` on it is always
the honest layout box — that is what makes ScrollTrigger and the expand maths agree.

**GSAP owns every animated property. No CSS \`transition\` may touch any property
GSAP writes** — they fight frame by frame. Use CSS transitions nowhere in this build.

## CONFIG (top of main.js, verbatim)

\`\`\`js
const CONFIG = {
  backgroundColor: "#1500E1",
  accentColor: "#ffffff",
  cardCount: 18,

  layoutSeed: 8,      // re-rolls the entire scatter
  rotationMin: 1.4,   // deg — no card ever looks accidentally straight
  rotationMax: 7,     // deg
  jitter: 20,         // ± px positional noise per card

  cardAspect: 280 / 360,
  expandedHeight: 0.55,   // expanded card height as a share of viewport height

  smooth: 0.105,      // scroll ease, normalised to 60fps. lower = heavier, 1 = native
  wheelStep: 1,       // wheel sensitivity
  parallax: 34,       // ± px a card drifts against scroll, scaled by depth
  skewMax: 2.6,       // deg of shear at full scroll velocity
  marqueeSpeed: 54,   // px per SECOND at rest

  items: [ /* 18 × { image, tone, mark, title, category, description, year } */ ],
};
\`\`\`

18 items. \`image: null\` means draw a placeholder motif. \`tone\` is the print's base
colour, \`mark\` the shape colour. Use this palette (distinct, all legible on
\`#1500E1\`, deliberately mixing lights/darks/brights):

\`\`\`
#F2EDE3/#FF3B1F  #FF3B1F/#F7F2E8  #111111/#D9FF3D  #D9FF3D/#111111
#FF9EC4/#2B0A5E  #FFB627/#111111  #00E5A0/#0A2E22  #BFE3FF/#1500E1
#7A1327/#FFC9C2  #E4C9A0/#4A2C12  #0E7C86/#CFF6F2  #C6B4FF/#17103A
#3B5F1E/#C9F24D  #FF6B4A/#FFF1E2  #2E3440/#D8E1EC  #FF2D78/#FFEAF2
#C87E12/#FFF4DE  #EDEDE8/#1500E1
\`\`\`

Write 18 real studio projects — distinct title, category (Branding, Art Direction,
Typography, Motion, Identity, Editorial, Interaction, Packaging, Campaign, Print,
Wayfinding, Album Art, Environmental, Exhibition, Data Design, Music, Ceramics,
Stationery), a year 2016–2026, and **one short specific sentence**. No lorem, no
filler like "A project showcasing our work."

## Colour derivation (keeps it reskinnable)

Implement \`relLum(hex)\` (WCAG relative luminance) and \`contrast(a,b)\`, then
\`readableOn(hex)\` returning \`#0a0a0a\` or \`#ffffff\` — whichever has more contrast.
Use it for: text on each card's \`tone\`, text on the accent pill, and the panel title
(accent if \`contrast(accent,bg) >= 3.5\`, else whichever of white/near-black wins).
A buyer swaps two hex values and everything stays legible with no CSS edits.

## Scatter — banded, NOT flat random

Seeded PRNG (mulberry32) so the same \`layoutSeed\` always rebuilds the same table.

**Do not use flat \`random()\` for tilts.** Tested across 400 seeds, flat random
repeatedly yields angles within 0.06° of each other (two cards visibly parallel —
reads as a bug) and seeds where every card leans the same way (reads as a skewed
page, not a scatter). Instead draw **one angle per band**:

\`\`\`js
const half = Math.ceil(n / 2);
const span = (CONFIG.rotationMax - CONFIG.rotationMin) / half;
const pad  = span * 0.2;                    // keeps neighbouring bands apart
for (let side = 0; side < 2; side++)        // 0 = negative, 1 = positive
  for (let b = 0; b < half; b++) {
    const lo = CONFIG.rotationMin + b * span + pad;
    const hi = CONFIG.rotationMin + (b + 1) * span - pad;
    tilts.push((lo + rand() * (hi - lo)) * (side ? 1 : -1));
  }
// then Fisher–Yates shuffle with the SAME rand, so cards get random bands
\`\`\`

Then per card, from the same \`rand()\`: \`jx\`/\`jy\` = \`(rand()*2-1) * jitter\`, and
\`depth = 0.28 + rand()*0.72\` (parallax strength).

This guarantees, for every seed: distinct angles, an even left/right lean, and no
tilt weaker than \`rotationMin\`. Angles are computed **once at layout time** and
never touched per-frame.

## Layout tiers

\`\`\`js
w >= 1600 → cols 4, cardW 268, gapX 74, gapY 74, drift [0,112,44,150], jf 1
w >= 1360 → cols 4, cardW 232, gapX 58, gapY 64, drift [0,96,38,128],  jf 1
w >= 1100 → cols 3, cardW 262, gapX 68, gapY 64, drift [0,106,42],     jf 1
w >= 860  → cols 3, cardW 212, gapX 50, gapY 56, drift [0,84,32],      jf 0.85
w >= 620  → cols 2, cardW 232, gapX 48, gapY 56, drift [0,86],         jf 0.8
else      → cols 1, cardW min(272, w-124), gapX 0, gapY 40, drift [0], jf 0.5
\`\`\`

\`drift\` is a **per-column vertical offset** — this is what makes it read as
art-directed rather than a grid. \`jf\` scales jitter down on smaller screens.

\`\`\`js
cardH   = round(cardW / cardAspect)
over    = ceil((cardW*0.9925 + cardH*0.1219 - cardW)/2) + 4   // corner swing at max tilt
gridW   = cols*cardW + (cols-1)*gapX
originX = (galleryWidth - gridW) / 2
padTop  = clamp(viewportHeight*0.05, 16, 64)

// a final row that doesn't fill its columns is CENTRED, so the grid ends on a
// deliberate note instead of a hole where a card isn't
lastRow   = floor((n-1)/cols)
lastCount = n - lastRow*cols
lastNudge = ((cols - lastCount) * (cardW + gapX)) / 2

col = i % cols;  row = floor(i / cols)
swing = (cols===1 ? (row%2 ? 1 : -1) * 12 : 0) + (row===lastRow ? lastNudge : 0)
x = round(clamp(originX + col*(cardW+gapX) + jx*jf + swing, over, max(over, W-cardW-over)))
y = round(padTop + row*(cardH+gapY) + drift[col] + jy*jf)
gallery.style.height = round(maxBottom + over + 24)
\`\`\`

Set \`width/height/left/top\` in px on \`.card\`. Cache \`gTop\` (the gallery's document
offset) after every layout. Cards should overlap slightly in whitespace via tilt and
jitter, but never cover each other's image area.

## Card anatomy (CSS)

\`\`\`
.card-print   padding 7.5% 7.5% 0; background #f7f4ee; border-radius 2px;
              container-type: inline-size;
              box-shadow: 0 1px 0 rgba(255,255,255,.5) inset,
                          0 14px 26px -14px rgba(0,0,0,.55)
.card-media   flex:1; overflow hidden; background var(--tone); isolation isolate
.card-cap     height 13%; JetBrains Mono; uppercase; letter-spacing .13em;
              index (42% opacity) · title (500 weight) · category (42% opacity)
.card-lift    absolute inset 6%; box-shadow 0 42px 64px -22px rgba(0,0,0,.62);
              opacity 0   ← hover cross-fades THIS, never animates a box-shadow string
.card-wash    radial light: rgba(255,255,255,.3) at 22% 12%, rgba(0,0,0,.26) at 82% 96%
.card-grain   SVG feTurbulence noise, opacity .16, mix-blend-mode overlay
.card-num     mono index, top-left, colour readableOn(tone), opacity .68
.card-ghost   Instrument Serif title, bottom-right, opacity .3, sized in \`cqw\`,
              with a soft radial knock-out in the print's own tone behind it so it
              stays legible over every motif
\`\`\`

Use \`cqw\` units for card text so type scales with the print. That is why
\`.card-print\` needs \`container-type: inline-size\`.

**18 distinct motifs** (\`.m1\`–\`.m18\`), pure CSS gradients using \`--tone\`/\`--mark\`:
centred circle · diagonal split · bottom bands · corner arc · concentric rings ·
vertical bar · dot grid · offset rectangles · rising half-circle · diagonal stripes ·
cross · triangle (conic) · horizon + circle · checker · nested frame · ripple ·
opposite quarter-circles · thin vertical stripes. Each must read as a distinct
poster, not a pattern swatch.

## Page chrome

Fixed masthead (brand, "Selected commissions", \`NN / 18\` counter). Hero: mono
eyebrow, a 3-line display headline where the last line is Instrument Serif italic
for contrast, a sub-line, and a scroll cue. A marquee band between hero and grid.
Colophon at the end. Grain + vignette overlays fixed over everything.

Anything \`position: fixed\` (grain, vignette, cursor, masthead, scrim, panel) must
live outside the scrolled flow.

## Entrance

ScrollTrigger, \`start: "top 85%"\`, triggering on \`.card\` (the untransformed layer).

From \`{ opacity:0, y:60, scale:0.94, rotation:0 }\` → \`{ opacity:1, y:0, scale:1,
rotation: <its tilt> }\`, \`duration 0.8\`, \`ease power3.out\`, \`stagger 0.06\`, all on
\`.card-pose\`.

The rotation settling **into** its tilt (rather than starting tilted) is what sells
the landing feel.

Use \`ScrollTrigger.batch\` so cards crossing the line together stagger together.
**Do not pass \`once: true\`** — see Trap 2. Guard with a \`landed\` boolean per card
instead, and add an \`ensureLanded()\` that reveals anything already above the line
(a reload part-way down the page, or a resize that pulls cards up).

## Smooth scroll — native scroll stays the source of truth

Do **not** add Lenis or a transform-wrapper scroller. Intercept \`wheel\`, ease the
value, and hand it to \`window.scrollTo\`. Because the real scroll position is still
the truth, every \`getBoundingClientRect()\` stays honest and ScrollTrigger needs no
proxy or special casing.

Skip smooth scroll entirely on coarse pointers (native momentum is better) and under
\`prefers-reduced-motion\`.

Wheel handler (\`passive:false\`, \`preventDefault\`):
\`\`\`js
const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
const step = clamp(e.deltaY * unit * CONFIG.wheelStep, -240, 240);  // cap driver spikes
scroller.target = clamp(scroller.target + step, 0, maxScroll());
\`\`\`
Also handle ArrowUp/Down (±90), PageUp/Down (±0.9vh), Home, End, Space — skipping
inputs and textareas.

Per frame, via \`gsap.ticker.add((time, deltaMs) => …)\`:
\`\`\`js
const dt = Math.min(deltaMs, 50) / 1000;   // clamp so a tab-switch can't lurch
const f  = dt * 60;

// SELF-HEAL: adopt any scroll that happened without us (scrollbar drag, anchor
// jump, a scroll event never received). Our own scrollTo lands within a pixel,
// so this cannot false-trigger.
if (Math.abs(window.scrollY - scroller.current) > 2.5)
  scroller.current = scroller.target = window.scrollY;

const d = scroller.target - scroller.current;
if (Math.abs(d) > 0.08) {
  scroller.current += d * (1 - Math.pow(1 - CONFIG.smooth, f));   // dt-corrected
  window.scrollTo(0, scroller.current);
}

const raw = (scrollNow - prev) / dt;                    // px per SECOND
vel += (raw - vel) * (1 - Math.pow(0.86, f));
const skew = expanded !== null ? 0
           : clamp(vel * 0.00125, -CONFIG.skewMax, CONFIG.skewMax);

ScrollTrigger.update();   // ALWAYS — never gate this. See Trap 8.
\`\`\`

**Everything time-based, never frame-based.** See Trap 1.

## Parallax, skew, marquee, hero

One function writes drift, so it can also be called synchronously when a jump must
land before the next frame:
\`\`\`js
function driftAll(at, skew) {
  const mid = at + innerHeight / 2;
  for (const c of cards) {
    const rel = clamp((gTop + c.y + c.h/2 - mid) / innerHeight, -1.4, 1.4);
    c.driftY = rel * c.depth * CONFIG.parallax;   // 0 at viewport centre
    c.setY(c.driftY);        // gsap.quickSetter(c.drift, "y", "px")
    c.setSkew(skew);         // gsap.quickSetter(c.drift, "skewY", "deg")
  }
}
\`\`\`
Marquee: \`marqX = (marqX + (marqueeSpeed + vel*0.55) * dt) % halfTrackWidth\` — build
the track doubled so it wraps seamlessly at half its width. Hero: translate
\`scrollNow * 0.22\` while \`scrollNow < innerHeight * 1.3\` so it hangs back.

Skip the drift write when the page is still and the shear has relaxed — 18 cards is
cheap, not free.

## Custom cursor

10px solid dot, \`accentColor\`, \`mix-blend-mode: difference\`, native cursor hidden.
Follows with \`gsap.quickTo(…, { duration: 0.15, ease: "power3.out" })\` — precise, not
floaty. Grows to 16px over cards, the close control, and the panel arrows.

Structure it as a \`0×0\` anchor with \`display:grid; place-items:center\` and the dot
inside — then the dot stays centred at any size without margin maths.

Disable under reduced motion and on coarse pointers.

## Hover (before click)

On \`.card-pose\`: \`rotation: tilt * 0.4\` (straightens by 60%, never fully flat),
\`scale: 1.03\`, \`duration 0.4\`, \`ease power2.out\`. \`.card-lift\` opacity → 1 (0.4s).
\`.card-frame\` scale → 1.06 (0.6s) so the photo breathes inside its matte. Raise
\`z-index\` to 30. Reverts to resting tilt on leave. Bind to \`focus\`/\`blur\` too.

Guard: do nothing if a card is expanded, if one is still travelling home, or if this
card hasn't landed.

## Expanded geometry

\`\`\`js
stacked = viewportWidth < 900

// desktop — card centre-left, panel right
margin  = clamp(vw*0.05, 28, 72)
gutter  = clamp(vw*0.045, 30, 76)
panelW  = clamp(vw*0.29, 290, 430)
h       = clamp(vh*0.55, cardH*1.25, vh - 88)    // ← the 1.25 floor matters, Trap 4
w       = h * cardAspect
room    = vw - margin*2 - gutter - panelW
if (w > room) { w = room; h = w / cardAspect; }
left    = (vw - (w + gutter + panelW)) / 2
top     = (vh - h) / 2
panelLeft = left + w + gutter
panelTop  = clamp(top + (h - panelHeight)/2, 88, max(88, vh - panelHeight - 20))

// stacked — card top, panel below
margin 20, gap 26, panelW = vw - 40
top = max(50, vh*0.06)
h   = max(vh - top - panelHeight - gap - margin, cardH*1.05)
w   = h * cardAspect;  if (w > vw-40) { w = vw-40; h = w/cardAspect; }
top = max(12, min(top, vh - h - gap - panelHeight - 12))
panelTop = top + h + gap
\`\`\`

Measure the panel's real height (fill its text first, then read \`offsetHeight\` while
still \`visibility:hidden\` — hidden elements still have layout). Sizing that ignores
the panel's real height either overlaps it or wastes the screen.

The delta that carries a card from its resting box to the open slot — note \`driftY\`
is part of where the card actually is, so it must be in here:
\`\`\`js
const gr = gallery.getBoundingClientRect();
x = g.left + g.w/2 - (gr.left + c.x + c.w/2);
y = g.top  + g.h/2 - (gr.top  + c.y + c.h/2 + c.driftY);
scale = g.h / c.h;
\`\`\`

Lock scroll while expanded. Put \`scrollbar-gutter: stable\` on \`html\` so locking
doesn't shift the page.

## Expand — one coordinated timeline

Timeline positions in seconds. z-index of the open card → 60.

\`\`\`
0     .card-pose  → { x, y, scale, rotation:0, opacity:1 }  0.6  power3.inOut
0     .card-drift → { skewY: 0 }                            0.4  power2.out
0     .card-frame → { scale: 1 }                            0.6  power3.inOut
0     .card-lift  → { opacity: 1 }                          0.6  power3.inOut
0     other poses → { opacity: 0.15, scale: 0.96 }          0.4  power2.out
0     scrim       → { opacity: 1 }                          0.45 power2.out
0     chrome      → { opacity: 0 }                          0.4  power2.out
0.3   close ctrl  → { opacity: 0.62 }                       0.4
0.2   panel  from { opacity:0, x:30 } → { opacity:1, x:0 }  0.5  power3.out
0.26  panel lines from { opacity:0, y:14 } → { 1, 0 }       0.5  power3.out, stagger 0.055
\`\`\`
(stacked: panel enters from \`y:24\` instead of \`x:30\`.)

\`pointer-events: none\` on every other card while expanded. Only dim cards that have
actually **landed** — touching one that hasn't entered yet pops it on screen without
its intro.

"chrome" = hero, marquee, colophon, corner marks. They fade because **the panel is
transparent** — see Trap 5.

## Collapse — one reversal, not two events

\`\`\`
0     panel      → { opacity: 0, x: 30 }        0.28  power2.in
0     close ctrl → { opacity: 0 }               0.22
0.08  .card-pose → { x:0, y:0, scale:1, rotation: tilt }  0.6  power3.inOut
0.08  .card-lift → { opacity: 0 }               0.5   power2.out
0.14  other poses→ { opacity: 1, scale: 1 }     0.45  power2.out
0.14  scrim      → { opacity: 0 }               0.4   power2.out
0.14  chrome     → back to each element's own resting opacity  0.45  power2.out
\`\`\`

The panel leaves first and the card follows 0.08s later — that offset is what makes
it read as one reversal. Total ≈ 0.68s.

Close via: the card itself, the × control, the dimmed background, or Escape (Escape
returns focus to the card it came from).

On complete: restore z-index, \`aria-expanded\`, pointer-events, unlock scroll, clear
the panel line transforms, and re-apply hover if the pointer is sitting on a card.

## Interruptible — this is not optional

Every tween above lands on an **absolute** value, so cutting one off mid-flight is
safe. Do **not** use a \`busy\` flag that swallows input — see Trap 6.

- Kill the live timeline and start the new one.
- Track a \`homing\` card (one still travelling back). Block hover while it exists.
- If a new card is expanded while another is still homing, fold that card's trip
  home into the **same** timeline: \`{ x:0, y:0, scale:0.96, rotation: tilt,
  opacity: 0.15 }\` over 0.5s, and push it into the dimmed set so collapse restores it.
- Never allow two cards expanded at once.

## Description panel

Category pill (accent background, \`readableOn(accent)\` text, uppercase, letter-spaced
0.2em, mono 9.5px, pill radius) · large bold title in \`--panel-title\` · muted
description · mono meta row \`NN / 18 —— YEAR\` · a \`× Close\` control at the panel's
top-right · prev/next circular arrow buttons.

**Prev/next**: land the target card if it hasn't entered yet, then **sync the scroll
so its resting slot is on screen before expanding** — otherwise a card three screens
away flies in from nowhere and, worse, closing returns it off-screen. Jump the
scroll, re-run \`driftAll\`, then re-derive the open card's delta so it doesn't appear
to move (same trick as resize-while-open). Then \`collapse(); expand(next);\` — the
interrupt machinery above handles the rest. Bind ArrowLeft/ArrowRight too.

## Accessibility & reduced motion

Cards are real \`<button>\`s — Tab to them, Enter to open, Escape to close, focus
returns. \`aria-expanded\` tracks state. Visible \`:focus-visible\` outline.

Under \`prefers-reduced-motion: reduce\`: skip the entrance (cards start at final
pose, marked landed), skip smooth scroll, skip the custom cursor, and scale all
durations by ~0.001 so transitions are effectively instant. Layout stays intact.
Implement this as one \`D\` multiplier applied to every duration and timeline position.

## Also handle

- **Web fonts land after init** and change the hero's height, moving every card.
  On \`document.fonts.ready\`: re-layout, \`ScrollTrigger.refresh()\`, \`ensureLanded()\`.
- **Resize** (debounced ~140ms): re-layout, re-drift, clamp scroll to the new
  \`maxScroll()\`, and if a card is open, re-derive its delta so it stays put and still
  collapses home exactly.
- \`history.scrollRestoration = "manual"\` + scroll to top on load, so the entrance
  actually plays.
- \`overscroll-behavior-y: none\` so bounce doesn't fight the scroller.
- z-index order: cards \`10+i\` → hover 30 → scrim 40 → expanded card 60 → masthead 75
  → panel 76 → vignette 80 → grain 90 → cursor 200.

═══════════════════════════════════════════════════════════════════════════
KNOWN TRAPS — each of these was a real bug found by testing.
Read before writing code; the default approach is wrong in all eight.
═══════════════════════════════════════════════════════════════════════════

1. **Frame-based easing is frame-rate dependent.** \`current += d * 0.105\` per frame
   runs twice as fast at 120Hz as at 60Hz — measured, the same gesture travelled
   486px on 60Hz vs 736px on 120Hz at the 100ms mark. Correct with
   \`d * (1 - Math.pow(1 - ease, dt * 60))\`. Same applies to the velocity EMA, the
   marquee speed (px per *second*), and anything else per-frame.

2. **\`once: true\` on \`ScrollTrigger.batch\` races its own debounce.** It kills each
   trigger the moment it toggles, which can outrun batch's debounced callback and
   leave a card permanently marked un-landed — invisible and unclickable. Use a
   \`landed\` flag as the guard instead; re-entering the viewport then finds nothing
   to do.

3. **Never let a CSS \`transition\` share a property with GSAP.** They fight every
   frame and produce visible lag. The close control especially: give it \`opacity:0\`
   in CSS and animate hover with GSAP, because an inline style from GSAP outranks a
   \`:hover\` rule anyway.

4. **The expanded card can end up smaller than it started.** On a short viewport,
   \`55vh\` may be less than the card's own grid height — measured 0.906×, i.e. clicking
   "expand" visibly shrank it. Floor the height against \`cardH * 1.25\` (desktop) /
   \`cardH * 1.05\` (stacked).

5. **The panel is transparent, so page furniture reads straight through it.** Scroll
   to the colophon, open a card, and its text shows through the title. Fade the
   chrome out as part of the expand — don't try to cover it.

6. **A \`busy\` guard swallows the close click.** Clicking × during the 0.6s expand
   does nothing and the card is stuck open. Users do this constantly. Make the
   sequence interruptible instead (all tweens target absolute values, so it's safe).

7. **Expanding out of an interrupted collapse leaves the new card dimmed.** It was at
   0.15 opacity from the previous state and nothing restores it — it opens visibly
   washed out. Put \`opacity: 1\` in the expanding card's own tween.

8. **Never gate \`ScrollTrigger.update()\` on your own movement flag.** It looks like a
   free optimisation, but if your scroller ever diverges from the real scroll
   position, updates stop entirely and the whole page freezes. Call it every frame.

═══════════════════════════════════════════════════════════════════════════
ACCEPTANCE CHECKS — run these before calling it done, and report the results
═══════════════════════════════════════════════════════════════════════════

1. **Tilts.** Log all 18. They must be distinct, none weaker than 1.4°, and the
   left/right split must be 9/9. Change \`layoutSeed\` to 3 different values — all
   three must still satisfy that.

2. **Exact collapse (the important one).** For every card: record
   \`getComputedStyle(pose).transform\` and opacity, open it, close it, re-record.
   Every value must be **identical** — max drift 0.00000 on rotation, x, y, scale and
   opacity. Test all three close paths (card, × control, background).

3. **Expanded geometry.** Measure \`.card-print\`'s rect (not \`.card\` — that's the
   untransformed layout box). Height must be 0.55 × viewport height, the card must be
   larger than at rest, its centre left of the viewport centre, the panel entirely to
   its right, and both fully on screen.

4. **Dimming.** Every other landed card sits at exactly opacity 0.15 and scale 0.96,
   with \`pointer-events: none\`.

5. **Interruption.** Open a card, and at ~35% through the expand click ×. It must
   close, and drift must still be 0. Then open one, start closing, and mid-collapse
   open a different one — the new card must be fully opaque and everything must
   return exactly on close.

6. **Frame-rate independence.** Drive the frame function with synthetic deltas for
   30 / 60 / 120 / 144fps over the same glide. Position at any timestamp must match
   across all four within a few px.

7. **Never two open.** With one expanded, clicking another must do nothing.

8. **Keyboard.** Tab to a card, Enter opens, Escape closes and returns focus,
   arrows step between projects.

9. **Console must be clean** — no errors, no warnings.

Report each check with the actual measured numbers, not just "passed".
`,

  /* TPL.02 HADAL — verbatim from the author's PROMPT.md. JSON-quoted rather
     than a template literal because the prompt is full of backticks. */
  '10': "# HADAL — Build Prompt\n\n> Paste everything below the line into an agentic AI coding tool that can read and write files and run shell commands\n> (for example Claude Code). It describes the HADAL site exactly as it was built: every word of copy, every colour,\n> every number and every technical decision is taken from the finished source code.\n>\n> **Before you start, you need:**\n> - Node.js 20 or newer;\n> - Blender 4.x or newer, installed locally (the original used Blender 5.2.2);\n> - about 2–3 GB of free disk space;\n> - a model and plan that allows a long session: the original build took several hours across multiple review rounds.\n>\n> **Be clear with your buyers:** AI output is not deterministic. The same prompt produces a different build on a different\n> model, tool, machine or day. This prompt specifies the target precisely; it cannot guarantee an identical result.\n\n---\n\n## 0. The job\n\nBuild **HADAL**, an award-level, fully animated 3D marketing website for a **fictional** maker of full-ocean-depth crewed\nsubmersibles. Work autonomously inside this project folder. Record every judgement call in `DECISIONS.md` and keep\n`PROGRESS.md` updated after every phase so the work can be resumed. If `PROGRESS.md` exists when you start, read it first and continue\nfrom \"Next\".\n\n**The idea:** scrolling the page *is* the dive. One persistent WebGL scene and one camera follow the scroll from the\nsea surface (0 m) to the floor of the Challenger Deep (10,935 m). The deeper you scroll, the darker, colder and quieter\nit gets. HTML sections are overlays on top of the canvas. The footer is the seabed. No pre-rendered video and no fake 3D.\n\n**Ground rules**\n- Local only. Do not deploy, push, open tunnels or create accounts unless I ask.\n- Free, open-licensed dependencies only (npm packages, self-hosted Google Fonts via `@fontsource`). No paid APIs and no\n  AI image/3D generation. Every model, texture and sound is made in code.\n- Stay inside the project folder. Don't change system settings.\n- Don't stop halfway. Finish every phase, including review and documentation.\n\n## 1. Stack (pin these)\n\n- Vite + React 19 + TypeScript (strict).\n- `three` **0.182.x**, pinned (`^0.182.0`), with `@types/three` 0.182. Do **not** use r183+: React Three Fiber 9 still constructs\n  `THREE.Clock`, which r183 logs as deprecated, and the site must have zero console warnings.\n- `@react-three/fiber` 9, `@react-three/drei` 10, `@react-three/postprocessing` 3, `postprocessing` 6.39.\n- `gsap` 3.15 with ScrollTrigger and SplitText (free in the `gsap` npm package), `lenis` 1.3, `zustand` 5.\n- Fonts: `@fontsource-variable/archivo` (needs the **width axis**) and `@fontsource-variable/jetbrains-mono`, self-hosted and\n  preloaded, with `font-display: swap`.\n- Dev tools: `@gltf-transform/cli` + `meshoptimizer` (model optimisation), `playwright` (screenshots, fps),\n  `@axe-core/playwright` (accessibility).\n- Blender, headless: `/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python blender/build_sub.py -- --export`\n  on macOS; use the platform equivalent elsewhere.\n- Use fixed dev/preview ports with `--strictPort --host 127.0.0.1`. If 5173 is taken, choose another; never kill\n  another app's process.\n\n## 2. Architecture (non-negotiable; this is what makes it feel like one continuous dive)\n\n1. **One clock.** The GSAP ticker drives everything in a fixed order: `lenis.raf` → ScrollTrigger update → the dive-state\n   update → per-frame callbacks → R3F render. The `<Canvas>` uses `frameloop=\"never\"` and is advanced with `advance()`\n   from the ticker, so scroll, DOM and WebGL never drift apart. Call `gsap.ticker.lagSmoothing(0)`. Skip rendering when the tab is hidden.\n2. **State.** A mutable `dive` object holds per-frame values (t, depth, mouse, progress of each pinned chapter); zustand\n   holds only low-frequency UI state (section, sound on/off, intro done, reduced motion, compact layout). No React re-render per frame.\n3. **The chapter coordinate `t`** = section index + progress through that section, measured from `[data-section]`\n   elements. Section indices: 0 hero · 1 surface · 2 manifesto · 3 fleet · 4 anatomy · 5 pressure · 6 floodlight ·\n   7 materials · 8 yard · 9 dive log · 10 seabed.\n4. **The Director** (`src/scene/director.ts`) is the only place that turns `t` and depth into the world state:\n   - camera shot (target, azimuth, elevation, distance, fov, horizontal shift via `filmOffset`);\n   - per-shot portrait offsets and distances for phones and tablets;\n   - lights, water colour and fog;\n   - every effect weight (explode, isolate, heat, flood, fleet, specimens, chamber, bubbles, rays, snow,\n     bioluminescence, jellyfish, landed).\n\n   Shots blend with a smoothstep between timeline keys. Sections only write their own pinned progress\n   (`fleetP`, `anatomyActive`, `pressureDepth`, `specP`, `chamberP`).\n5. **Depth model.** Depth is a piecewise function of `t`, eased inside each segment. **Each chapter holds at the depth\n   its eyebrow label states (±15 m)** while it is being read, and the descent happens between chapters, so the HUD, the\n   eyebrow and the gauge never disagree. Use these keys (`[t, depth m]`):\n   `[0,0] [0.42,0] [1.0,24] [1.7,200] [2.0,420] [2.3,985] [2.9,1015] [3.0,1985] [3.92,2015] [4.08,3485] [4.92,3515]\n   [5.08,4985] [5.9,5015] [6.1,6985] [6.9,7015] [7.08,8485] [7.9,8515] [8.1,9485] [8.9,9515] [9.08,9990] [9.5,10060]\n   [10.0,10935] [11,10935]`.\n6. **Scroll restoration** is `manual`; scroll to the top on load.\n\n## 3. Physics: every number derives from one file (`src/tokens.ts`)\n\n- `MAX_DEPTH = 10935` m (Challenger Deep, Eastern Pool). `RATED_DEPTH = 11000` m. `PROOF_BAR = 1375` (125 % of the deepest point).\n- Pressure (bar) = `1.01325 + 0.1005 × depth` → **1,100 bar** at 10,935 m.\n- Load on the hull (t/m²) = `bar × 10.197`.\n- Hull diameter change (mm), thin-shell, Ti-6Al-4V: `p[MPa] = (bar − 1.01325) × 0.1`;\n  `Δ = p × 1.095² × (1 − 0.342) / (2 × 113800 × 0.09) × 2 × 1000` → about −8.5 mm at the bottom. Display it negative.\n- Margin to proof test = `1375 / bar` (×1.24 at the bottom). Call it \"margin to proof test\", never \"safety factor\".\n- Daylight remaining (%) = `100 × e^(−0.023 × depth)` (1 % at 200 m). Show three decimals, and bottom out at 0.000 % —\n  never scientific notation.\n- Water temperature (°C), linear between `[0,28.4] [60,28.1] [150,24.2] [300,13.5] [600,7.1] [1000,4.3] [2000,2.3]\n  [4000,1.55] [6000,1.49] [8000,1.81] [10935,2.46]`.\n- Ocean zone label: Epipelagic < 200 m · Mesopelagic < 1,000 · Bathypelagic < 4,000 · Abyssopelagic < 6,000 · Hadal zone.\n- `darkness(d) = 1 − (1 − d/10935)^6`. The colour shift is front-loaded, like the real ocean.\n\n## 4. Design system\n\n**Colours** (CSS custom properties):\n\n| Token | Value |\n|---|---|\n| `--abyss` | `#03060a` |\n| `--navy` | `#071423` |\n| `--surface` | `#2e7fb8` |\n| `--surface-deep` | `#0b3a5c` |\n| `--ti` (titanium text) | `#c9ced6` |\n| `--ti-dim` | `#9aa2ad` |\n| `--muted` | `#7d8794` |\n| `--orange` (signature) | `#ff5a1f` |\n| `--cyan` (bioluminescence, sonar) | `#4ff0d2` |\n| `--line` | `rgba(201,206,214,.14)` |\n| `--line-strong` | `rgba(201,206,214,.28)` |\n\n**Type:**\n- Display: Archivo variable at `font-stretch: 125%`, weight ~860, uppercase, line-height 0.88. **Every headline ends in\n  an orange full stop.** Archivo's period is square at this weight; keep it.\n- Body: Archivo.\n- Labels and data: JetBrains Mono, uppercase and letter-spaced, 10.5–11 px.\n- Sizes: `--fs-h1: clamp(52px, 10.6vw, 196px)`, `--fs-h2: clamp(42px, 7.4vw, 138px)`,\n  `--fs-body: clamp(15px, .35vw + 13.6px, 18px)`, `--fs-lead: clamp(18px, .6vw + 14px, 24px)`.\n\n**Space and layout:**\n- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160 px.\n- `--gutter: clamp(20px, 3.6vw, 64px)`.\n- `--nav-h: 72px` (64 px below 900 px wide); `--hud-bar: 68px` (60 px below 900 px wide).\n\n**Motion:**\n- `power4.out` for reveals, `expo.out` for staggers, `power2.out` for number counters, CSS ease\n  `cubic-bezier(.16,1,.3,1)`.\n- Animate only `transform` and `opacity` on DOM elements. Use deliberate ScrollTrigger start points\n  (e.g. `top 82%`), and scrub wherever an animation is tied to the dive.\n- Headlines split into masked lines with SplitText (`autoSplit`, `aria: 'auto'`) and rise out of their masks.\n\n## 5. The submersible (Blender, built 100 % from Python)\n\n`blender/build_sub.py` builds HADAL-1 from code (bmesh lathes, lofts and EXACT booleans), saves `blender/hadal.blend`,\nrenders previews to `blender/previews/`, and exports `blender/export/hadal_raw.glb`. Iterate at least three times\nagainst the previews before moving on.\n\n**The form:** Triton / Limiting-Factor style.\n- A 2.28 m titanium crew sphere with a real 90 mm wall, three truncated-cone acrylic viewports, and an equatorial joint\n  with 48 bolts.\n- A big orange syntactic-foam body **lofted from superellipse sections**: rounded, flat-bottomed, sloping bow, with\n  seams and recessed bow lights. A bevelled box reads as a fridge, so don't use one.\n- An open box-beam chassis with skids.\n- Six ducted thrusters with spinning props.\n- Ballast tanks and six drop weights.\n- Two seven-function manipulator arms and a sample basket.\n- A sonar dome, pan-tilt camera, battery pod, cables, comms mast and deck hardware.\n- \"HADAL\" lettering as real geometry, using Archivo instanced to a static TTF (wdth 125, wght 850) with fontTools.\n- A simple cabin (three seats, consoles, life support) for the x-ray.\n\nRoughly 100k triangles. Textures are generated with numpy (FFT-filtered tileable noise: foam colour/ORM/normal, brushed\ntitanium normal/ORM). Pivot at the sphere centre, metres, Y-up in glTF.\n\n**Named parts** (the site depends on these exact names):\n`Hull_Sphere`, `Viewport_Front/Left/Right`, `Frame`, `Foam_Block`, `Foam_Lettering`, `Thruster_*` with `Prop_*` children,\n`Ballast_Tank_L/R`, `Ballast_Drop_Weights`, `Light_*` with emissive `Light_*_Lens`, `Arm_L/R`, `Sample_Basket`,\n`Sonar_Dome`, `Camera_Pod`, `Battery_Pod`, `Cables`, `Comms_Mast`, `Deck_Hardware`, `Interior_*`.\n\n**Optimise** with gltf-transform using meshopt + WebP 1024 and **`--join false --flatten false --instance false --palette\nfalse --simplify false`**, so every named node survives. Target under 3 MB; the original came out at 0.82 MB.\nQuantisation moves node origins, so re-pivot the props around their thruster origins and compute part anchors from\nbounding boxes.\n\n## 6. The world (post-processing, shaders, particles)\n\n- **The ocean is a post-process pass**, not a skybox: sky above and water column below are painted per pixel from the\n  view direction, with depth fog, absorption and caustics near the surface. Background pixels render black so additive\n  particles survive.\n- **Half-in, half-out hero:** a virtual dome port. A pixel is underwater if its ray is below the waves at a dome 1.5 m in\n  front of the lens. The water mesh uses the same test to discard itself, giving a real meniscus line in a single render.\n  The lens floats **0.34 m above mean water level**, and the split is drawn at lens height, so waves never create a\n  second horizon. The underside of the surface shows Snell's window, with a dithered far fade.\n- **Post chain, in order:**\n  1. a separate **sanitise pass**: replace NaN/Inf with 0 and clamp to 0–48. Test the float's **exponent bits** with\n     `floatBitsToUint(x) & 0x7f800000u` — `isnan()`/`isinf()` can be compiled away under Metal fast-math;\n  2. **Bloom**: mipmapBlur, intensity 0.85 (0.6 on low quality, × (1 − 0.62 × floodlight)), threshold 0.62,\n     smoothing 0.25, radius 0.72, levels 6. Subclass `BloomEffect` and **sanitise the final mip texture too**, before it\n     is composited. Build it once with `useMemo` and set intensity imperatively; a prop change on the stock wrapper\n     rebuilds the whole effect;\n  3. the underwater pass;\n  4. **Neutral tone mapping** (not AgX, which turns the orange salmon);\n  5. finish: vignette + grain.\n\n  A single NaN texel otherwise spreads through the bloom mip chain into a hard-edged black rectangle.\n- **One shader patch for the whole sub** (`onBeforeCompile` on standard PBR):\n  - per-part highlight, dim and dissolve (with a glowing noise edge);\n  - an FEA-style stress heat map with contour isolines and hot spots around the viewports and hatch;\n  - an x-ray lens: hull cut away inside a cone around the aim direction, measured in angle space, plus an orange\n    fresnel + wireframe ghost of the interior. Exclude the lettering from the ghost.\n\n  Guard every normal you normalise.\n- **Particles:**\n  - marine snow, increasing with depth;\n  - bubbles near the surface;\n  - god rays in the sunlit zone;\n  - bioluminescent sparks, `ramp(depth, 4200, 6400)`;\n  - jellyfish: fresnel bells with travelling-light tentacles, only in the floodlight chapter and never in front of copy.\n- **Lights:**\n  - The sub's own floodlights switch on between **880 and 1,000 m** with an ignition flicker.\n  - A soft \"studio\" key/fill/env lift applies **only** in the inspection chapters: fleet, anatomy, pressure, yard.\n    Everywhere else follows the physics.\n\n## 7. Always-on UI\n\n- **Nav** (fixed):\n  - HADAL logo; monospace links \"03 Fleet · 04 Anatomy · 05 Pressure · 09 Dive log\". Nav numbers must equal chapter numbers.\n  - \"Sound off\" toggle.\n  - Orange magnetic **\"BOOK A DIVE →\"** button.\n  - Below 1,024 px wide: an **\"Index\"** menu (a portal to `<body>`, with focus trap and Esc) listing every chapter.\n    Below 900 px, sound moves into that menu.\n- **HUD** (fixed, bottom):\n  - Depth (m), pressure (bar, 1 decimal), water (°C, 2 decimals), daylight (%, 3 decimals), zone (orange).\n  - A vertical depth gauge on the right with a marker per chapter; clicking a marker dives there.\n  - A needle shows the live depth on a dark chip. The needle's reading hides in the dive log, and the \"11k\" end label\n    hides once the needle reaches it.\n- **Chrome bars:** after the hero (t > 0.55), the nav and the HUD sit on **fully opaque** `#03060a` bars with a hairline.\n  Content passes *under* the UI, never through it. Translucent + blur fails, because big type stays readable.\n  Set the HUD's state classes imperatively, so React never rewrites them.\n- **Custom cursor** (pointer devices only):\n  - A crosshair plus a trailing ring with a per-chapter verb: Descend, Read, Scroll, Inspect, Drag, Light, Look, Land.\n  - No verb in the dive log, while the preloader runs, or after touchdown.\n  - The native cursor over form fields.\n  - In the floodlight chapter the ring becomes the x-ray lens and is drawn exactly where the beam is aimed.\n- **Sound:** Web Audio, generated in code, **off by default**. The toggle is the user gesture that creates the\n  AudioContext. Layers:\n  - a drone that lowers and muffles with depth;\n  - surf at the surface;\n  - sonar pings;\n  - hull creaks in the pressure chapter;\n  - a floodlight hum;\n  - a thud on landing.\n\n## 8. The chapters (copy is final; use it word for word)\n\nEach chapter has an eyebrow in this format: `NN —— LABEL · DEPTH M`.\n\n**Preloader.**\n- Frame: corner ticks, top-left \"HADAL-1 · PRE-DIVE CHECK\", top-right \"11°22.4′N 142°35.5′E\", bottom-left\n  \"DIVE 0213 · CHALLENGER DEEP\", bottom-right the live percentage.\n- Centre: \"● HADAL DEEP SYSTEMS\", a giant counter from 1 to **1,100** with an orange \"BAR\" unit and an orange progress rule.\n- A three-step checklist with \"OK\" turning orange: 01 Typefaces · 02 Hull geometry · HADAL-1 · 03 Compiling shaders.\n- The line \"Pressurising to 1,100 bar · 10,935 m\", and a slow sonar sweep behind.\n- Driven by **real** loading (fonts, model, GPU shader warm-up that visits every chapter state), never shorter than 1.9 s.\n- It exits with two halves parting like a hatch.\n\n**00 Hero — 0 m.**\n- Kicker \"Full-ocean-depth submersibles\". Headline: **THE DEEP, / FINALLY / LIT.**\n- Sub: \"Crewed submersibles for science, film and the few who need to see the bottom of the ocean with their own eyes.\"\n- Data list: Station Challenger Deep · Sea state 2 — slight · Local 05:42 ChST · Seafloor 10,935 m below.\n- \"Scroll to descend\".\n- The vehicle floats at the waterline in the half-in/half-out view (dawn sky above, blue water below), bobbing slightly,\n  with pointer parallax and god rays.\n- Give the headline legibility on the bright sky with **one soft radial gradient behind the whole block**. A\n  text-shadow gets clipped by the line masks into hard boxes.\n\n**01 Surface — 0 → 200 m** (200 vh, sticky).\n- The lens plunges and bubbles shake loose.\n- A giant marquee, one outline row and one solid row, slides with the scroll: Titanium · 1,100 bar · 10,935 m · Hadal zone ·\n  Three crew · Ninety millimetres · No light.\n- The marquee stays invisible until its **bottom edge has cleared the HUD bar**, then fades in.\n- Note: label \"Euphotic zone\", \"0 — 200 M\", \"By two hundred metres, ninety-nine percent of the sunlight is gone.\n  Everything below is the part of the planet nobody sees.\"\n\n**02 Manifesto — 1,000 m** (pinned). Eyebrow \"Why we build\". The statement lights up word by word on scroll; the\nasterisked words are orange:\n\"Fewer people have touched the \\*bottom of the ocean\\* than have flown to space. We build the machines that change that —\na \\*titanium sphere,\\* three seats and a window onto the last unlit place on Earth. We go down. We come back. \\*Every time.\\*\"\nThen three counters: **10,935 m** Full ocean depth, certified · **1,100 bar** On the hull at the bottom · **212** Crewed\ndives since 2023. The floodlights ignite during this chapter.\n\n**03 Fleet — 2,000 m** (pinned horizontal track).\n- Title **THREE VEHICLES. / ONE DIVE.**\n- Intro: \"A crewed sphere, a swarm that maps around it and a lander that waits on the floor. Designed together, deployed together.\"\n- The track **holds on each vehicle**. Each card fades as it leaves its rest position, and the 3D carousel reads the\n  track's real x position. Huge outline ghost names sit behind.\n- Cards (index / type / name / body / six specs):\n  - **01 Crewed submersible — HADAL-1.** \"A 90 mm titanium sphere carries a pilot and two observers to any point on the\n    seafloor — and brings them home.\" Depth rating 11,000 m · Crew 1 pilot + 2 · Descent 3 h 48 min · Bottom time 6 h ·\n    Life support 96 h · Mass in air 11.9 t.\n  - **02 Autonomous drone swarm — SHOAL** (12 instanced drones). \"Twelve autonomous drones peel away from HADAL-1 at the\n    bottom to map, light and film the trench around the crew in real time.\" Units 12 · Depth rating 11,000 m ·\n    Endurance 30 h · Survey 4 km² / dive · Sensors Lidar · 8K · Link 40 Mb/s optical.\n  - **03 Seabed lander — ANCHOR** (titanium truss, six glass floats in orange hardhats, instrument column, bait arm,\n    traps, ballast plate). \"A free-fall lander that waits on the floor for weeks: sample cache, navigation beacon and\n    weather station for the deep.\" Deployment 30 days · Depth rating 11,000 m · Payload 400 kg · Beacon 12 kHz ·\n    Traps 6 baited · Release Acoustic.\n- \"HADAL-1\" must never break at the hyphen. Use a no-wrap span.\n- Phones and reduced motion: the panels stack vertically.\n\n**04 Anatomy — 3,500 m** (pinned).\n- Title **ANATOMY OF / A HADAL-1.**\n- Intro: \"Eleven point nine tonnes, neutrally buoyant, built around one perfect sphere. Hover a system — or keep scrolling.\"\n- The model explodes on an engineering grid. Scroll or hover highlights one system in orange while the others dim, and\n  an SVG leader line plus a tag track the part in 3D, clamped to a safe area.\n- List (index / name / tag) — all eight must stay visible:\n  01 Hull sphere Ø 2.28 m · 02 Viewports 3 × 140 mm · 03 Syntactic foam 12 m³ · 04 Thrusters 6 × 5.2 kW ·\n  05 Ballast 2 tanks · 6 weights · 06 Floodlights 6 × 22,000 lm · 07 Manipulators 2 × 7-function · 08 Sonar & sensors 400 kHz.\n- Detail notes and three stats per part:\n  - **Hull:** \"Two forged Ti-6Al-4V hemispheres, machined to ±12 µm and joined at the equator.\" Outer Ø 2.28 m · Wall 90 mm · Mass 6.0 t.\n  - **Viewports:** \"Three cast-acrylic cones. The deeper you go, the tighter they seat.\" Count 3 · Thickness 140 mm · Field of view 210°.\n  - **Foam:** \"Hollow glass microspheres in epoxy. It floats at any depth and makes the whole vehicle weightless.\"\n    Volume 12 m³ · Density 0.69 g/cm³ · Net lift 4.0 t.\n  - **Thrusters:** \"Six oil-compensated brushless thrusters with magnetic couplings. No seals to fail.\"\n    Units 6 · Power 5.2 kW each · Cruise 1.5 kn.\n  - **Ballast:** \"Variable-ballast tanks trim the dive; six steel weights drop to begin the ascent.\"\n    Tanks 2 × 180 L · Drop weights 6 × 90 kg · Descent 0.8 m/s.\n  - **Floodlights:** \"Six LED floodlights recessed into the bow and the skids. Daylight colour, on demand.\"\n    Units 6 · Total output 132,000 lm · Colour 5,600 K.\n  - **Manipulators:** \"Two seven-function hydraulic arms with force feedback and a science basket between them.\"\n    Arms 2 · Reach 1.9 m · Lift 120 kg.\n  - **Sonar & sensors:** \"Forward multibeam sonar, a pan-tilt 8K camera and an acoustic modem to the surface.\"\n    Sonar 400 kHz · Camera 8K / 60 · Modem 12 kHz.\n\n**05 Pressure — 5,000 m** (pinned).\n- Title **PRESSURE, / MADE VISIBLE.**\n- Body: \"At the bottom of the Challenger Deep every square metre of the hull carries eleven thousand tonnes. The sphere does\n  not survive by being strong. It survives by being perfect.\"\n- Everything except the crew sphere dissolves away. Then:\n  - an FEA stress map;\n  - thousands of GPU streaks converging on the hull, kept out of the copy with screen-space keep-out zones;\n  - contracting isobar shells.\n- **The slider and the scroll are the same control**: dragging scrolls the pinned section.\n  - The slider runs 0–11,000 m, with ticks at their **true positions**: 0, 2k, 4k, 6k, 8k, 11k.\n  - It has `aria-valuetext`.\n  - Hint: \"Drag the depth — or keep scrolling\".\n- Readout panel titled **\"Simulation · Ti-6Al-4V sphere\"**: Pressure at depth · Load on the hull · Hull Ø change ·\n  Margin to proof test (\"to 1,375 bar\"), all from the same rounded simulated depth.\n- Hull creaks in the audio.\n\n**06 Floodlight — 7,000 m** (pinned, the signature moment).\n- Title **NO LIGHT / REACHES HERE.**\n- Body: \"Below a thousand metres the only light is yours, and the faint glow of the animals. Take the floodlight.\"\n- Every light goes out: hemisphere, rim, fill, env and the sub's lights drop to about 0, and bloom drops 62 %.\n- The pointer aims a narrow floodlight (beam angle 0.135 rad), with an x-ray lens (0.088 rad, 1.3× on portrait) at its\n  centre that reveals the cabin, frame and foam as orange fresnel + wireframe.\n- A **resting mouse keeps aiming**. Only touch, or no pointer, falls back to a slow idle sweep around the hull.\n- \"SCAN\" callouts pin to the parts nearest the lens: up to two on desktop, one on narrow screens.\n  - They are portalled above the cursor ring, with a near-opaque backing.\n  - They never overlap: a second one that would touch the first is dropped.\n  - They stay out of the copy column and clear of the bars.\n  - On phones one fades out before the next fades in.\n- Callout texts:\n  - Hull sphere — Ti-6Al-4V · 90 mm\n  - Crew — 3 seats · 96 h life support\n  - Viewport — 140 mm acrylic\n  - Buoyancy — Syntactic foam · 0.69 g/cm³\n  - Thruster — 5.2 kW · magnetic coupling\n  - Ballast — 6 × 90 kg drop weights\n  - Manipulator — 7 functions · 120 kg\n  - Floodlight — 22,000 lm\n  - Sonar — 400 kHz multibeam\n- Hints: \"Move to aim the floodlight\" / \"Touch to aim the floodlight\". Jellyfish flare when lit.\n\n**07 Materials — 8,500 m** (pinned). Three macro specimens built in code. Each has its own headline, lead, note and three\ncounters, switched by **real A / B / C buttons**:\n- **A · Hull wall · Ti-6Al-4V · forged** — **90 MM OF / TITANIUM.**\n  \"Two forged hemispheres, each machined for 1,400 hours and lapped until the joint between them is flatter than a\n  wavelength of light.\" Note: \"A section of the sphere at the equator joint: 90 millimetres of titanium between three\n  people and 1,100 bar.\" Stats: ±12 µm Sphericity · 1,400 h Machining / hemisphere · 0.3 µm Joint flatness.\n  Visual: a curved hull-wall section with a hatched cut face; metallic grey #b9bdc2 with the brushed normal map.\n- **B · Syntactic foam · Glass microspheres in epoxy** — **GLASS THAT / FLOATS.**\n  \"Hollow glass beads locked in epoxy. Foam that cannot be crushed keeps the whole vehicle weightless all the way to the\n  bottom.\" Note: \"Each microsphere is a hollow bead 40 µm across — about eighteen million of them in every cubic\n  centimetre.\" Stats: 0.69 g/cm³ Density · 40 µm Bead diameter · 18 million Beads per cm³.\n  Visual: a rounded block with an **off-white core**, an orange gel coat and a cut face of sliced hollow microspheres.\n- **C · Viewport · Cast PMMA · annealed** — **140 MM OF / CLEAR.**\n  \"Acrylic flexes where glass would shatter. Each viewport is a truncated cone that the ocean presses tighter into its\n  seat.\" Note: \"A 140 mm cone with a 90° included angle. At full depth it creeps 0.6 mm inwards and seals itself harder.\"\n  Stats: 140 mm Thickness · 0.6 mm Creep at 1,100 bar · 92 % Light transmission.\n  Visual: a cut-away acrylic cone in its titanium seat, fresnel glass (no transmission).\n\n**08 The yard — 9,500 m** (pinned).\n- Title **BUILT IN / THE DARK.**\n- Body: \"Every HADAL-1 is assembled in a clean hall on the Norwegian coast and proven in a pressure chamber before it ever\n  touches the sea. We take the hull past the bottom of the ocean. Then we do it again.\"\n- Visual: a holographic line drawing of a test chamber draws itself around the vehicle, with a scanning ring.\n- Stats: 1,375 bar Proof pressure · 312 Pressure cycles · 14,600 h Build hours.\n- Steps:\n  - 01 Forge — \"Two titanium billets, 8.2 t each, forged into hemispheres at 950 °C.\"\n  - 02 Machine — \"1,400 hours per hemisphere on a five-axis mill. Measured every 30 minutes.\"\n  - 03 Assemble — \"14,600 hours by 38 people. Every bolt torqued twice, by two hands.\"\n  - 04 Prove — \"312 cycles to 1,375 bar — a quarter deeper than the deepest point on Earth.\"\n- Keep the wireframe clear of the copy and the step row.\n\n**09 Dive log — 10,000 m+.**\n- Title **PROVEN AT / THE BOTTOM.**\n- Intro: \"Two hundred and twelve crewed dives. Every one of them ended at the surface.\"\n- Rows (year / dive / site / note / depth bar scaled to 11,000 m; full-ocean-depth rows in orange):\n  - 2023 · 001 · Azores Plateau · 1,240 m · \"First crewed descent. Sea trials.\"\n  - 2023 · 017 · Puerto Rico Trench · 8,376 m · \"The deepest point of the Atlantic.\"\n  - 2024 · 058 · South Sandwich Trench · 7,434 m · \"Coldest dive on record: 0.6 °C.\"\n  - 2024 · 093 · Kermadec Trench · 10,047 m · \"First science payload past 10 km.\"\n  - 2025 · 141 · Challenger Deep · East Pool · 10,935 m · \"Full ocean depth. Three crew.\"\n  - 2026 · 212 · Challenger Deep · West Pool · 10,928 m · \"Routine.\"\n- Sonar pings in the audio only; no visible sonar mesh.\n- Use non-breaking spaces so no unit or word is orphaned.\n\n**10 Seabed — 10,935 m: touchdown screen.**\n- The floor rises into the lights (46 m over the end of the log) and the vehicle settles with a sediment puff, a contact\n  shadow and a thud.\n- Eyebrow \"10 —— Seabed · 10,935 m\", headline **BOOK / A DIVE.**\n- Telemetry: Touchdown 3 h 48 min after release · Floor 10,935 m · 1,100 bar · 2.46 °C · Site Challenger Deep · East Pool.\n- Lead: \"Three seats. Six hours on the floor of the Challenger Deep. Tell us why you need to go.\"\n- One CTA: \"Request a briefing →\".\n\n**Briefing screen.**\n- The camera looks down at clean sediment in front of the vehicle.\n- Title **REQUEST A / BRIEFING.**\n- Copy: \"Every request is read by a pilot. Tell us who you are and what you want to see down here.\"\n- Facts: Seats per season 18 · Training 9 days · Support ship MV Hadal Tender.\n- Form panel \"Dive briefing request · Form HDL-27\":\n  - Full name, Email, Organisation (optional), Season (Spring 2027 / Autumn 2027 / Spring 2028 / Flexible);\n  - Purpose chips (Science / Film & media / Exploration / Private);\n  - \"Why do you need to go?\" as a **visible bordered textarea**;\n  - \"Request briefing →\";\n  - \"Concept site — nothing you type here leaves your browser.\"\n- **Nothing is ever sent.** Inline validation (name ≥ 2 chars; valid email; reason ≥ 12 chars) focuses the first error.\n- Success state, compact enough to fit inside the form's height and the page must not jump:\n  - \"● Received\", \"BRIEFING REQUESTED.\", \"A pilot reads every request. Here is what happens next.\";\n  - 72 h — A pilot replies with questions and a call slot · 2 weeks — Pre-dive medical and a video briefing with the\n    crew · 9 days — Training at sea on MV Hadal Tender · Dive day — 3 h 48 min down. Six hours on the floor.;\n  - a local reference number, the season, and \"New request\".\n\n**Footer.**\n- Logo, \"HADAL Deep Systems · Full-ocean-depth submersibles\".\n- Links: Fleet, Anatomy, Pressure, Materials, Dive log, Book a dive.\n- Coordinates and \"10,935 m · 1,100 bar · 2.46 °C\". \"Surface ↑\" scrolls back to the top.\n- A giant HADAL wordmark half-buried in an **SVG sediment drift**, deep on the left and shallow on the right so the \"L\"\n  keeps its foot.\n- \"HADAL is a fictional company. A concept site, 2026.\" and \"Model built in Blender from Python · Rendered live with\n  Three.js\".\n- The vehicle goes back to the dark, leaving only its lamps lit. Stretch the seabed mesh to about 170 m and level off\n  the trench walls, so no mesh edge shows through the fog.\n\n## 9. Responsive, short screens, reduced motion, accessibility\n\n- **Compact layout below 900 px wide:**\n  - the fleet stacks;\n  - per-shot portrait camera framing (separate phone and portrait-tablet offsets/distances);\n  - lighter particle counts;\n  - the floodlight follows the finger.\n- **Short laptop browsers are mandatory test targets.** Toolbars eat 150–250 px, so 1512 × 730 and 1366 × 650 are\n  real viewports.\n  - Every pinned chapter must fit between the nav and the HUD bar.\n  - Cap display type by height as well as width (`min(vw, vh)`). Size the manifesto statement from the space left\n    over: `calc((100svh − 400px) / 9.4)`.\n  - Below ~860 px of height, hide the fleet intro and the anatomy detail panel.\n  - Below ~720 px, tighten lists, spec rows and form fields.\n  - The touchdown screen may grow (`min-height`) instead of clipping.\n- **Reduced motion:** no Lenis (native scroll), no horizontal pin, fades instead of line reveals, instant counters,\n  camera parallax off.\n- **Accessibility:** WCAG 2.1 AA.\n  - axe reports 0 violations.\n  - Headline accessible names read naturally (\"The deep, finally lit.\").\n  - Real buttons for tabs.\n  - Labelled sound toggle.\n  - Focus management after form submit.\n  - Monospace labels mostly 10.5–11 px, with secondary ones (gauge, scan sub-lines) at 10 px.\n- **Adaptive quality:** drei `PerformanceMonitor` (bounds 45–58 fps) lowers DPR and particle counts.\n  Starting DPR is min(devicePixelRatio, 1.75), or 1.5 on compact.\n\n## 10. Quality bar and review (do not skip)\n\n**Health targets:**\n- `npm run build` passes with 0 TypeScript errors.\n- **0 console errors and 0 warnings**.\n- 60 fps while scrolling on a recent laptop GPU.\n- GLB under 3 MB.\n- No horizontal page scroll at any width.\n\n**Review harness** (`scripts/review.mjs`, Playwright):\n- Run headless Chromium with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` on macOS for a real GPU.\n- `?review` exposes `window.__HADAL__` (scrollToT, scrollToY, maxScroll, dive, ui state).\n- Screenshot every chapter at **1440×900, 1512×730, 1366×650, 1280×800, 1024×768, 768×1024 and 390×844 @2x**, plus a\n  reduced-motion pass.\n- Record console output, run a 45 s full-scroll fps measurement, and check the slider, form errors/success and the sound\n  toggle.\n- Click the magnetic submit button with `{ force: true }`. Playwright's \"not stable\" retries otherwise scroll the page natively.\n- Add a `?nandebug` mode that paints NaN pixels magenta. Scan every capture for large pure-black (0,0,0) regions: a\n  black slab means NaN reached the bloom chain.\n\n**Process:**\n- At least three review rounds. Save screenshots, contact sheets and a `REVIEW.md` with honest per-chapter scores in `review/round-N/`.\n- **Self-review overrates.** After your own rounds, get an independent reviewer that has not seen the code to judge only\n  the screenshots, and fix what it finds. Specifically check:\n  - fixed UI vs scrolling content;\n  - every number shown twice agreeing;\n  - copy matching what's on screen;\n  - short laptop heights;\n  - phone widths.\n\n**Deliverables:**\n- `README.md`: how to run, how to rebuild the model, project structure.\n- `REPORT.md`: what was built, key decisions, final scores, honest shortcomings, best screenshots from `review/final/`.\n- `DECISIONS.md`, `PROGRESS.md`, `blender/hadal.blend`, `blender/previews/`, `public/models/hadal.glb`.\n\n## 11. Known pitfalls (each one cost real time in the original build)\n\n**Rendering:**\n- Never add objects to a scene inside `model.traverse()`: collect them first, then add.\n- `isnan()` is unreliable under Metal fast-math. Use exponent-bit tests, and guard **both** the scene buffer and the\n  bloom texture.\n- `@react-three/postprocessing` wrappers rebuild the effect on any prop change. Build heavy effects once.\n- A finish/grain effect must not sample `inputBuffer` with offsets (chromatic aberration) inside a merged EffectPass.\n  It produced all-green frames.\n- Avoid `transmission` with DoubleSide (feedback-loop warnings) and anisotropic materials on boolean-cut meshes (NaN).\n\n**Layout and CSS:**\n- `text-shadow` on SplitText-masked lines is clipped into hard boxes. Put halos on a pseudo-element with `isolation: isolate`.\n- A fixed overlay inside a ScrollTrigger-pinned section can't rise above root-level fixed UI. Portal it to `<body>`.\n- A marquee in a CSS grid needs `minmax(0, 1fr)` and `overflow-x: clip`, or phones get a horizontal scroll.\n\n**Testing:**\n- Hidden or background browser tabs throttle to about 1 fps. Measure fps headless."
};

export function getBody(id) {
  if (id == null) return null;
  const key = String(id).padStart(2, '0');
  return BODIES[key] || BODIES[String(id)] || null;
}
