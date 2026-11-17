/* NULLRIFT — TPL.01 OBLIQUE

   This exhibit is a frame, not a port.

   Oblique is a whole page: it owns window scroll, runs its own smooth-scroll
   loop off the wheel and keyboard, locks document.body while a print is open,
   and adds its own gsap.ticker frame. Every other module here is sandboxed
   into a stage box and forbidden from touching page scroll — so dropping
   Oblique's code in directly would have it fighting the gallery for the wheel,
   and adapting it would mean rewriting the scroll core it is built on.

   An iframe gives it its own document. The page in public/oblique/ is the
   author's build, byte for byte, with nothing rewritten: it owns scroll inside
   its own frame, where owning scroll is free.

   As a card it is a thumbnail of the template, so it has to look like the
   site someone will actually ship. A frame the width of a card is a phone
   viewport, and would show the mobile layout of a desktop-first page. So the
   preview renders at a desktop width and is scaled down to the card; only
   fullscreen gets the real viewport. Hovering the card peeks down the page,
   the way you would flick through a template before opening it.

   The trade is honest: heavier than a canvas module. frame-template.js, which
   this card now shares with the other templates, keeps that in check: the
   page is paused off screen and runs at about 30fps until it is hovered.
   ========================================================================== */

import { frameTemplate } from './frame-template.js';

/* A hover peeks a long way down: Oblique is one grid, and the browse is the
   point. Slow on purpose: it is a browse, not a scroll-jack. */
export default frameTemplate({
  page: new URL('../../oblique/index.html', import.meta.url).href,
  title: 'Oblique — tilted grid portfolio template',
  background: '#1500E1',
  peekDepth: 0.55,
  peekIn: 9,
  peekOut: 1.1
});
