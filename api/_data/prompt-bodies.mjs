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
  '10': "# HADAL — Build Prompt\n\n> Paste everything below the line into an agentic AI coding tool that can read and write files and run shell commands\n> (for example Claude Code). It describes the HADAL site exactly as it was built: every word of copy, every colour,\n> every number and every technical decision is taken from the finished source code.\n>\n> **Before you start, you need:**\n> - Node.js 20 or newer;\n> - Blender 4.x or newer, installed locally (the original used Blender 5.2.2);\n> - about 2–3 GB of free disk space;\n> - a model and plan that allows a long session: the original build took several hours across multiple review rounds.\n>\n> **Be clear with your buyers:** AI output is not deterministic. The same prompt produces a different build on a different\n> model, tool, machine or day. This prompt specifies the target precisely; it cannot guarantee an identical result.\n\n---\n\n## 0. The job\n\nBuild **HADAL**, an award-level, fully animated 3D marketing website for a **fictional** maker of full-ocean-depth crewed\nsubmersibles. Work autonomously inside this project folder. Record every judgement call in `DECISIONS.md` and keep\n`PROGRESS.md` updated after every phase so the work can be resumed. If `PROGRESS.md` exists when you start, read it first and continue\nfrom \"Next\".\n\n**The idea:** scrolling the page *is* the dive. One persistent WebGL scene and one camera follow the scroll from the\nsea surface (0 m) to the floor of the Challenger Deep (10,935 m). The deeper you scroll, the darker, colder and quieter\nit gets. HTML sections are overlays on top of the canvas. The footer is the seabed. No pre-rendered video and no fake 3D.\n\n**Ground rules**\n- Local only. Do not deploy, push, open tunnels or create accounts unless I ask.\n- Free, open-licensed dependencies only (npm packages, self-hosted Google Fonts via `@fontsource`). No paid APIs and no\n  AI image/3D generation. Every model, texture and sound is made in code.\n- Stay inside the project folder. Don't change system settings.\n- Don't stop halfway. Finish every phase, including review and documentation.\n\n## 1. Stack (pin these)\n\n- Vite + React 19 + TypeScript (strict).\n- `three` **0.182.x**, pinned (`^0.182.0`), with `@types/three` 0.182. Do **not** use r183+: React Three Fiber 9 still constructs\n  `THREE.Clock`, which r183 logs as deprecated, and the site must have zero console warnings.\n- `@react-three/fiber` 9, `@react-three/drei` 10, `@react-three/postprocessing` 3, `postprocessing` 6.39.\n- `gsap` 3.15 with ScrollTrigger and SplitText (free in the `gsap` npm package), `lenis` 1.3, `zustand` 5.\n- Fonts: `@fontsource-variable/archivo` (needs the **width axis**) and `@fontsource-variable/jetbrains-mono`, self-hosted and\n  preloaded, with `font-display: swap`.\n- Dev tools: `@gltf-transform/cli` + `meshoptimizer` (model optimisation), `playwright` (screenshots, fps),\n  `@axe-core/playwright` (accessibility).\n- Blender, headless: `/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python blender/build_sub.py -- --export`\n  on macOS; use the platform equivalent elsewhere.\n- Use fixed dev/preview ports with `--strictPort --host 127.0.0.1`. If 5173 is taken, choose another; never kill\n  another app's process.\n\n## 2. Architecture (non-negotiable; this is what makes it feel like one continuous dive)\n\n1. **One clock.** The GSAP ticker drives everything in a fixed order: `lenis.raf` → ScrollTrigger update → the dive-state\n   update → per-frame callbacks → R3F render. The `<Canvas>` uses `frameloop=\"never\"` and is advanced with `advance()`\n   from the ticker, so scroll, DOM and WebGL never drift apart. Call `gsap.ticker.lagSmoothing(0)`. Skip rendering when the tab is hidden.\n2. **State.** A mutable `dive` object holds per-frame values (t, depth, mouse, progress of each pinned chapter); zustand\n   holds only low-frequency UI state (section, sound on/off, intro done, reduced motion, compact layout). No React re-render per frame.\n3. **The chapter coordinate `t`** = section index + progress through that section, measured from `[data-section]`\n   elements. Section indices: 0 hero · 1 surface · 2 manifesto · 3 fleet · 4 anatomy · 5 pressure · 6 floodlight ·\n   7 materials · 8 yard · 9 dive log · 10 seabed.\n4. **The Director** (`src/scene/director.ts`) is the only place that turns `t` and depth into the world state:\n   - camera shot (target, azimuth, elevation, distance, fov, horizontal shift via `filmOffset`);\n   - per-shot portrait offsets and distances for phones and tablets;\n   - lights, water colour and fog;\n   - every effect weight (explode, isolate, heat, flood, fleet, specimens, chamber, bubbles, rays, snow,\n     bioluminescence, jellyfish, landed).\n\n   Shots blend with a smoothstep between timeline keys. Sections only write their own pinned progress\n   (`fleetP`, `anatomyActive`, `pressureDepth`, `specP`, `chamberP`).\n5. **Depth model.** Depth is a piecewise function of `t`, eased inside each segment. **Each chapter holds at the depth\n   its eyebrow label states (±15 m)** while it is being read, and the descent happens between chapters, so the HUD, the\n   eyebrow and the gauge never disagree. Use these keys (`[t, depth m]`):\n   `[0,0] [0.42,0] [1.0,24] [1.7,200] [2.0,420] [2.3,985] [2.9,1015] [3.0,1985] [3.92,2015] [4.08,3485] [4.92,3515]\n   [5.08,4985] [5.9,5015] [6.1,6985] [6.9,7015] [7.08,8485] [7.9,8515] [8.1,9485] [8.9,9515] [9.08,9990] [9.5,10060]\n   [10.0,10935] [11,10935]`.\n6. **Scroll restoration** is `manual`; scroll to the top on load.\n\n## 3. Physics: every number derives from one file (`src/tokens.ts`)\n\n- `MAX_DEPTH = 10935` m (Challenger Deep, Eastern Pool). `RATED_DEPTH = 11000` m. `PROOF_BAR = 1375` (125 % of the deepest point).\n- Pressure (bar) = `1.01325 + 0.1005 × depth` → **1,100 bar** at 10,935 m.\n- Load on the hull (t/m²) = `bar × 10.197`.\n- Hull diameter change (mm), thin-shell, Ti-6Al-4V: `p[MPa] = (bar − 1.01325) × 0.1`;\n  `Δ = p × 1.095² × (1 − 0.342) / (2 × 113800 × 0.09) × 2 × 1000` → about −8.5 mm at the bottom. Display it negative.\n- Margin to proof test = `1375 / bar` (×1.24 at the bottom). Call it \"margin to proof test\", never \"safety factor\".\n- Daylight remaining (%) = `100 × e^(−0.023 × depth)` (1 % at 200 m). Show three decimals, and bottom out at 0.000 % —\n  never scientific notation.\n- Water temperature (°C), linear between `[0,28.4] [60,28.1] [150,24.2] [300,13.5] [600,7.1] [1000,4.3] [2000,2.3]\n  [4000,1.55] [6000,1.49] [8000,1.81] [10935,2.46]`.\n- Ocean zone label: Epipelagic < 200 m · Mesopelagic < 1,000 · Bathypelagic < 4,000 · Abyssopelagic < 6,000 · Hadal zone.\n- `darkness(d) = 1 − (1 − d/10935)^6`. The colour shift is front-loaded, like the real ocean.\n\n## 4. Design system\n\n**Colours** (CSS custom properties):\n\n| Token | Value |\n|---|---|\n| `--abyss` | `#03060a` |\n| `--navy` | `#071423` |\n| `--surface` | `#2e7fb8` |\n| `--surface-deep` | `#0b3a5c` |\n| `--ti` (titanium text) | `#c9ced6` |\n| `--ti-dim` | `#9aa2ad` |\n| `--muted` | `#7d8794` |\n| `--orange` (signature) | `#ff5a1f` |\n| `--cyan` (bioluminescence, sonar) | `#4ff0d2` |\n| `--line` | `rgba(201,206,214,.14)` |\n| `--line-strong` | `rgba(201,206,214,.28)` |\n\n**Type:**\n- Display: Archivo variable at `font-stretch: 125%`, weight ~860, uppercase, line-height 0.88. **Every headline ends in\n  an orange full stop.** Archivo's period is square at this weight; keep it.\n- Body: Archivo.\n- Labels and data: JetBrains Mono, uppercase and letter-spaced, 10.5–11 px.\n- Sizes: `--fs-h1: clamp(52px, 10.6vw, 196px)`, `--fs-h2: clamp(42px, 7.4vw, 138px)`,\n  `--fs-body: clamp(15px, .35vw + 13.6px, 18px)`, `--fs-lead: clamp(18px, .6vw + 14px, 24px)`.\n\n**Space and layout:**\n- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160 px.\n- `--gutter: clamp(20px, 3.6vw, 64px)`.\n- `--nav-h: 72px` (64 px below 900 px wide); `--hud-bar: 68px` (60 px below 900 px wide).\n\n**Motion:**\n- `power4.out` for reveals, `expo.out` for staggers, `power2.out` for number counters, CSS ease\n  `cubic-bezier(.16,1,.3,1)`.\n- Animate only `transform` and `opacity` on DOM elements. Use deliberate ScrollTrigger start points\n  (e.g. `top 82%`), and scrub wherever an animation is tied to the dive.\n- Headlines split into masked lines with SplitText (`autoSplit`, `aria: 'auto'`) and rise out of their masks.\n\n## 5. The submersible (Blender, built 100 % from Python)\n\n`blender/build_sub.py` builds HADAL-1 from code (bmesh lathes, lofts and EXACT booleans), saves `blender/hadal.blend`,\nrenders previews to `blender/previews/`, and exports `blender/export/hadal_raw.glb`. Iterate at least three times\nagainst the previews before moving on.\n\n**The form:** Triton / Limiting-Factor style.\n- A 2.28 m titanium crew sphere with a real 90 mm wall, three truncated-cone acrylic viewports, and an equatorial joint\n  with 48 bolts.\n- A big orange syntactic-foam body **lofted from superellipse sections**: rounded, flat-bottomed, sloping bow, with\n  seams and recessed bow lights. A bevelled box reads as a fridge, so don't use one.\n- An open box-beam chassis with skids.\n- Six ducted thrusters with spinning props.\n- Ballast tanks and six drop weights.\n- Two seven-function manipulator arms and a sample basket.\n- A sonar dome, pan-tilt camera, battery pod, cables, comms mast and deck hardware.\n- \"HADAL\" lettering as real geometry, using Archivo instanced to a static TTF (wdth 125, wght 850) with fontTools.\n- A simple cabin (three seats, consoles, life support) for the x-ray.\n\nRoughly 100k triangles. Textures are generated with numpy (FFT-filtered tileable noise: foam colour/ORM/normal, brushed\ntitanium normal/ORM). Pivot at the sphere centre, metres, Y-up in glTF.\n\n**Named parts** (the site depends on these exact names):\n`Hull_Sphere`, `Viewport_Front/Left/Right`, `Frame`, `Foam_Block`, `Foam_Lettering`, `Thruster_*` with `Prop_*` children,\n`Ballast_Tank_L/R`, `Ballast_Drop_Weights`, `Light_*` with emissive `Light_*_Lens`, `Arm_L/R`, `Sample_Basket`,\n`Sonar_Dome`, `Camera_Pod`, `Battery_Pod`, `Cables`, `Comms_Mast`, `Deck_Hardware`, `Interior_*`.\n\n**Optimise** with gltf-transform using meshopt + WebP 1024 and **`--join false --flatten false --instance false --palette\nfalse --simplify false`**, so every named node survives. Target under 3 MB; the original came out at 0.82 MB.\nQuantisation moves node origins, so re-pivot the props around their thruster origins and compute part anchors from\nbounding boxes.\n\n## 6. The world (post-processing, shaders, particles)\n\n- **The ocean is a post-process pass**, not a skybox: sky above and water column below are painted per pixel from the\n  view direction, with depth fog, absorption and caustics near the surface. Background pixels render black so additive\n  particles survive.\n- **Half-in, half-out hero:** a virtual dome port. A pixel is underwater if its ray is below the waves at a dome 1.5 m in\n  front of the lens. The water mesh uses the same test to discard itself, giving a real meniscus line in a single render.\n  The lens floats **0.34 m above mean water level**, and the split is drawn at lens height, so waves never create a\n  second horizon. The underside of the surface shows Snell's window, with a dithered far fade.\n- **Post chain, in order:**\n  1. a separate **sanitise pass**: replace NaN/Inf with 0 and clamp to 0–48. Test the float's **exponent bits** with\n     `floatBitsToUint(x) & 0x7f800000u` — `isnan()`/`isinf()` can be compiled away under Metal fast-math;\n  2. **Bloom**: mipmapBlur, intensity 0.85 (0.6 on low quality, × (1 − 0.62 × floodlight)), threshold 0.62,\n     smoothing 0.25, radius 0.72, levels 6. Subclass `BloomEffect` and **sanitise the final mip texture too**, before it\n     is composited. Build it once with `useMemo` and set intensity imperatively; a prop change on the stock wrapper\n     rebuilds the whole effect;\n  3. the underwater pass;\n  4. **Neutral tone mapping** (not AgX, which turns the orange salmon);\n  5. finish: vignette + grain.\n\n  A single NaN texel otherwise spreads through the bloom mip chain into a hard-edged black rectangle.\n- **One shader patch for the whole sub** (`onBeforeCompile` on standard PBR):\n  - per-part highlight, dim and dissolve (with a glowing noise edge);\n  - an FEA-style stress heat map with contour isolines and hot spots around the viewports and hatch;\n  - an x-ray lens: hull cut away inside a cone around the aim direction, measured in angle space, plus an orange\n    fresnel + wireframe ghost of the interior. Exclude the lettering from the ghost.\n\n  Guard every normal you normalise.\n- **Particles:**\n  - marine snow, increasing with depth;\n  - bubbles near the surface;\n  - god rays in the sunlit zone;\n  - bioluminescent sparks, `ramp(depth, 4200, 6400)`;\n  - jellyfish: fresnel bells with travelling-light tentacles, only in the floodlight chapter and never in front of copy.\n- **Lights:**\n  - The sub's own floodlights switch on between **880 and 1,000 m** with an ignition flicker.\n  - A soft \"studio\" key/fill/env lift applies **only** in the inspection chapters: fleet, anatomy, pressure, yard.\n    Everywhere else follows the physics.\n\n## 7. Always-on UI\n\n- **Nav** (fixed):\n  - HADAL logo; monospace links \"03 Fleet · 04 Anatomy · 05 Pressure · 09 Dive log\". Nav numbers must equal chapter numbers.\n  - \"Sound off\" toggle.\n  - Orange magnetic **\"BOOK A DIVE →\"** button.\n  - Below 1,024 px wide: an **\"Index\"** menu (a portal to `<body>`, with focus trap and Esc) listing every chapter.\n    Below 900 px, sound moves into that menu.\n- **HUD** (fixed, bottom):\n  - Depth (m), pressure (bar, 1 decimal), water (°C, 2 decimals), daylight (%, 3 decimals), zone (orange).\n  - A vertical depth gauge on the right with a marker per chapter; clicking a marker dives there.\n  - A needle shows the live depth on a dark chip. The needle's reading hides in the dive log, and the \"11k\" end label\n    hides once the needle reaches it.\n- **Chrome bars:** after the hero (t > 0.55), the nav and the HUD sit on **fully opaque** `#03060a` bars with a hairline.\n  Content passes *under* the UI, never through it. Translucent + blur fails, because big type stays readable.\n  Set the HUD's state classes imperatively, so React never rewrites them.\n- **Custom cursor** (pointer devices only):\n  - A crosshair plus a trailing ring with a per-chapter verb: Descend, Read, Scroll, Inspect, Drag, Light, Look, Land.\n  - No verb in the dive log, while the preloader runs, or after touchdown.\n  - The native cursor over form fields.\n  - In the floodlight chapter the ring becomes the x-ray lens and is drawn exactly where the beam is aimed.\n- **Sound:** Web Audio, generated in code, **off by default**. The toggle is the user gesture that creates the\n  AudioContext. Layers:\n  - a drone that lowers and muffles with depth;\n  - surf at the surface;\n  - sonar pings;\n  - hull creaks in the pressure chapter;\n  - a floodlight hum;\n  - a thud on landing.\n\n## 8. The chapters (copy is final; use it word for word)\n\nEach chapter has an eyebrow in this format: `NN —— LABEL · DEPTH M`.\n\n**Preloader.**\n- Frame: corner ticks, top-left \"HADAL-1 · PRE-DIVE CHECK\", top-right \"11°22.4′N 142°35.5′E\", bottom-left\n  \"DIVE 0213 · CHALLENGER DEEP\", bottom-right the live percentage.\n- Centre: \"● HADAL DEEP SYSTEMS\", a giant counter from 1 to **1,100** with an orange \"BAR\" unit and an orange progress rule.\n- A three-step checklist with \"OK\" turning orange: 01 Typefaces · 02 Hull geometry · HADAL-1 · 03 Compiling shaders.\n- The line \"Pressurising to 1,100 bar · 10,935 m\", and a slow sonar sweep behind.\n- Driven by **real** loading (fonts, model, GPU shader warm-up that visits every chapter state), never shorter than 1.9 s.\n- It exits with two halves parting like a hatch.\n\n**00 Hero — 0 m.**\n- Kicker \"Full-ocean-depth submersibles\". Headline: **THE DEEP, / FINALLY / LIT.**\n- Sub: \"Crewed submersibles for science, film and the few who need to see the bottom of the ocean with their own eyes.\"\n- Data list: Station Challenger Deep · Sea state 2 — slight · Local 05:42 ChST · Seafloor 10,935 m below.\n- \"Scroll to descend\".\n- The vehicle floats at the waterline in the half-in/half-out view (dawn sky above, blue water below), bobbing slightly,\n  with pointer parallax and god rays.\n- Give the headline legibility on the bright sky with **one soft radial gradient behind the whole block**. A\n  text-shadow gets clipped by the line masks into hard boxes.\n\n**01 Surface — 0 → 200 m** (200 vh, sticky).\n- The lens plunges and bubbles shake loose.\n- A giant marquee, one outline row and one solid row, slides with the scroll: Titanium · 1,100 bar · 10,935 m · Hadal zone ·\n  Three crew · Ninety millimetres · No light.\n- The marquee stays invisible until its **bottom edge has cleared the HUD bar**, then fades in.\n- Note: label \"Euphotic zone\", \"0 — 200 M\", \"By two hundred metres, ninety-nine percent of the sunlight is gone.\n  Everything below is the part of the planet nobody sees.\"\n\n**02 Manifesto — 1,000 m** (pinned). Eyebrow \"Why we build\". The statement lights up word by word on scroll; the\nasterisked words are orange:\n\"Fewer people have touched the \\*bottom of the ocean\\* than have flown to space. We build the machines that change that —\na \\*titanium sphere,\\* three seats and a window onto the last unlit place on Earth. We go down. We come back. \\*Every time.\\*\"\nThen three counters: **10,935 m** Full ocean depth, certified · **1,100 bar** On the hull at the bottom · **212** Crewed\ndives since 2023. The floodlights ignite during this chapter.\n\n**03 Fleet — 2,000 m** (pinned horizontal track).\n- Title **THREE VEHICLES. / ONE DIVE.**\n- Intro: \"A crewed sphere, a swarm that maps around it and a lander that waits on the floor. Designed together, deployed together.\"\n- The track **holds on each vehicle**. Each card fades as it leaves its rest position, and the 3D carousel reads the\n  track's real x position. Huge outline ghost names sit behind.\n- Cards (index / type / name / body / six specs):\n  - **01 Crewed submersible — HADAL-1.** \"A 90 mm titanium sphere carries a pilot and two observers to any point on the\n    seafloor — and brings them home.\" Depth rating 11,000 m · Crew 1 pilot + 2 · Descent 3 h 48 min · Bottom time 6 h ·\n    Life support 96 h · Mass in air 11.9 t.\n  - **02 Autonomous drone swarm — SHOAL** (12 instanced drones). \"Twelve autonomous drones peel away from HADAL-1 at the\n    bottom to map, light and film the trench around the crew in real time.\" Units 12 · Depth rating 11,000 m ·\n    Endurance 30 h · Survey 4 km² / dive · Sensors Lidar · 8K · Link 40 Mb/s optical.\n  - **03 Seabed lander — ANCHOR** (titanium truss, six glass floats in orange hardhats, instrument column, bait arm,\n    traps, ballast plate). \"A free-fall lander that waits on the floor for weeks: sample cache, navigation beacon and\n    weather station for the deep.\" Deployment 30 days · Depth rating 11,000 m · Payload 400 kg · Beacon 12 kHz ·\n    Traps 6 baited · Release Acoustic.\n- \"HADAL-1\" must never break at the hyphen. Use a no-wrap span.\n- Phones and reduced motion: the panels stack vertically.\n\n**04 Anatomy — 3,500 m** (pinned).\n- Title **ANATOMY OF / A HADAL-1.**\n- Intro: \"Eleven point nine tonnes, neutrally buoyant, built around one perfect sphere. Hover a system — or keep scrolling.\"\n- The model explodes on an engineering grid. Scroll or hover highlights one system in orange while the others dim, and\n  an SVG leader line plus a tag track the part in 3D, clamped to a safe area.\n- List (index / name / tag) — all eight must stay visible:\n  01 Hull sphere Ø 2.28 m · 02 Viewports 3 × 140 mm · 03 Syntactic foam 12 m³ · 04 Thrusters 6 × 5.2 kW ·\n  05 Ballast 2 tanks · 6 weights · 06 Floodlights 6 × 22,000 lm · 07 Manipulators 2 × 7-function · 08 Sonar & sensors 400 kHz.\n- Detail notes and three stats per part:\n  - **Hull:** \"Two forged Ti-6Al-4V hemispheres, machined to ±12 µm and joined at the equator.\" Outer Ø 2.28 m · Wall 90 mm · Mass 6.0 t.\n  - **Viewports:** \"Three cast-acrylic cones. The deeper you go, the tighter they seat.\" Count 3 · Thickness 140 mm · Field of view 210°.\n  - **Foam:** \"Hollow glass microspheres in epoxy. It floats at any depth and makes the whole vehicle weightless.\"\n    Volume 12 m³ · Density 0.69 g/cm³ · Net lift 4.0 t.\n  - **Thrusters:** \"Six oil-compensated brushless thrusters with magnetic couplings. No seals to fail.\"\n    Units 6 · Power 5.2 kW each · Cruise 1.5 kn.\n  - **Ballast:** \"Variable-ballast tanks trim the dive; six steel weights drop to begin the ascent.\"\n    Tanks 2 × 180 L · Drop weights 6 × 90 kg · Descent 0.8 m/s.\n  - **Floodlights:** \"Six LED floodlights recessed into the bow and the skids. Daylight colour, on demand.\"\n    Units 6 · Total output 132,000 lm · Colour 5,600 K.\n  - **Manipulators:** \"Two seven-function hydraulic arms with force feedback and a science basket between them.\"\n    Arms 2 · Reach 1.9 m · Lift 120 kg.\n  - **Sonar & sensors:** \"Forward multibeam sonar, a pan-tilt 8K camera and an acoustic modem to the surface.\"\n    Sonar 400 kHz · Camera 8K / 60 · Modem 12 kHz.\n\n**05 Pressure — 5,000 m** (pinned).\n- Title **PRESSURE, / MADE VISIBLE.**\n- Body: \"At the bottom of the Challenger Deep every square metre of the hull carries eleven thousand tonnes. The sphere does\n  not survive by being strong. It survives by being perfect.\"\n- Everything except the crew sphere dissolves away. Then:\n  - an FEA stress map;\n  - thousands of GPU streaks converging on the hull, kept out of the copy with screen-space keep-out zones;\n  - contracting isobar shells.\n- **The slider and the scroll are the same control**: dragging scrolls the pinned section.\n  - The slider runs 0–11,000 m, with ticks at their **true positions**: 0, 2k, 4k, 6k, 8k, 11k.\n  - It has `aria-valuetext`.\n  - Hint: \"Drag the depth — or keep scrolling\".\n- Readout panel titled **\"Simulation · Ti-6Al-4V sphere\"**: Pressure at depth · Load on the hull · Hull Ø change ·\n  Margin to proof test (\"to 1,375 bar\"), all from the same rounded simulated depth.\n- Hull creaks in the audio.\n\n**06 Floodlight — 7,000 m** (pinned, the signature moment).\n- Title **NO LIGHT / REACHES HERE.**\n- Body: \"Below a thousand metres the only light is yours, and the faint glow of the animals. Take the floodlight.\"\n- Every light goes out: hemisphere, rim, fill, env and the sub's lights drop to about 0, and bloom drops 62 %.\n- The pointer aims a narrow floodlight (beam angle 0.135 rad), with an x-ray lens (0.088 rad, 1.3× on portrait) at its\n  centre that reveals the cabin, frame and foam as orange fresnel + wireframe.\n- A **resting mouse keeps aiming**. Only touch, or no pointer, falls back to a slow idle sweep around the hull.\n- \"SCAN\" callouts pin to the parts nearest the lens: up to two on desktop, one on narrow screens.\n  - They are portalled above the cursor ring, with a near-opaque backing.\n  - They never overlap: a second one that would touch the first is dropped.\n  - They stay out of the copy column and clear of the bars.\n  - On phones one fades out before the next fades in.\n- Callout texts:\n  - Hull sphere — Ti-6Al-4V · 90 mm\n  - Crew — 3 seats · 96 h life support\n  - Viewport — 140 mm acrylic\n  - Buoyancy — Syntactic foam · 0.69 g/cm³\n  - Thruster — 5.2 kW · magnetic coupling\n  - Ballast — 6 × 90 kg drop weights\n  - Manipulator — 7 functions · 120 kg\n  - Floodlight — 22,000 lm\n  - Sonar — 400 kHz multibeam\n- Hints: \"Move to aim the floodlight\" / \"Touch to aim the floodlight\". Jellyfish flare when lit.\n\n**07 Materials — 8,500 m** (pinned). Three macro specimens built in code. Each has its own headline, lead, note and three\ncounters, switched by **real A / B / C buttons**:\n- **A · Hull wall · Ti-6Al-4V · forged** — **90 MM OF / TITANIUM.**\n  \"Two forged hemispheres, each machined for 1,400 hours and lapped until the joint between them is flatter than a\n  wavelength of light.\" Note: \"A section of the sphere at the equator joint: 90 millimetres of titanium between three\n  people and 1,100 bar.\" Stats: ±12 µm Sphericity · 1,400 h Machining / hemisphere · 0.3 µm Joint flatness.\n  Visual: a curved hull-wall section with a hatched cut face; metallic grey #b9bdc2 with the brushed normal map.\n- **B · Syntactic foam · Glass microspheres in epoxy** — **GLASS THAT / FLOATS.**\n  \"Hollow glass beads locked in epoxy. Foam that cannot be crushed keeps the whole vehicle weightless all the way to the\n  bottom.\" Note: \"Each microsphere is a hollow bead 40 µm across — about eighteen million of them in every cubic\n  centimetre.\" Stats: 0.69 g/cm³ Density · 40 µm Bead diameter · 18 million Beads per cm³.\n  Visual: a rounded block with an **off-white core**, an orange gel coat and a cut face of sliced hollow microspheres.\n- **C · Viewport · Cast PMMA · annealed** — **140 MM OF / CLEAR.**\n  \"Acrylic flexes where glass would shatter. Each viewport is a truncated cone that the ocean presses tighter into its\n  seat.\" Note: \"A 140 mm cone with a 90° included angle. At full depth it creeps 0.6 mm inwards and seals itself harder.\"\n  Stats: 140 mm Thickness · 0.6 mm Creep at 1,100 bar · 92 % Light transmission.\n  Visual: a cut-away acrylic cone in its titanium seat, fresnel glass (no transmission).\n\n**08 The yard — 9,500 m** (pinned).\n- Title **BUILT IN / THE DARK.**\n- Body: \"Every HADAL-1 is assembled in a clean hall on the Norwegian coast and proven in a pressure chamber before it ever\n  touches the sea. We take the hull past the bottom of the ocean. Then we do it again.\"\n- Visual: a holographic line drawing of a test chamber draws itself around the vehicle, with a scanning ring.\n- Stats: 1,375 bar Proof pressure · 312 Pressure cycles · 14,600 h Build hours.\n- Steps:\n  - 01 Forge — \"Two titanium billets, 8.2 t each, forged into hemispheres at 950 °C.\"\n  - 02 Machine — \"1,400 hours per hemisphere on a five-axis mill. Measured every 30 minutes.\"\n  - 03 Assemble — \"14,600 hours by 38 people. Every bolt torqued twice, by two hands.\"\n  - 04 Prove — \"312 cycles to 1,375 bar — a quarter deeper than the deepest point on Earth.\"\n- Keep the wireframe clear of the copy and the step row.\n\n**09 Dive log — 10,000 m+.**\n- Title **PROVEN AT / THE BOTTOM.**\n- Intro: \"Two hundred and twelve crewed dives. Every one of them ended at the surface.\"\n- Rows (year / dive / site / note / depth bar scaled to 11,000 m; full-ocean-depth rows in orange):\n  - 2023 · 001 · Azores Plateau · 1,240 m · \"First crewed descent. Sea trials.\"\n  - 2023 · 017 · Puerto Rico Trench · 8,376 m · \"The deepest point of the Atlantic.\"\n  - 2024 · 058 · South Sandwich Trench · 7,434 m · \"Coldest dive on record: 0.6 °C.\"\n  - 2024 · 093 · Kermadec Trench · 10,047 m · \"First science payload past 10 km.\"\n  - 2025 · 141 · Challenger Deep · East Pool · 10,935 m · \"Full ocean depth. Three crew.\"\n  - 2026 · 212 · Challenger Deep · West Pool · 10,928 m · \"Routine.\"\n- Sonar pings in the audio only; no visible sonar mesh.\n- Use non-breaking spaces so no unit or word is orphaned.\n\n**10 Seabed — 10,935 m: touchdown screen.**\n- The floor rises into the lights (46 m over the end of the log) and the vehicle settles with a sediment puff, a contact\n  shadow and a thud.\n- Eyebrow \"10 —— Seabed · 10,935 m\", headline **BOOK / A DIVE.**\n- Telemetry: Touchdown 3 h 48 min after release · Floor 10,935 m · 1,100 bar · 2.46 °C · Site Challenger Deep · East Pool.\n- Lead: \"Three seats. Six hours on the floor of the Challenger Deep. Tell us why you need to go.\"\n- One CTA: \"Request a briefing →\".\n\n**Briefing screen.**\n- The camera looks down at clean sediment in front of the vehicle.\n- Title **REQUEST A / BRIEFING.**\n- Copy: \"Every request is read by a pilot. Tell us who you are and what you want to see down here.\"\n- Facts: Seats per season 18 · Training 9 days · Support ship MV Hadal Tender.\n- Form panel \"Dive briefing request · Form HDL-27\":\n  - Full name, Email, Organisation (optional), Season (Spring 2027 / Autumn 2027 / Spring 2028 / Flexible);\n  - Purpose chips (Science / Film & media / Exploration / Private);\n  - \"Why do you need to go?\" as a **visible bordered textarea**;\n  - \"Request briefing →\";\n  - \"Concept site — nothing you type here leaves your browser.\"\n- **Nothing is ever sent.** Inline validation (name ≥ 2 chars; valid email; reason ≥ 12 chars) focuses the first error.\n- Success state, compact enough to fit inside the form's height and the page must not jump:\n  - \"● Received\", \"BRIEFING REQUESTED.\", \"A pilot reads every request. Here is what happens next.\";\n  - 72 h — A pilot replies with questions and a call slot · 2 weeks — Pre-dive medical and a video briefing with the\n    crew · 9 days — Training at sea on MV Hadal Tender · Dive day — 3 h 48 min down. Six hours on the floor.;\n  - a local reference number, the season, and \"New request\".\n\n**Footer.**\n- Logo, \"HADAL Deep Systems · Full-ocean-depth submersibles\".\n- Links: Fleet, Anatomy, Pressure, Materials, Dive log, Book a dive.\n- Coordinates and \"10,935 m · 1,100 bar · 2.46 °C\". \"Surface ↑\" scrolls back to the top.\n- A giant HADAL wordmark half-buried in an **SVG sediment drift**, deep on the left and shallow on the right so the \"L\"\n  keeps its foot.\n- \"HADAL is a fictional company. A concept site, 2026.\" and \"Model built in Blender from Python · Rendered live with\n  Three.js\".\n- The vehicle goes back to the dark, leaving only its lamps lit. Stretch the seabed mesh to about 170 m and level off\n  the trench walls, so no mesh edge shows through the fog.\n\n## 9. Responsive, short screens, reduced motion, accessibility\n\n- **Compact layout below 900 px wide:**\n  - the fleet stacks;\n  - per-shot portrait camera framing (separate phone and portrait-tablet offsets/distances);\n  - lighter particle counts;\n  - the floodlight follows the finger.\n- **Short laptop browsers are mandatory test targets.** Toolbars eat 150–250 px, so 1512 × 730 and 1366 × 650 are\n  real viewports.\n  - Every pinned chapter must fit between the nav and the HUD bar.\n  - Cap display type by height as well as width (`min(vw, vh)`). Size the manifesto statement from the space left\n    over: `calc((100svh − 400px) / 9.4)`.\n  - Below ~860 px of height, hide the fleet intro and the anatomy detail panel.\n  - Below ~720 px, tighten lists, spec rows and form fields.\n  - The touchdown screen may grow (`min-height`) instead of clipping.\n- **Reduced motion:** no Lenis (native scroll), no horizontal pin, fades instead of line reveals, instant counters,\n  camera parallax off.\n- **Accessibility:** WCAG 2.1 AA.\n  - axe reports 0 violations.\n  - Headline accessible names read naturally (\"The deep, finally lit.\").\n  - Real buttons for tabs.\n  - Labelled sound toggle.\n  - Focus management after form submit.\n  - Monospace labels mostly 10.5–11 px, with secondary ones (gauge, scan sub-lines) at 10 px.\n- **Adaptive quality:** drei `PerformanceMonitor` (bounds 45–58 fps) lowers DPR and particle counts.\n  Starting DPR is min(devicePixelRatio, 1.75), or 1.5 on compact.\n\n## 10. Quality bar and review (do not skip)\n\n**Health targets:**\n- `npm run build` passes with 0 TypeScript errors.\n- **0 console errors and 0 warnings**.\n- 60 fps while scrolling on a recent laptop GPU.\n- GLB under 3 MB.\n- No horizontal page scroll at any width.\n\n**Review harness** (`scripts/review.mjs`, Playwright):\n- Run headless Chromium with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` on macOS for a real GPU.\n- `?review` exposes `window.__HADAL__` (scrollToT, scrollToY, maxScroll, dive, ui state).\n- Screenshot every chapter at **1440×900, 1512×730, 1366×650, 1280×800, 1024×768, 768×1024 and 390×844 @2x**, plus a\n  reduced-motion pass.\n- Record console output, run a 45 s full-scroll fps measurement, and check the slider, form errors/success and the sound\n  toggle.\n- Click the magnetic submit button with `{ force: true }`. Playwright's \"not stable\" retries otherwise scroll the page natively.\n- Add a `?nandebug` mode that paints NaN pixels magenta. Scan every capture for large pure-black (0,0,0) regions: a\n  black slab means NaN reached the bloom chain.\n\n**Process:**\n- At least three review rounds. Save screenshots, contact sheets and a `REVIEW.md` with honest per-chapter scores in `review/round-N/`.\n- **Self-review overrates.** After your own rounds, get an independent reviewer that has not seen the code to judge only\n  the screenshots, and fix what it finds. Specifically check:\n  - fixed UI vs scrolling content;\n  - every number shown twice agreeing;\n  - copy matching what's on screen;\n  - short laptop heights;\n  - phone widths.\n\n**Deliverables:**\n- `README.md`: how to run, how to rebuild the model, project structure.\n- `REPORT.md`: what was built, key decisions, final scores, honest shortcomings, best screenshots from `review/final/`.\n- `DECISIONS.md`, `PROGRESS.md`, `blender/hadal.blend`, `blender/previews/`, `public/models/hadal.glb`.\n\n## 11. Known pitfalls (each one cost real time in the original build)\n\n**Rendering:**\n- Never add objects to a scene inside `model.traverse()`: collect them first, then add.\n- `isnan()` is unreliable under Metal fast-math. Use exponent-bit tests, and guard **both** the scene buffer and the\n  bloom texture.\n- `@react-three/postprocessing` wrappers rebuild the effect on any prop change. Build heavy effects once.\n- A finish/grain effect must not sample `inputBuffer` with offsets (chromatic aberration) inside a merged EffectPass.\n  It produced all-green frames.\n- Avoid `transmission` with DoubleSide (feedback-loop warnings) and anisotropic materials on boolean-cut meshes (NaN).\n\n**Layout and CSS:**\n- `text-shadow` on SplitText-masked lines is clipped into hard boxes. Put halos on a pseudo-element with `isolation: isolate`.\n- A fixed overlay inside a ScrollTrigger-pinned section can't rise above root-level fixed UI. Portal it to `<body>`.\n- A marquee in a CSS grid needs `minmax(0, 1fr)` and `overflow-x: clip`, or phones get a horizontal scroll.\n\n**Testing:**\n- Hidden or background browser tabs throttle to about 1 fps. Measure fps headless.",

  /* TPL.03 WOBL — verbatim from the author's PROMPT.md. */
  '11': "# WOBL — Build Prompt\n\nThis file has two parts:\n1. **Notes for buyers** (read first).\n2. **The prompt** (copy everything inside the box into your AI coding tool).\n\n---\n\n## Part 1 — Notes for buyers\n\n**What this prompt is.** A detailed technical specification of the WOBL website: a fictional\nfunctional-gummy brand built around one real-time 3D jelly bear. Every number in it (colors, camera,\nshader values, timings, thresholds) is copied from the finished reference build.\n\n**What it is not.** A guarantee of an identical result. AI coding tools are non-deterministic: two\nruns of the same prompt in the same tool produce different code, and results also depend on the\nmodel, the tool, your machine and how long the agent is allowed to work. Treat the output as a strong\nfirst build that you then review and polish.\n\n**Requirements**\n- An *agentic* AI coding tool that can create files, run terminal commands and look at screenshots\n  (for example Claude Code). A plain chat window will not finish a project this size.\n- Node.js 20+ and npm.\n- Blender 4.2 or newer (free) for the 3D bear model. If you don't have Blender, see the fallback note\n  in section 2 of the prompt.\n- A Mac or PC with a GPU made in the last ~5 years. The site targets 60fps on an Apple M1.\n- Expect a long session (hours, not minutes) and several \"continue\" messages.\n\n**Tips for the best result**\n- Paste the prompt as one message at the start of a fresh session.\n- Let the agent finish each phase; then ask it to run the acceptance checklist in section 12.\n- If something looks off, describe what you see (\"the bear looks like opaque plastic\") rather than\n  asking it to \"fix everything\".\n\n---\n\n## Part 2 — The prompt\n\n````text\nYou are building WOBL, a concept website for a fictional functional-gummy brand, from scratch, in a\nnew folder called WOBL. Work autonomously. Follow this specification exactly: every value below is\ntaken from a finished, working build. When this spec gives a number, use that number.\n\nWrite PLAN.md before coding, DECISIONS.md as you go, and keep everything free: open-source npm\npackages, Blender, Poly Haven CC0 assets, Google/OFL fonts. No paid APIs, no AI image/video/3D\nservices, no deployment.\n\n====================================================================================================\n1. STACK (pin these)\n====================================================================================================\n- Vite 8 + React 19 + @react-three/fiber 9 (no drei needed) + three **0.182.0 exactly**\n  (r183+ makes R3F print a THREE.Clock deprecation warning on every load).\n- gsap 3.15 (ScrollTrigger, SplitText — free), lenis 1.3, cannon-es 0.20 (physics).\n- Fonts, self-hosted via @fontsource: @fontsource-variable/bricolage-grotesque (display),\n  @fontsource/instrument-serif (italic accent), @fontsource-variable/jetbrains-mono (UI labels).\n- Dev tools: playwright (screenshots/QA), ffmpeg-static, oxlint.\n- One HDRI: Poly Haven \"studio_small_09\" (CC0) at 1k, then downscaled to 512×256 → public/hdri/studio.hdr.\n- Dev server port 5391, preview port 4391 (avoid 5173/4173 clashes with other projects).\n\n====================================================================================================\n2. THE BEAR MODEL (Blender, headless Python)\n====================================================================================================\nDo NOT use Blender metaballs (their falloff shrinks every element and the parts don't merge).\nBuild a signed distance field in numpy inside Blender, polygonise it with surface nets, then smooth.\n\nCoordinates: Blender Z up, -Y is the bear's front. Use these primitives (iq's ellipsoid SDF,\ncapsule SDF, polynomial smooth-min `smin(a,b,k)`):\n  body   = ellipsoid((0, 0.0, 0.70), radii (0.57, 0.45, 0.62))\n  belly  = ellipsoid((0,-0.07,0.58), (0.50, 0.42, 0.45));  torso = smin(body, belly, 0.10)\n  head   = ellipsoid((0,-0.02,1.44), (0.54, 0.45, 0.45))\n  muzzle = ellipsoid((0,-0.385,1.305), (0.205,0.15,0.14)); head = smin(head, muzzle, 0.055)\n  ears (s = ±1): ellipsoid((s*0.385, 0.01, 1.79), (0.17,0.12,0.165)); head = smin(head, ear, 0.07)\n  d = smin(torso, head, 0.06)   # tight blend = readable neck crease\n  per side: arm = capsule((s*0.36,-0.05,1.02) → (s*0.66,-0.25,0.78), r 0.135)\n            paw = ellipsoid((s*0.67,-0.27,0.76), (0.16,0.15,0.155)); arm = smin(arm, paw, 0.05)\n            d = smin(d, arm, 0.10)\n            leg = ellipsoid((s*0.30,-0.12,0.24), (0.23,0.29,0.23))\n            foot = ellipsoid((s*0.31,-0.36,0.115), (0.18,0.19,0.115)); leg = smin(leg, foot, 0.08)\n            d = smin(d, leg, 0.10)\n  flat soles: d = smax(d, -(Z - 0.015), 0.04)\nGrid spacing 0.0085, bounds x[-0.95,0.95] y[-0.75,0.62] z[-0.08,2.08].\nSurface nets (vectorised numpy) → mesh → remove doubles → recalc normals → Laplacian smooth\n(4 iterations, λ 0.5, preserve volume) → Decimate ratio 0.085 (~25k tris) → Corrective smooth\n(6 iterations, 0.5) → shade smooth. Raycast the head front at x = ±0.19, z = 1.52 to place empties\n\"EyeL\"/\"EyeR\" oriented to the surface normal; add empty \"Neck\" at (0,0,1.1).\nExport public/models/bear.glb (Y up, normals, no UVs) and a decimated copy (ratio 0.12 of the\nresult) as public/models/bear-low.glb. In glTF space: feet at y≈0, ears top y≈1.95, face looks +Z.\nFallback if Blender is unavailable: implement the same SDF + surface nets in a Node script.\n\n====================================================================================================\n3. ARCHITECTURE\n====================================================================================================\nOne fixed full-viewport <Canvas> behind the whole page (position:fixed, z-index 0,\npointer-events none). DOM sections are transparent layout on top. The canvas paints: the color\nflood (backdrop shader), the giant wordmark, the bear, the inner world, the jar.\n- src/config/brand.js — ALL content, colors, formulas, personalities (section 9).\n- src/store/state.js — `world` (mutable per-frame object, never triggers React renders) and a tiny\n  `ui` store via useSyncExternalStore (formula, menuOpen, sound, introDone, product, cart,\n  jarNear, innerNear, tiltAsk).\n- Window-level pointer listeners (the canvas is behind the DOM, so never rely on canvas events).\n  Raycast pokes yourself against bear-low.glb in the bear's undeformed local space.\n- Camera: fov 30, position (0,0,7.5). **Layout must always use these resting constants\n  (CAM_FOV, CAM_Z), never the live camera** — otherwise during the dive the bear shrinks to\n  cancel the camera push-in.\n- R3F useFrame priorities: -2 director, -1 bear/backdrop/wordmark, +1 a RenderLoop component that\n  takes over rendering explicitly (see 4).\n- Lazy chunks: the whole Stage, the inner world (mount when 350% of a viewport away from the dive\n  section), the jar + cannon-es (mount when 300% away from the jar section).\n- Vite manualChunks: ONLY for node_modules (three/@react-three → \"three\", cannon-es → \"physics\").\n  A rule like `id.includes('three')` also catches your own src/three/* files and kills lazy loading.\n\n====================================================================================================\n4. REFRACTION — the signature effect\n====================================================================================================\nShared \"refractors\" registry: { active(), hide(), show(), setBuffer(tex) }. Each frame the\nRenderLoop hides all refractors (bear jelly + jar glass), renders the scene into ONE half-float\nWebGLRenderTarget sized at CSS pixels × tier.fbo (not device pixels), shows them again, hands the\ntexture to them, then renders the main pass.\nThe bear's inner glow core (the same geometry scaled 0.72 about (0,0.85,0), additive, inverse-\nFresnel, strength 0.55 → swells to 1.95 as the camera dives at the belly) and 46 tiny trapped air\nbubbles (instanced spheres inside torso/head, rim + spec shader, radius 0.008–0.043) are visible\nONLY during the buffer pass, so they appear refracted *inside* the jelly. Eyes and mouth must be\nHIDDEN during the buffer pass (otherwise their refracted ghosts show as dark blotches).\n\nJellyMaterial = a custom THREE.ShaderMaterial (NOT MeshPhysicalMaterial, NOT drei's\nMeshTransmissionMaterial). Physical + clearcoat + sheen + several lights + a refraction loop\nexceeded the Apple GPU register budget (~4× slower). Fragment shader does:\n- Refraction loop (SAMPLES = tier.samples): project clip position ONCE (`c0 = vp * worldPos`), per\n  sample add `vp * vec4(ray,0)`; refract red at ior 1.42 and blue at ior·(1+2·aberration·t), green =\n  mix of their UVs (2 projections, 3 texture reads per sample). Jitter with interleaved-gradient\n  noise, not integer hashes.\n- Thickness = uThickness(1.05) × modelScale × (0.35 + 0.65·N·V).\n- Ball-lens cheat: offset UVs by −viewNormal.xy × uLens(0.07) × (1 − 0.5·N·V).\n- Beer–Lambert with uAtten = mix(gummy, white, 0.22), uAttenDist 2.4; multiply by uTint =\n  mix(gummy, white, 0.62); then `trans = max(trans, glow·tint·0.16)` so thick parts never go muddy.\n- Reflection: three's PMREM env via `#include <cube_uv_reflection_fragment>` + `textureCubeUV`\n  (set CUBEUV_TEXEL_WIDTH/HEIGHT/MAX_MIP defines yourself), Fresnel F0 from IOR.\n- One key light (dir (-0.45,0.65,0.6)) Blinn spec pow 180 ×2.4 + pow 24 ×0.18; rim light\n  (dir (0.6,0.35,-0.7)) × (1−N·V)² × 0.9; sheen white × (1−N·V)^3.5 × 0.22;\n  glow × ((1−N·V)^2.4 × 0.45 + (N·V)^4 × 0.08).\n- Sugar: object-space value-noise perturbation of N, amplitude 0.045, frequency 85.\n- ⚠ If you ever extend MeshPhysicalMaterial: never define a property named `_transmission` —\n  three uses that private field, and shadowing it silently switches on three's own extra\n  transmission render pass every frame.\nUniforms: `projectionMatrix` and `modelMatrix` must be declared in the fragment shader of a\nShaderMaterial before use there.\n\nSugar sparkles: 2600 points (tier-scaled) sampled on the surface with MeshSurfaceSampler, using the\nsame deformation in their vertex shader, twinkling glints.\n\n====================================================================================================\n5. SOFT BODY + CHARACTER\n====================================================================================================\nVertex deformation `wobDeform(p0)` shared by jelly, sparkles and core (GLSL) with a JS mirror for\nanchoring eyes/mouth. In order: blob morph to a sphere (preloader, centre (0,0.95,0), radii\n(0.66,0.6,0.6), shifted down 0.32); breathing (belly gaussian at y 0.62, σ 0.34, xz × (1+0.045·b));\nhead rotation matrix around the neck pivot blended by smoothstep(neck±0.16); jelly noise\n(sin waves, amplitude 0.05·wobble along a flattened radial); poke dent (gaussian, σ² 0.045,\ndepth 0.24·dent along the hit normal) + ripple sin(21d − 19t)·e^(−2.4t)·e^(−1.4d)·0.03; inertial\nlean `p += lean · h²` with h = y/1.95; squash about the feet: y·(1−s), xz·(1+0.55s).\nRebuild normals by finite differences (two tangent offsets of 0.012, re-deformed).\n\nSprings everywhere (fixed 1/240 sub-steps). Gaze hierarchy: eyes fast (k 70→320 by personality\nspeed), head medium (k 22→90), body slow (k 7→26) — eyes lead, the body catches up.\nStates (brain.js): awake → drowsy (idle > sleepAfter−2.5s, lids sink) → asleep (idle > sleepAfter,\nlids shut, head down, slow deep breathing, floating \"z\" sprites) → startled on movement (hop,\nwide eyes, 1.0s). Poke → offended (eyes squeezed, 0.45s) → judging (squint, 2.8s). Shake = 6\ndirection flips with |vx| > 1100 px/s within 1.2s → dizzy (spinning spiral eyes, circular lean,\n3.0s) → recovering (1.2s). Five pokes within 5s → sulk: the body turns ~π and refuses to look at\nyou (\"NOT TALKING TO YOU\" for 3.2s, then \"FINE. HI.\" until 4.4s). Suspicious = hovering the bear\n≥0.9s. Blinks every 1.6–5.6s with occasional double blinks; saccades frequency by personality.\nEyes: cream sclera sphere, big glossy black pupil (scale 0.7, z 0.66), two fixed glints, upper/lower\nlid hemisphere shells (upper rotation.x = −0.95 + lid·2.52), a dark lash arc (◡) when lid > 0.86,\nspiral disc when dizzy. Mouth: horizontal capsule bent in its vertex shader with springs for\ncurve/open/width/skew, mood-mapped (smile, frown, \"O\" when startled, chewing loop in the ritual).\nContact shadow: soft radial billboard behind the feet that shrinks/fades while hopping.\nLive mono readout: `MOOD: SUSPICIOUS · GAZE 23° L · WOBBLE 0.41`, DOM updated ~10×/s directly\n(no React renders), aria-hidden.\nSound: Web Audio synthesis only (squish, boing, dizzy, splat, plop, pour, tick, flood), muted by\ndefault, AudioContext created only when the visitor turns sound on.\n\n====================================================================================================\n6. SECTIONS (order: hero, formulas, inside, ritual, jar, shop, footer)\n====================================================================================================\nDirector: for each section, hold its pose while the section covers the viewport, ease (smoothstep)\nto the next pose over the last viewport of scroll. Read scroll from window.scrollY each tick.\nPoses (x,y in half-viewports, s = bear height / viewport height):\n desktop: hero {y−0.08, s0.64, wordX −0.07} · formulas {x0.04, y−0.1, s0.56, wordmark = formula\n name} · inside {y−0.06, s0.5, no wordmark, deep bg} · ritual {x0.5, y−0.12, s0.5, yaw−0.38, paper}\n · jar {x−0.5, y−0.46, s0.34, yaw0.6, eyes watch falling bears} · shop {x0.86, y−1.04, s0.42,\n yaw−0.55, paper — peeking from the corner} · footer {x0.02, s0.24, deep bg, lying on the rule}\n mobile: hero {y0.02,s0.36} · formulas {y0.1,s0.3} · inside {y0.12,s0.34} · ritual: bear steps off\n stage (visible 0) · jar {x−0.62,y−0.74,s0.15} · shop {x0.76,y−1.1,s0.24} · footer {x0.3,s0.15}\n\n0 Preloader: static inline boot screen in index.html (brand flood + \"WOBL\" in a system font,\n  so no layout shift) that fades when the stage is ready. Counter 0→40 tracks real loading, 40→100\n  is synced to the drop: sphere falls stretched (0.62s power2.in), splat squash 0.7 held 160ms,\n  14 jelly droplets fly out, elastic.out(1,0.28) reform, blob→bear 1.05s, eyes pop (back.out).\n1 Hero: giant wordmark plane behind the bear (canvas texture, Bricolage 800 condensed) that slides\n  ±3.5% with the cursor and drifts on its own; headline split around the bear: \"Soft on / the\n  outside.\" top-left, \"Serious / about *sleep.*\" bottom-right (italic word = current formula);\n  glass \"Live subject\" telemetry card; CTA.\n2 Formulas: CSS position:sticky (not ScrollTrigger pin) inside a 420vh section; progress picks the\n  formula. Each switch: backdrop shader pours the new color radially from the bear's screen\n  position with a wobbly lit meniscus (1.15s ease-in-out), CSS ink tweens after a 0.32s delay\n  (0.55s), jelly colors and personality blend, glass stat cards count up (power2.out).\n3 Inside the chew (440vh): camera pushes onto the belly (ease-in-cubic, fov 30→38) until the jelly\n  fills the frame; a membrane shader (drawn only while visible) covers the jump to an inner world\n  parked at z = −100 (length 38): gel tunnel sphere with caustic texture, rising bubbles, one\n  orbiting instanced cluster per ingredient (crystal = faceted metallic gems, leaf, berry, flower,\n  bubble shader), glow sprites, fog. DOM labels pinned to 3D anchors, one at a time, faded by the\n  membrane; anything near the lens shrinks away. Intro/outro copy uses clamped section progress.\n4 Ritual (paper tone): 3 editorial steps with masked SplitText line reveals; exactly one step lit\n  (ScrollTrigger ranges 'top 55%' → 'bottom 55%'); the bear acts out the step (chewing / doing\n  nothing / smug).\n5 Jar: lathe glass with thick walls (closed profile) using the same refraction buffer, canvas\n  label, lid lying beside it, contact shadow. cannon-es: floor = Plane; the glass wall is an\n  ANALYTIC cylinder applied in a postStep listener (22 box colliders made sphere-box the most\n  expensive thing on the page). Bears = 2-sphere compound bodies, scale 0.25, auto-pour 64,\n  click to pour 8 more, capped per tier, squash on hard landings, counter \"BEARS IN JAR 064\".\n6 Shop (paper): 4 product cards with Blender Cycles renders of the same bear (Standard view\n  transform, sweep backdrop lightened from the formula bg) → WebP; NAÏADE-style product panel\n  sliding from the right (size selector, add to bag = counter only, ingredients, disclaimer),\n  Esc closes, focus trapped and restored. Placeholder content only, no reviews/testimonials.\n7 Footer: tagline, links, the rule (#footer-rule) the bear lies on (roll π/2 when asleep; sits up\n  startled when the cursor comes within range), a giant SVG `<text textLength>` wordmark that fits\n  the width exactly, and \"Concept brand. Not a real product.\"\nPlus: full-screen menu with a giant blurred wordmark; custom cursor (dot + lagging jelly ring that\nmorphs into labelled pills: POKE over the bear, VIEW, POUR, OPEN/CLOSE); nav that tucks away on\nscroll-down, returns on scroll-up AND whenever a nav control has keyboard focus (:focus-within);\nnav ink flips to the paper ink over paper sections; Lenis smooth scroll (lerp 0.085) driven by the\nGSAP ticker.\n\n====================================================================================================\n7. VISUAL SYSTEM\n====================================================================================================\nDisplay: Bricolage Grotesque Variable, weight 800, font-stretch 75%, letter-spacing −0.035em,\nline-height 0.84. Accent: Instrument Serif italic. UI: JetBrains Mono uppercase, letter-spacing\n0.08em (12px minimum on phones). Glass cards: gradient white 22%→6%, 1px white 32% border,\nbackdrop blur 18px. Film grain lives IN the backdrop shader (integer hash per pixel, amplitude\n0.032) — not a CSS overlay (a full-screen mix-blend layer cost ~13fps at DPR 2; sin-based hashes\nband into scanlines). Animation conventions: power4.out reveals, expo.out staggers, power2.out\ncounters; DOM animation uses transform/opacity only.\n\n====================================================================================================\n8. PERFORMANCE RULES (learned the hard way — follow them)\n====================================================================================================\n- Tiers: high {dpr [1,1.5], fbo 0.75, samples 4, aberration 0.07, sparkles 2600, jarMax 110},\n  medium {dpr [1,1.25], fbo 0.6, samples 3, 0.05, 1600, 80}, low {dpr [1,1.25], fbo 0.5,\n  samples 2, 0, 900, 55}. Start low on coarse pointers / width < 820.\n- MSAA only when devicePixelRatio < 1.25 (it was the single biggest cost on Retina).\n- Your own perf monitor: 2s windows, step down after two windows below 47fps, and ONLY after the\n  intro has finished + 3s (loading and shader warm-up always dip).\n- Shader warm-up without blocking: force everything visible, gl.compile(scene, camera), restore,\n  then poll program.isReady() (guard with gl.isProgram) up to 2.5s before showing the bear.\n  Don't use renderer.compileAsync (it can hang if a material is replaced mid-compile).\n- Hide full-screen effect quads when their amount is 0 (they cost GPU even when invisible).\n- Don't dispose materials in effect cleanups (React StrictMode double-mount); dispose replaced ones.\nTargets: 60fps on an M1 MacBook, zero console errors/warnings in dev and prod, Lighthouse desktop\n≥ 90 performance and 100 accessibility / best practices / SEO.\n\n====================================================================================================\n9. CONTENT (src/config/brand.js)\n====================================================================================================\nbrand: name/wordmark \"WOBL\", descriptor \"Functional gummies\", legal \"Concept brand. Not a real\nproduct.\", paper #F6F0E6, paperInk #1B1530.\nFormulas (bg / bgDeep / ink / wordmark / gummy / gummyDeep / glow / base mood):\n Sleep  #2A1D7C / #160E4D / #F4EEFF / #5A3FD9 / #B05CEB / #4A0F7E / #F0B8FF / DREAMY\n Focus  #E8F53A / #B9C70E / #141A05 / #C9D60B / #7EE81F / #2E7A05 / #F4FF9A / LOCKED IN\n Calm   #FF8A65 / #E2593A / #2B0D05 / #FFB08E / #FFB23E / #C45A00 / #FFE7A8 / SERENE\n Glow   #E8174F / #A80A35 / #FFF0F4 / #FF4F7E / #FF5FB8 / #B0006A / #FFD3EC / SMUG\nPersonalities {speed, droop, saccade, breath, breathRate, bounce, jelly, sleepAfter}:\n Sleep {0.45,0.12,0.15,1.0,0.18,0,1.0,6} · Focus {1.0,0,0.9,0.35,0.32,0,0.55,8}\n Calm {0.55,0.1,0.25,1.4,0.14,0,0.85,8} · Glow {0.8,0.08,0.5,0.6,0.28,1.0,0.9,8}\nEach formula has 3 stats, 4 ingredients (name, dose, one-line note, shape, color) and a price.\nWrite sharp, funny copy with attitude; mark doses/prices as fictional placeholders.\n\n====================================================================================================\n10. ACCESSIBILITY\n====================================================================================================\nSemantic landmarks, skip link, real buttons/links, visible focus. SplitText with `aria: 'none'`\n(its default aria-label on spans is a prohibited attribute). Paper sections get a transparent\n`background-image` so contrast checkers don't measure dark ink against the body's flood color.\nprefers-reduced-motion: no smooth scroll, instant intro, no wobble/hops, quick crossfade instead\nof pours, dive shown statically with labels as a grid. Mobile: gyroscope tilt behind an explicit\npermission button (iOS requires a user gesture), tap = poke.\n\n====================================================================================================\n11. QUALITY LOOP\n====================================================================================================\nAfter each section: Playwright screenshots at 390, 1440 and 1920 at several scroll positions and\nmid-animation, look at every screenshot, sample rAF frame times, read console errors, write a\nbrutal critique (10+ flaws) in CRITIQUE.md, fix everything, repeat. When all sections exist, do at\nleast three full-site rounds.\n\n====================================================================================================\n12. ACCEPTANCE CHECKLIST (verify each before declaring done)\n====================================================================================================\n[ ] `npm run build` succeeds; `npm run preview` loads with zero console errors or warnings.\n[ ] Preloader: drop → splat with droplets → reform → eyes pop, counter reaches 100.\n[ ] Hero: bear tracks the cursor eyes-first; letters of the wordmark visibly bend through the jelly.\n[ ] Poke = dent + squish + judging squint; shake = spiral eyes; 5 pokes = turns its back;\n    8s idle = asleep with z's; moving the mouse wakes it with a hop.\n[ ] Formulas: four color pours, wordmark becomes the formula name, stat counters, personality changes.\n[ ] Dive: camera pushes onto the belly until it fills the frame, membrane, inner world, one label\n    at a time, clean exit with no leftover intro text.\n[ ] Ritual: exactly one step lit. Jar: bears pour, pile up, click adds more, bear watches them.\n[ ] Shop: product panel opens/closes (also with Esc), add to bag increments the counter.\n[ ] Footer: bear lies down on the rule asleep, sits up when the cursor approaches.\n[ ] 390px mobile layouts are designed (no overlapping text), reduced motion works, keyboard Tab\n    order reaches every control and the nav reappears when focused.\n[ ] ~60fps on an M1 at DPR 2 in the hero; Lighthouse desktop ≥ 90 / 100 / 100 / 100.\n````\n\n---\n\n*Reference build: WOBL concept site. Concept brand — not a real product.*",

  /* TPL.04 AUTOCARS (Bodyline Coachworks) — verbatim from the author's PROMPT.md. */
  '12': "# Build prompt — a one-off vehicle coachbuilding studio\n\nYou are building a complete production website for a coachbuilder that takes\nnine cars a year and rebuilds them one at a time. The audience is two groups at\nonce: people who own six-figure cars, and people who judge web design for a\nliving. It has to survive both.\n\nWork through the phases in §20 in order. Do not skip the gates.\n\n---\n\n## 1. The one rule\n\n**The whole site is a dark photo studio. Cars, materials and words are revealed\nby a horizontal strip light that crosses surfaces.**\n\nIf an animation or an element has nothing to do with light, darkness, or the\nphysical act of building a car, cut it. That rule decides every argument. A\nfade-up is not light. A scale-on-hover is not light. A band of light crossing a\nflank is.\n\nThe line that organises everything: **\"Built in the dark. Judged in the\nlight.\"**\n\n---\n\n## 2. Stack\n\nThese exact versions are verified to work together. Pin them.\n\n| Package | Version |\n| --- | --- |\n| `next` | 16.3.8 (App Router, Turbopack, TypeScript strict) |\n| `react` / `react-dom` | 19.2.8 |\n| `gsap` | ^3.15.0 — ScrollTrigger and SplitText both imported from the public `gsap` package |\n| `lenis` | ^1.3.26 |\n| `three` | ^0.186.1 |\n| `zod` | ^4.6.5 |\n| dev | `sharp` ^0.35.5, `subset-font` ^2.9.0, `puppeteer-core` ^25.12.0, `axe-core` ^4.14.0, `lighthouse` ^12.8.2 |\n\nRules:\n\n- **CSS Modules only.** No Tailwind, no CSS-in-JS, no component library.\n- **No Framer Motion.** GSAP is the only animation library.\n- **One `next/font` setup**, two local Archivo faces plus IBM Plex Mono. Details in §4.\n- Next 16 differs from older releases in ways that matter here (`images.qualities`\n  is now an allowlist, not a number). Read `node_modules/next/dist/docs/` before\n  writing config, rather than trusting recall.\n- No state manager, no data library, no SDKs. The brief route handler talks to\n  Supabase and Resend over plain `fetch`.\n\n---\n\n## 3. Design tokens\n\nCreate `styles/tokens.css` with exactly this. **These are the only colours\nallowed on the site.** Every other value in any CSS file must reference a token.\n\n```css\n/* ──────────────────────────────────────────────────────────────\n   BODYLINE COACHWORKS — design tokens.\n   The only colours allowed on this site live in this file.\n   ────────────────────────────────────────────────────────────── */\n\n:root {\n  /* Colour */\n  --ink-0: #0a0a09;   /* studio black, page background. never pure #000 */\n  --ink-1: #121211;   /* raised surfaces */\n  --ink-2: #1c1c1a;   /* image placeholders, hover fills */\n  --line: rgba(232, 228, 220, 0.12);\n  --bone: #e8e4dc;\n  --bone-dim: #8c8982;\n  --light: #fbfaf6;   /* core of the light band only */\n  --sodium: #ff8a1f;  /* workshop sodium lamp. max ~3% of any screen */\n\n  /* Dim copy of the display type, sat under the lit copy in the hero */\n  --ink-type: #2a2927;\n\n  /* Grid */\n  --cols: 12;\n  --gutter: 24px;\n  --margin: 40px;\n\n  /* Type scale */\n  --display: clamp(3.25rem, 11vw, 12rem);\n  /* Ceiling for measure-filling display lines. A two-word headline must not\n     run to 500px just because it is short. */\n  --display-max: 12rem;\n  --display-sm: clamp(2.25rem, 6vw, 5rem);\n  --measure: 62ch;\n\n  /* Motion tokens — mirrored in lib/motion.ts for GSAP */\n  --e-reveal: cubic-bezier(0.165, 0.84, 0.44, 1); /* ~power4.out */\n  --e-hover: cubic-bezier(0.215, 0.61, 0.355, 1); /* ~power3.out */\n  --t-hover: 0.45s;\n  --t-band: 0.9s;\n\n  /* Chrome */\n  --nav-h: 64px;\n}\n\n@media (max-width: 768px) {\n  :root {\n    --margin: 16px;\n    --gutter: 16px;\n    --nav-h: 56px;\n  }\n}\n```\n\nNotes that are not optional:\n\n- `--ink-0` is never `#000`. Pure black kills the grain and flattens the photography.\n- `--sodium` is the workshop lamp. It is an accent for one dot, one rule, one\n  hover state. If it covers more than about 3% of a screen, you have overused it.\n- `--ink-type` is the dim copy of the hero headline that sits *under* the light.\n- **Zero border radius, everywhere.** Put `* { border-radius: 0 }` in the reset\n  and mean it.\n- Dividers are 1px `--line` hairlines, never a thicker rule, never a shadow.\n\n### Surfaces\n\nThe page runs on three grounds and nothing else:\n\n- `--ink-0` is the bay. Most of the site sits on it, and the page closes back onto it.\n- `--ink-1` is a surface pulled into the light: the material library, the spec\n  sheet, the light wall. **One lift per page**, hairlined top and bottom.\n- `--ink-2` is what an image sits in.\n\nNo gradients anywhere outside an image well and the light band itself. A dark\npage reads flat when everything sits on the same ground — not because it is dark.\n\n---\n\n## 4. Type\n\nTwo faces. Contrast comes from **width and weight, never from a second\ntypeface.**\n\n- **Archivo** — display at `wdth 125`, text at `wdth 100`. Both are the same\n  face at two widths.\n- **IBM Plex Mono 400** — captions, labels, metadata, spec values. Every mono\n  line is uppercase, `letter-spacing: 0.08em`, 11px on desktop and **12px below\n  768px** (11px fails Lighthouse's legibility audit on a phone).\n\nDo not fetch Archivo from Google at build time. The full face is ~90KB with both\naxes live and it gates the hero headline's LCP. Instead:\n\n1. Write `scripts/build-fonts.mjs` that fetches the upstream variable TTF once\n   and cuts two axis-pinned subsets with `subset-font`:\n   - `archivo-display.woff2` — uppercase, digits, punctuation. `wdth` 125, `wght` 700–800. **~12KB**\n   - `archivo-text.woff2` — ASCII + Latin-1, so an accented name in the brief\n     still sets in Archivo. `wdth` 100, `wght` 400–500. **~21KB**\n   - two pinned `.ttf` instances for share cards — Satori cannot read woff2 and\n     cannot interpolate an axis. Build-time only, never served.\n2. Commit the output, so a normal build never touches the network.\n3. Because the width is baked into each file, **CSS carries weight only.** There\n   is no `font-variation-settings: \"wdth\" …` anywhere, and adding one does nothing.\n\nTotal font payload: **44KB across three served files; the headline waits on 12KB\nof it.**\n\n### Display lines fill their measure\n\nHeadlines are set the way a coachbuilder sets a nameplate: each line's font size\nis the container width divided by that line's own advance width. No wrapping,\nno orphans, no guessing at a `vw`.\n\n- A `Justified` component renders each line as a block span with\n  `font-size: min(calc(100cqw / var(--ratio)), var(--display-max))`, inside a\n  `container-type: inline-size` parent.\n- The ratios are **measured, not guessed**: a `scripts/measure-display.mjs`\n  loads the running site, measures each line in the real shipped face and writes\n  `lib/display-metrics.ts`.\n- That script **must refuse to write** if the page has crashed and it is\n  measuring the metric-matched fallback instead of the real face. Without this\n  guard it silently writes ratios ~25% wrong and every headline on the site\n  comes out small.\n- `--display-max: 12rem` is a hard ceiling. A two-word headline like \"G63\"\n  measures a ratio near 2.5 and would otherwise render at 500px.\n- Below 768px, lines fall back to the normal clamp and wrap. Twenty characters\n  across 343px is unreadable.\n\n---\n\n## 5. Grid\n\n12 columns, 24px gutter, 40px page margin. Below 768px: 6 columns, 16px gutter,\n16px margin. A `.wrap` sets the margin, a `.grid12` sets the columns, and layout\nis done by column spans — not by max-widths and auto margins.\n\nBuild a dev-only grid overlay toggled by pressing **G**. You will need it.\n\n---\n\n## 6. Motion\n\nCreate `lib/motion.ts` with exactly this, and mirror the easings as CSS custom\nproperties in the tokens file. **Anything not in here is a mistake.**\n\n```ts\n/**\n * The only easings and durations on this site. Anything not in here is\n * a mistake. Mirrored as CSS custom properties in styles/tokens.css.\n */\nexport const EASE = {\n  reveal: \"power4.out\",\n  stagger: \"expo.out\",\n  counter: \"power2.out\",\n  hover: \"power3.out\",\n  band: \"power3.inOut\",\n} as const;\n\nexport const DUR = {\n  reveal: 1.1,\n  counter: 1.4,\n  hover: 0.45,\n  band: 0.9,\n} as const;\n\nexport const STAGGER = 0.06;\n\n/** ScrollTrigger defaults. Reveals fire once, late. */\nexport const START = \"top 82%\";\nexport const SCRUB = 0.8;\n\nexport const prefersReducedMotion = () =>\n  typeof window !== \"undefined\" &&\n  window.matchMedia(\"(prefers-reduced-motion: reduce)\").matches;\n```\n\n- Lenis drives the page scroll at `lerp: 0.09`, and **GSAP's ticker drives\n  Lenis** (`gsap.ticker.add(t => lenis.raf(t * 1000))`, `lagSmoothing(0)`), so\n  ScrollTrigger and the WebGL sweep read the same frame. Any other wiring\n  produces a visible lag between the band and the scroll.\n- Lenis is dynamically imported and **never downloaded at all** under reduced\n  motion.\n- Reduced motion: no pins, no scrub, no sweep, no grain animation. Everything is\n  simply lit. This is a different composition, not a disabled one.\n\n---\n\n## 7. Site map and section inventory\n\nFour routes and a 404. No about page, no services page, no blog.\n\n```\n/                     home\n/builds               the archive index — delivered builds and available stock in one list\n/builds/[slug]        one build\n/brief                the four-question build brief\n404                   torch cursor\n```\n\n### `/` — in this order\n\n1. **Hero** — full-bleed photograph, pinned, scroll-scrubbed. The headline is\n   two copies of the same words: a dim one in `--ink-type` under the light, and\n   a lit one clipped to the band's progress. Mono caption bottom-right, a scroll\n   marker bottom-left.\n2. **Manifesto** — one lead paragraph at `max-width: 24ch`, revealed line by\n   line by a left-to-right wipe. Numbers inside the sentence count up.\n3. **Featured builds** — three builds, placed `left`, `right` and `centre` on the\n   grid so the rhythm is asymmetric. Each is a photograph plus a mono meta block.\n   **Scrolling onto one turns its headlights on** (§10).\n4. **Material library** — the services, named as materials (carbon, hide,\n   forged, lumen, tone, film) with the actual service in mono underneath. Each\n   sample sits under a raking light that moves with the cursor. This section is\n   the page's one `--ink-1` lift.\n5. **Build log** — the last few weeks of the workshop, dated by week number.\n6. **Ledger** — delivered counts by marque, as a table of hairlines. The counts\n   must sum to the delivered total, and the content file should **throw at build\n   time if they stop summing.** The arithmetic on this site is meant to be checkable.\n7. **Voice** — one client quote, attributed to a build number rather than a name\n   and an avatar. **Typed as nullable, and the section does not render while it\n   is null. Never invent one.**\n8. **Close** — the call to action, back on `--ink-0`.\n\n### `/builds`\n\nOne list, both delivered builds and available stock, each row carrying code,\nmodel, status dot, hours, and finish swatches at their real measured hex.\nHovering or focusing a row lifts a frame of that car beside the list. **Nothing\nis hover-only** — below the breakpoint the image sits in the row itself. No\nfilters, no cards, no grid of tiles.\n\n### `/builds/[slug]`\n\nHero (same component, this car's name, build code as the eyebrow), then numbered\nsections: `01 Specification` (a spec sheet, two columns of hairline rows),\n`02 Before and after` (a slider whose **divider is the light band itself**),\n`03 The build` (the story frames, each revealed by a band), `04 The detail we are\nproudest of` (one macro frame and one paragraph of specific prose), then the\n**light wall** (§10), then a link to the next build.\n\n### `/brief`\n\nFour steps, one question per screen: the car, what to change, timeline and\nbudget, how to reach you. Progress shown as a strip light filling. Not a generic\ncontact form — §15.\n\n### 404\n\nA torch. The page is black and the cursor carries a soft pool of light that\nreveals the headline and one photograph as it passes. Keyboard users get the\npage simply lit.\n\n---\n\n## 8. Architecture: one WebGL canvas\n\n**There is exactly one `WebGLRenderer` on the whole site.** Not one per section.\nNot one per route. One.\n\nA second context is the single most common way this design gets built badly: it\ncosts a second compile, a second RAF loop, and on Safari it will drop a context\nunder memory pressure and leave a hole in the page.\n\nHow it works:\n\n- `components/gl/Stage.tsx` renders **one fixed, full-screen, `aria-hidden`\n  canvas** in the root layout, at `z-index: 1`, `pointer-events: none`.\n- Every effect is a quad in a **screen-space orthographic scene**:\n  `new OrthographicCamera(0, width, 0, -height, -100, 100)`.\n- Each quad is positioned every frame from its DOM anchor's\n  `getBoundingClientRect()` — `scale.set(rect.width, rect.height, 1)` and\n  `position.set(rect.left + rect.width/2, -(rect.top + rect.height/2), 0)`. So a\n  single draw pass covers the hero and every material sample at once, and the\n  effects sit exactly where the layout put them.\n- **Read every rect first, then write.** One layout pass per frame.\n- `object-fit: cover` is done in UV space with a `uCover` uniform, from the\n  texture's intrinsic size against the plane's aspect.\n- Components register and unregister planes through a module-level registry.\n  They never touch three.js themselves.\n- The render loop runs on **`gsap.ticker`**, not its own `requestAnimationFrame`.\n- Each plane has an `IntersectionObserver` with `rootMargin: \"10% 0px\"` and is\n  skipped when off screen.\n- **When nothing is visible, clear the canvas once and then stop drawing** until\n  something is. Without the latch you either burn a draw call per frame forever,\n  or leave stale pixels painted over the rest of the page.\n- three.js, the shaders and the placeholder-plate helper are **imported together,\n  after first paint, on an idle callback, and only on a route that has\n  registered at least one plane.** The index, the brief and the 404 never fetch it.\n- A `lib/capability.ts` decides once whether GL runs at all: not under reduced\n  motion, not on ≤2 cores or ≤2GB device memory, and not without a `webgl2` or\n  `webgl` context. Everything else gets a CSS fallback that is composed, not broken.\n\nThis is the registry contract. Use it as written:\n\n```ts\nexport type PlaneKind = \"unveil\" | \"rake\" | \"headlight\";\n\nexport interface GLPlane {\n  el: HTMLElement;\n  kind: PlaneKind;\n  /** Colour file. Empty string means the placeholder plate is drawn instead. */\n  src: string;\n  /** Normal map, raking light only. */\n  normal?: string;\n  /** Caption, drawn into the placeholder plate so it still reads as a slug. */\n  caption: string;\n  /** 0–1, written by whatever drives this plane (ScrollTrigger, cursor). */\n  progress: number;\n  /** Lamp position: x and y in UV space, z is height above the surface. */\n  light: [number, number, number];\n  /** Fill in the room, 0–1. */\n  ambient: number;\n  /** How far the lamp carries. */\n  throw: number;\n  /** Headlight positions, UV from the bottom left. One or two. */\n  lamps: [number, number][];\n  /** 0 off, 1 full. Driven by scroll. */\n  ignition: number;\n  opacity: number;\n  visible: boolean;\n}\n\nconst planes = new Set<GLPlane>();\nconst listeners = new Set<() => void>();\n\nexport function registerPlane(plane: GLPlane) {\n  planes.add(plane);\n  listeners.forEach((fn) => fn());\n  return () => {\n    planes.delete(plane);\n    listeners.forEach((fn) => fn());\n  };\n}\n```\n\n### Every image must survive a missing file\n\nNothing in `/content` names a filename. Photography is attached **by convention**\nfrom the build code and the role (`/shots/<code>/<role>.webp`). When a file is\nabsent, the frame falls back on its own to an `--ink-2` block carrying the mono\ncaption and the target aspect ratio — and the GL plane draws that same plate as\na canvas texture. The site is never broken by a missing photograph, and the\nlayout can be judged before the shoot happens.\n\n---\n\n## 9. The shaders\n\nThree fragment shaders, one vertex shader. Use these verbatim — each line of\nthem is the result of something that looked wrong first.\n\n```ts\nexport const VERT = /* glsl */ `\nvarying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}\n`;\n\n/**\n * The Unveil. A soft, slightly bowed band of light travels down the frame and\n * leaves the surface dimly lit behind it. The highlight is luminance-weighted,\n * so paint and carbon catch the light and tyres stay black — which is what\n * separates this from a CSS gradient.\n */\nexport const UNVEIL_FRAG = /* glsl */ `\nuniform sampler2D uTex;\nuniform float uProgress;\nuniform float uBand;\nuniform float uOpacity;\nuniform vec2 uCover;\nvarying vec2 vUv;\n\nvoid main() {\n  vec2 uv = (vUv - 0.5) * uCover + 0.5;\n  vec3 c = texture2D(uTex, uv).rgb;\n\n  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));\n\n  float bandY = mix(1.15, -0.15, uProgress);\n  float y = vUv.y + sin(vUv.x * 3.14159) * 0.04;  // bowed, like a reflection on a curved panel\n  float d = abs(y - bandY);\n  float band = smoothstep(uBand, 0.0, d);\n\n  float passed = smoothstep(bandY - 0.02, bandY + 0.02, y);\n  float residual = mix(0.04, 0.35, passed);\n  float full = smoothstep(0.85, 1.0, uProgress);\n  float exposure = mix(residual, 1.0, full);\n\n  vec3 col = c * exposure + c * band * (0.6 + pow(luma, 1.6) * 2.2);\n  gl_FragColor = vec4(col, uOpacity);\n}\n`;\n\n/**\n * A lamp over a surface. One light, placed in UV space with a height above the\n * plane, which is all four of the studio's inspection angles and the raking\n * light on the material samples — the only difference between them is where\n * the lamp is and how much fill is in the room.\n *\n * The lower the lamp, the more it grazes, and the harder it picks out weave,\n * grain and anything the finisher left behind. That is the whole point of a\n * quality pass.\n */\nexport const RAKE_FRAG = /* glsl */ `\nuniform sampler2D uTex;\nuniform sampler2D uNrm;\nuniform float uHasNormal;\nuniform vec3 uLight;     // xy in uv space, z is height above the surface\nuniform float uAmbient;  // how much fill is in the room\nuniform float uThrow;    // how far the lamp carries\nuniform float uOpacity;\nuniform vec2 uCover;\nvarying vec2 vUv;\n\nvoid main() {\n  vec2 uv = (vUv - 0.5) * uCover + 0.5;\n  vec3 c = texture2D(uTex, uv).rgb;\n\n  vec3 n = uHasNormal > 0.5\n    ? normalize(texture2D(uNrm, uv).rgb * 2.0 - 1.0)\n    : vec3(0.0, 0.0, 1.0);\n\n  vec3 toLight = vec3(uLight.xy - vUv, max(uLight.z, 0.02));\n  float dist = length(toLight);\n  vec3 L = toLight / max(dist, 0.0001);\n\n  float diff = max(dot(n, L), 0.0);\n  float falloff = 1.0 - smoothstep(0.0, uThrow, dist);\n  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));\n\n  // A low lamp throws a tight, hard pool; a high one washes the whole panel.\n  float graze = 1.0 - clamp(uLight.z, 0.0, 1.0);\n  float edge = pow(falloff, mix(1.0, 2.4, graze));\n\n  // At grazing incidence a flat surface still catches light as a sheen, and\n  // it catches it in proportion to how bright it already is. That is why the\n  // raking pass finds a ripple in paint that the flood misses entirely.\n  float sheen = pow(edge, 1.0 + graze * 1.6) * graze * 2.1;\n\n  float lit = uAmbient\n    + diff * edge * (1.0 + pow(luma, 1.4) * 1.6)\n    + sheen * (0.18 + pow(luma, 1.2) * 1.5);\n\n  gl_FragColor = vec4(c * lit, uOpacity);\n}\n`;\n\n/**\n * Headlights coming on.\n *\n * Two lamps, because that is how many a car has, and the first version lit the\n * midpoint between them — which on a car is the badge. The filament strikes\n * first and the throw builds behind it, because that is the order it happens\n * in. What the light lands on is luminance-weighted the way the sweep is, so\n * bright paint picks it up and the tyre does not.\n *\n * The highlight rolloff at the end is the difference between a lamp and a\n * flashbulb: without it the bloom lands on paint that is already bright and\n * flattens it to paper white.\n */\nexport const HEADLIGHT_FRAG = /* glsl */ `\nuniform sampler2D uTex;\nuniform vec2 uCover;\nuniform vec2 uLampA;\nuniform vec2 uLampB;\nuniform float uLampCount;\nuniform float uIgnition;\nuniform float uAspect;\nuniform float uOpacity;\nvarying vec2 vUv;\n\nconst vec3 LIGHT = vec3(0.984, 0.980, 0.965);\n\nvoid lamp(vec2 at, float aspect, out float core, out float bloom, out float beam) {\n  vec2 d = (vUv - at) * vec2(aspect, 1.0);\n  float r = length(d);\n  core  = smoothstep(0.026, 0.0, r);\n  bloom = smoothstep(0.26, 0.0, r);\n  beam  = smoothstep(0.72, 0.0, length(d * vec2(0.38, 2.6)));\n}\n\nvoid main() {\n  vec2 uv = (vUv - 0.5) * uCover + 0.5;\n  vec3 c = texture2D(uTex, uv).rgb;\n  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));\n\n  float core, bloom, beam;\n  lamp(uLampA, uAspect, core, bloom, beam);\n\n  if (uLampCount > 1.5) {\n    float c2, b2, m2;\n    lamp(uLampB, uAspect, c2, b2, m2);\n    core += c2;\n    bloom = max(bloom, b2);\n    beam = max(beam, m2);\n  }\n\n  float strike = smoothstep(0.0, 0.28, uIgnition);\n  float spread = smoothstep(0.10, 1.0, uIgnition);\n\n  // The filament only fills in a lamp that is dark. Where the photograph\n  // already has a lit lamp, adding a white core just erases its shape, so the\n  // light goes into the bloom around it instead.\n  float unlit = 1.0 - smoothstep(0.30, 0.78, luma);\n\n  vec3 add = vec3(0.0);\n  add += c * bloom * spread * (0.5 + pow(luma, 1.6) * 1.5);\n  add += c * beam * spread * 0.34;\n  add += LIGHT * core * strike * unlit * 1.1;\n  add += LIGHT * bloom * bloom * strike * 0.1;\n\n  vec3 col = c + add;\n\n  // Soft knee. Anything under it is untouched; above it rolls off instead of\n  // clipping, so the lamp keeps its shape rather than becoming a white patch.\n  float m = max(col.r, max(col.g, col.b));\n  float knee = 0.82;\n  float rolled = knee + (1.0 - exp(-max(m - knee, 0.0) * 2.4)) * 0.18;\n  col *= mix(1.0, rolled / max(m, 1e-4), step(knee, m));\n\n  gl_FragColor = vec4(col, uOpacity);\n}\n`;\n```\n\nWhy the three exist, in one line each:\n\n- **Unveil** — a bowed band travels down the frame and leaves the surface dimly\n  lit behind it. The highlight is **luminance-weighted**, so paint and carbon\n  catch the light and tyres stay black. That weighting is the entire difference\n  between this and a CSS gradient, and it is the reason the effect is worth a\n  WebGL context at all.\n- **Rake** — one lamp placed in UV space with a height above the plane. The\n  lower the lamp, the harder it grazes. It has a **grazing sheen term rather\n  than plain diffuse**, because a flat panel under a low lamp still catches\n  light in proportion to how bright it already is — which is exactly how a\n  ripple in paint shows up at 10° and vanishes under a flood.\n- **Headlight** — two lamps, a filament that strikes first and a throw that\n  builds behind it, with a soft-knee rolloff at the end. §10.\n\n---\n\n## 10. The signature moments\n\n### Preloader into hero — one continuous shot\n\nBlack screen, one line of light drawn from the centre outwards, the studio name\nin mono, then **the line travels up and off the top edge — it does not fade.**\nOff the top edge is exactly where the hero's band begins. The two moments are one\ncamera move.\n\n- First visit per session only. An inline script in the layout reads\n  `sessionStorage` and sets a `data-seen` attribute on `<html>` **before anything\n  paints**, so a returning visitor never gets a flash of black. Put\n  `suppressHydrationWarning` on `<html>` or React will complain about it.\n- A `<noscript>` block must light the hero, or the site is a black rectangle\n  without JS.\n\n### The hero unveil\n\nPin the hero and scrub the band with scroll. **One progress value feeds three\nthings at once:**\n\n1. the band position in the shader,\n2. the CSS mask fallback variables (`--band`, `--passed`, `--unlit`),\n3. the `clip-path` on the lit copy of the headline — computed from the band's\n   **actual screen Y**, not a guessed delay.\n\nSo the words light up at the moment the light reaches them. That is the whole\ntrick, and a timed approximation of it reads as wrong immediately.\n\nPin length: `+=${(mobile ? 1.3 : 2) * window.innerHeight}`. Use\n`invalidateOnRefresh: true`.\n\n### Reveals — light crossing things, never a fade\n\nOne file owns every entrance on the site.\n\n- **Images**: the frame opens by `clip-path: inset(0 0 100% 0)` → `inset(0)`, a\n  **1px strip light with a glow rides the clip edge down**, and the picture\n  inside settles back from `scale(1.14)` over 1.5× the frame's duration. The\n  push-in is what makes the frame read as *opening* rather than as a mask\n  sliding off something static. Drop it and the whole site goes flat.\n- **Type**: SplitText into lines, then a left-to-right clip wipe with a 0.06\n  stagger. Light crosses the sentence.\n- **Rows**: the same wipe down a list.\n- **Numbers** written into sentences count up to what they say.\n- Everything fires **once**, at `start: \"top 82%\"` — late, so the reader is\n  already looking at it.\n- Split after `document.fonts.ready`, or the line boxes get measured twice.\n\n### Page transitions\n\nThe same strip light that crosses the car crosses the page. One sweep takes the\nscreen to black, the next sweep takes it away. Implement as an `app/template.tsx`\nthat re-mounts per navigation, plus a link component that runs the exit sweep\nbefore pushing the route.\n\n### Headlights\n\nScrolling onto a featured build turns its headlights on. This is the hardest\nthing in the build and it has three traps:\n\n1. **Do not detect the lamp positions.** It was built twice and thrown away\n   twice. The centroid of a bright region lands in the *gap* between a pair of\n   headlights — on a car, that is the badge. And peak-finding picks specular\n   highlights on black paint and streetlights in the background as readily as it\n   picks a lamp. There are three featured builds. **Put three pairs of\n   coordinates in a `content/lamps.json` by hand**, read off a ruled overlay,\n   and write a `npm run lamps` script that draws the placements back onto the\n   frames so a human can check them.\n2. **The filament only fills in a lamp that is dark.** Where the photograph\n   already has a lit lamp, adding a white core erases its shape. Above a\n   luminance threshold the light goes into the bloom *around* the lamp instead —\n   that is the `unlit` factor in the shader.\n3. **A frame with no lit headlight gets no entry and is never ignited.** Faking\n   a lamp where the photograph does not have one produces a smear on a bonnet\n   reflection, which is exactly what it looks like.\n\nDrive `ignition` from a scrubbed ScrollTrigger (`start: \"top 85%\"`,\n`end: \"center 45%\"`), and set the same value as a CSS variable so the light\nspills off the picture and across the page on the DOM side too.\n\n### The light wall\n\nWeek eleven of a build is a quality pass under four light angles. The build page\nmakes that literal: one surface, four named lamps — **strip, flood, raking,\ndaylight** — on a gantry the reader can operate. Clicking an angle tweens the\nlamp position, ambient fill and throw. Same shared plane, same rake shader.\n\nThe raking pass is the one that matters. With real macro photography and normal\nmaps in `-nrm` files beside each shot, this stops being a demonstration and\nbecomes the actual inspection.\n\n### Before and after\n\nA slider whose divider **is** the light band — a 1px lit line with a glow, not a\nhandle with an icon in a circle.\n\n---\n\n## 11. Content layer\n\nTyped local data under `/content`, shaped so it can move to a CMS unchanged.\nThese are the contracts:\n\n```ts\n/**\n * Content shapes. These are the contract: local data today, a Sanity\n * dataset later, same types either side.\n */\n\nexport type BuildStatus = \"delivered\" | \"in-workshop\" | \"available\";\n\nexport interface Swatch {\n  /** Finish name as the paint shop writes it on the card. */\n  name: string;\n  /** Real measured colour of the finish, for the index swatches. */\n  hex: string;\n}\n\n/** An image slot. `src` empty means the placeholder frame renders instead. */\nexport interface Shot {\n  src: string;\n  alt: string;\n  /** Contact-sheet caption: FA-084 · G63 · SATIN OLIVE / TAN */\n  caption: string;\n  ratio: \"16/9\" | \"4/5\" | \"3/2\" | \"1/1\" | \"3/4\";\n}\n\nexport interface Build {\n  code: string;\n  slug: string;\n  /** Short name used in the index row. */\n  model: string;\n  /** Full base vehicle as it arrived, for the spec sheet. */\n  base: string;\n  status: BuildStatus;\n  /** Hours on the ramp. For in-workshop builds, hours logged so far. */\n  hours: number;\n  /** Month and year the car left. Absent while in build. */\n  delivered?: string;\n  /** Asking price for available stock. */\n  price?: string;\n  /** Written like a paint chip: finish, contrast, one detail. */\n  line: string;\n  exterior: Swatch;\n  interior: Swatch;\n  wheels: string;\n  lighting: string;\n  exhaust: string;\n  protection: string;\n  hero: Shot;\n  before: Shot;\n  after: Shot;\n  story: Shot[];\n  detail: { shot: Shot; body: string };\n  /** Placement on the home page, for the three featured builds. */\n  featured?: \"left\" | \"right\" | \"centre\";\n}\n\nexport interface Material {\n  /** Material name, set in display type. */\n  name: string;\n  /** The service it actually is, in mono. */\n  service: string;\n  /** One concrete sentence. No adjective triads. */\n  body: string;\n  duration: string;\n  shot: Shot;\n}\n\nexport interface LogEntry {\n  week: string;\n  title: string;\n  body: string;\n  shot: Shot;\n}\n\nexport interface Marque {\n  name: string;\n  count: number;\n}\n\nexport interface Voice {\n  quote: string;\n  /** Attributed to the build, not to a name and an avatar. */\n  build: string;\n}\n```\n\nWrite **thirteen** builds, of which three are featured and two are available\nstock. Give each a real build code, a slug, hours on the ramp, a finish written\nlike a paint chip, measured hex values for the swatches, and a `detail`\nparagraph that names a number of hours and a thing most people will never notice.\n\n---\n\n## 12. Copy\n\nWrite as a master craftsman who has done this for twenty years and does not need\nto sell. Short declaratives. Specific nouns and real numbers.\n\n**Required:**\n\n- Concrete detail over claims. \"The chrome went first, all of it. Door handles,\n  mirror caps, grille slats, the strip under the glass.\" — not \"meticulous\n  attention to detail\".\n- Numbers that are checkable: 612 hours, 38 hours on the handles, nine cars a year.\n- Mono captions written like a contact sheet: `FA-084 · G63 · SATIN OLIVE / TAN`.\n\n**Banned:**\n\n- Adjective triads (\"bespoke, luxurious, uncompromising\").\n- Em dashes in UI copy.\n- The words: *bespoke, luxury, premium, curated, elevate, crafted, passion,\n  journey, experience, unparalleled, iconic, seamless, innovative, solutions,\n  transform your, take it to the next level.*\n- Exclamation marks.\n- Any sentence that would survive being moved to another company's website.\n\n---\n\n## 13. The blacklist — what makes a site look AI-made\n\nEvery one of these is an instant tell. None of them appear anywhere on this site.\n\n- Inter or Geist as the brand face.\n- A serif italic for \"elegance\".\n- A centred hero with a centred subhead and two buttons.\n- Bento grids.\n- Logo marquees.\n- Stat grids in three equal boxes.\n- Testimonial carousels.\n- Fade-up-on-everything.\n- `scale(1.05)` hovers, and hover states that only change opacity.\n- Blob or ring cursors that do nothing.\n- `rounded-2xl` anything. Rounded corners at all.\n- Glassmorphism, `backdrop-filter` panels, neon gradient text.\n- Soft drop shadows as separation. Use a hairline.\n- A generic contact form with Name / Email / Message.\n- Emoji as icons.\n- Dark mode implemented as a toggle on a light design.\n- \"Get started\" / \"Learn more\" as button text.\n\n---\n\n## 14. Photography\n\n> **Never ship AI-generated car photos. Badges, wheel spokes and panel gaps warp,\n> and car people notice instantly. During development use clearly labelled\n> placeholders (`--ink-2` blocks with the mono caption and target aspect ratio)\n> or free stock that matches the art direction, flagged in\n> `/content/TODO-images.md`.**\n\nThis is not a stylistic preference. The buyers of these cars can tell, and a\nwarped badge destroys the credibility of everything else on the page.\n\nIf you use stock stand-ins, they must be made to sit in **one** art direction or\nthe page reads as a mood board. Write `scripts/process-shots.mjs` with sharp that:\n\n- centre-crops to the target ratio. **Do not use entropy or attention cropping**\n  — on a car in a dark room the highest-entropy region is the cobblestones, and\n  it will crop the floor and lose the car.\n- applies one of two grades: a heavy desaturation for cars, a colour-preserving\n  one for material samples.\n- composites a **studio bay**: crushed sky, rolled floor, vignette. This single\n  step is what makes found photographs read as one studio.\n- **scales the bay depth by the frame's own mean luminance.** Crushing a frame\n  that is already black takes the car with it and leaves headlights floating in\n  a void.\n- generates a Sobel normal map (`-nrm.webp`) beside every material sample, or the\n  rake shader 404s.\n- writes a credits file and ranks every output by mean luminance and saturation\n  so you can **see** the outliers instead of eyeballing a folder.\n\nAlso: WebP only. AVIF costs a slow on-demand encode that made LCP worse. And\nafter regenerating files at paths that already existed, `rm -rf .next/cache/images`\nor the optimiser serves the old variants.\n\n---\n\n## 15. The build brief\n\nFour steps, one question per screen. Not a contact form.\n\n1. **Your car** — make, model, year, and a \"not bought yet\" option that says\n   *\"If it is not bought yet, say so and we will help you choose.\"*\n2. **What you want to change** — multi-select over the six material names.\n3. **Timeline and budget** — bands only. \"A band is enough. It tells us which\n   materials to put in front of you.\"\n4. **How we reach you** — name, phone, email, preferred time, optional note and\n   photos. \"We call within one working day.\"\n\nBehaviour:\n\n- Progress is a fixed strip light filling across the top of the viewport, not a\n  dotted stepper. It carries `role=\"progressbar\"` and a label.\n- **Each step validates when you try to leave it**, not field by field. One mono\n  line, in `--sodium`, with `role=\"alert\"` and a reserved `min-height` so the\n  layout does not jump when it appears. No red boxes, no icons.\n- A Zod schema shared by client and route handler.\n- `POST /api/brief`: Zod parse, honeypot field, fixed-window rate limit\n  (five an hour per address), write to Supabase over REST, notify over Resend\n  REST. No SDKs.\n- **It degrades to \"call the studio\" with no env configured.** The site must\n  install and run with no services attached.\n\n---\n\n## 16. Accessibility\n\nNot a pass at the end. It changes how the motion is built.\n\n- **Reduced motion is a different composition**, not a disabled one: no pin, no\n  scrub, no sweep, no grain animation, Lenis never downloaded, GL never\n  initialised. The page is simply lit.\n- **SplitText breaks screen readers if you let it.** Splitting a paragraph\n  leaves a stack of line boxes where a sentence was. So: split with\n  `tag: \"span\"` (a `<div>` inside a `<p>` is invalid HTML) and `aria: \"none\"`,\n  mark the split copy `aria-hidden`, and restate the original sentence once in\n  a visually-hidden paragraph beside it.\n- The canvas is `aria-hidden` and `pointer-events: none`.\n- Full keyboard navigation. A visible 1px `--bone` focus ring with 3px offset on\n  **every** interactive element — including things that are only decorative on\n  hover. A skip link that is the first tab stop.\n- Interactive targets at least 24px tall. A footer link set in 12px mono needs\n  `padding-block: 5px; margin-block: -5px` and ~10px gaps, or Lighthouse's\n  `target-size` audit fails without changing the design.\n- The light wall's angle buttons are real buttons with `aria-pressed`.\n- Every photograph has an alt that describes the car and the light, not the file.\n\nTarget: **zero axe-core violations on every route, in both motion modes.**\n\n---\n\n## 17. Performance\n\nBudgets:\n\n| Bar | Target |\n| --- | --- |\n| LCP, mobile | ≤2.5s |\n| CLS | <0.05 |\n| INP | <200ms |\n| Initial JS, excluding three.js | ≤180KB gzipped |\n| Lighthouse performance | ≥90 desktop, ≥80 mobile |\n| Lighthouse accessibility | ≥95 |\n| Scrub | 60fps on a mid-range phone |\n\nHow to actually hit them:\n\n- Subset the fonts (§4). This is the single biggest LCP win available: it took\n  the reference build from a consistent 3.2s to 2.4s.\n- `three` is a dynamic import after first paint, gated on a registered plane.\n- The hero image is `priority` with a `sizes` of `100vw`.\n- Every image well has its aspect ratio declared, so CLS is **0**, not small.\n- WebP only, `images.qualities: [82]` in Next 16.\n- Grain is **one pre-rendered 256px PNG tile**, on an oversized layer stepped by\n  a `transform` animation with `steps()`. Never an SVG filter, never a canvas\n  loop, never a repaint — composited only.\n\n**Be honest about the two bars that are hard.** In the reference build, measured\non the production bundle against Lighthouse's simulated mobile throttling:\n\n- **Initial JS lands at 191–228KB excluding three.js, over the 180KB bar.**\n  React 19 plus the Next 16 client runtime is ~116KB of that, GSAP with\n  ScrollTrigger ~43KB, the site's own code the rest. The only remaining lever is\n  hand-rolling the scroll engine, which costs more in reliability than it saves\n  in bytes.\n- **Mobile LCP lands at 2.7–3.8s against the 2.5s target.** Every route is a\n  full-bleed photograph or a 12rem headline, served at full quality by\n  instruction, against a simulated 1.6 Mbps link. The only lever left is image\n  quality, which is the wrong thing to trade on a site whose product is the\n  photography. Desktop LCP is 0.5–0.7s.\n\nDo not paper over either one. If you cannot hit a bar, say which bar, by how\nmuch, and what the remaining lever costs.\n\n---\n\n## 18. Tooling you have to build\n\nThis is not optional scaffolding — it is how the site gets to this standard.\nDrive Chrome with `puppeteer-core` (point `executablePath` at the installed\nbrowser; do not download a second Chromium).\n\n| Script | What it must do |\n| --- | --- |\n| `qa` | Every route × 375/768/1280/1440/1920: horizontal overflow, **content clipped by an ancestor's `overflow`**, and a focus ring on the first 12 tab stops |\n| `a11y` | axe-core over every route, in normal **and** reduced motion |\n| `lighthouse` | Programmatic, mobile and desktop presets |\n| `budget` | Per-route JS and font payload, three.js reported separately |\n| `shoot` | Headless screenshots at a width, at the fold, at a scroll position, in reduced motion |\n| `strip` | **Stacks a whole page into one tall contact sheet.** A pinned hero makes a normal full-page capture useless, and this is the only way to judge a page's tonal rhythm |\n| `measure-display` | Remeasures display line ratios in the real face, refusing to run against the fallback |\n| `lamps` | Draws the hand-placed headlight coordinates back onto their frames |\n| `grain` | Regenerates the 256px grain tile |\n\n`qa`, `a11y`, `lighthouse` and `budget` run against the production build:\n\n```bash\nnpm run build && npx next start -p 3200\n```\n\nTwo things the reference build learned the hard way: `networkidle0` stops\nsettling once real photographs are in the page — use `domcontentloaded` plus an\nexplicit settle — and puppeteer captures the document top rather than the\nviewport on a scrolled or pinned page unless you pass\n`captureBeyondViewport: false`.\n\n---\n\n## 19. Traps\n\nEvery one of these cost real time in the reference build. Read them before you\nstart the phase they belong to.\n\n**Layout and stacking** — the single most common source of bugs here:\n\n1. **Pinning creates a stacking context.** ScrollTrigger sets `position: fixed`\n   on the pinned hero, so the hero drops below the shared canvas and the\n   headline disappears. Give the hero an explicit `z-index` above the canvas.\n2. **A section that lifts to `--ink-1` must not create a stacking context**, or\n   its own background paints over the GL planes inside it. Do not `z-index` the\n   section; `z-index` its *children* instead. The reference build spent several\n   rounds tuning the lighting on a section that was rendering pure black for\n   this reason — the lighting was never the problem.\n3. **A sparse 12-column grid cannot place a block on earlier columns in the same\n   row.** A right-heavy featured build whose meta sits left of its image will\n   silently drop to a second row. Put both halves on `grid-row: 1` explicitly.\n4. `overflow-x: clip` on `html`/`body` will hide a wide element instead of\n   showing a scrollbar — which means a clipped footer email at 375px looks fine\n   in a screenshot. This is why `qa` checks for clipped content, not just overflow.\n\n**GSAP:**\n\n5. `end: \"+=2 * 100%\"` is **not valid syntax** and the pin silently never\n   engages. Use `end: () => \"+=\" + 2 * window.innerHeight`.\n6. Reveals run twice — once from the `document.fonts.ready` promise and once\n   from React StrictMode's double invoke. Carry a cancellation flag.\n7. SplitText **clones the inline spans** inside a paragraph and can leave an\n   empty remnant. A counter that writes into the remnant prints \"612612\" or\n   \"99\". Only count in the span that actually holds text.\n8. Register plugins once at module level behind a flag. Reading\n   `gsap.core.globals()` to check is a TypeScript error.\n\n**Lenis:**\n\n9. Calling `lenis.stop()` for the preloader swallows any `scrollTo` issued\n   while it is stopped. Wait for the preloader to hide, then `start()` and\n   `scrollTo(y, { immediate: true, force: true })`.\n\n**Build and tooling:**\n\n10. Next 16's `images.qualities` is an **allowlist array**, not a number.\n11. An inline script that sets an attribute on `<html>` before paint needs\n    `suppressHydrationWarning` on `<html>`.\n12. Verify that a patch actually applied. A scripted edit against stale match\n    text fails silently; the `grid-row: 1` fix above was \"applied\" twice before\n    anyone dumped the computed styles and found it had never landed.\n\n---\n\n## 20. Build order\n\nSix phases. **Stop at each gate.** Run the audit, write the self-critique in\n§21, fix what it finds, and only then move on. The gates are what makes the\ndifference between this and a site that looks right in a screenshot.\n\n**Phase 1 — Foundation.** Scaffold, tokens, globals and reset, the two subset\nfonts, the grid and the dev overlay, type roles, grain, Lenis on the GSAP\nticker, nav and footer, the empty shared canvas, the capability check.\n*Gate:* three grounds visible, grid overlay aligns at all five widths, no\nconsole noise, reduced motion already behaves.\n\n**Phase 2 — The unveil.** Preloader, hero, the unveil shader on the shared\ncanvas, the scrubbed pin, the two-copy headline, the CSS fallback.\n*Gate:* preloader and hero read as **one continuous shot**. The headline lights\nup as the band crosses it, not before. The fallback still composes with GL\ndisabled.\n\n**Phase 3 — Home.** Manifesto, featured builds, material library with the rake,\nbuild log, ledger, voice, close. All reveals. Headlights.\n*Gate:* run `strip` and judge the tonal rhythm of the whole page as one image.\nExactly one `--ink-1` lift. No fades anywhere.\n\n**Phase 4 — Builds.** Index, build page, spec sheet, before/after, story frames,\nthe light wall, next-build link, page transitions.\n*Gate:* `qa` clean at five widths on every route.\n\n**Phase 5 — Brief and 404.** The four steps, Zod, the route handler, rate limit,\nthe torch.\n*Gate:* the brief submits with no env configured and degrades honestly. `a11y`\nclean in both motion modes.\n\n**Phase 6 — Finish.** Favicon and apple icon, OG images with the pinned TTFs,\nstructured data, sitemap, robots, metadata per route. Then the full audit:\n`budget`, `a11y`, `lighthouse` desktop and mobile, `qa`.\n*Gate:* report every number, including the ones that miss.\n\n---\n\n## 21. The self-critique, after every phase\n\nWrite it out, in prose, before moving on:\n\n1. Which single element on this page would a juror call generic, and why?\n2. Where does the light metaphor break, or get used where it is not earned?\n3. What is here that a dozen other dark portfolio sites also have?\n4. Does every animation relate to light, darkness or the physical build? Name\n   the ones that do not, and cut them.\n5. What would an owner of one of these cars not believe?\n6. Which number on the page cannot be checked?\n7. Read the copy aloud. Which sentence would survive on a competitor's site?\n\nThen fix what you found. The critique is only useful if something changes.\n\n---\n\n## 22. Acceptance\n\nThe build is done when all of these are true:\n\n- [ ] Zero axe-core violations, every route, both motion modes.\n- [ ] No horizontal overflow and no clipped content, 375 → 1920, every route.\n- [ ] A visible focus ring on every interactive element; skip link is the first tab stop.\n- [ ] CLS is 0, not merely under 0.05.\n- [ ] Lighthouse a11y / best practices / SEO at 100; performance ≥90 desktop.\n- [ ] `tsc --noEmit` and `eslint` clean.\n- [ ] Exactly one `WebGLRenderer` on the site, and three.js is absent from the\n      network tab on the routes that have nothing to draw.\n- [ ] Console clean on every route.\n- [ ] The site installs and runs with no environment variables set.\n- [ ] Every image falls back to a labelled placeholder when its file is missing.\n- [ ] No AI-generated car photography, and every stand-in is credited and flagged.\n- [ ] No invented client quote, address, phone number or price.\n- [ ] Nothing from the blacklist in §13 appears anywhere."
};

export function getBody(id) {
  if (id == null) return null;
  const key = String(id).padStart(2, '0');
  return BODIES[key] || BODIES[String(id)] || null;
}
