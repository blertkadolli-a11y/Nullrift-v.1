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
- Use case: "Portrait and product reveals that make the visitor go looking."`
};

export function getBody(id) {
  if (id == null) return null;
  const key = String(id).padStart(2, '0');
  return BODIES[key] || BODIES[String(id)] || null;
}
