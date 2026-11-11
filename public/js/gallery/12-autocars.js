/* NULLRIFT — TPL.04 AUTOCARS (Bodyline Coachworks)

   public/autocars/ is a static export of the author's Next.js project, made
   from a copy so the project itself is untouched. In the copy:

     next.config.ts   output: "export", basePath: "/autocars",
                      trailingSlash: true, images: { unoptimized: true }
     content/*.ts, content/lamps.json, styles/globals.css
                      "/shots/…" and "/grain.png" prefixed with /autocars
     metadata routes  export const dynamic = "force-static"
     app/api          removed: a static preview has no server, so the Build
                      Brief form shows its own "did not send — call the
                      studio" state instead of submitting
     out/**           "/apple-icon" prefixed with /autocars after the build
*/

import { frameTemplate } from './frame-template.js';

export default frameTemplate({
  page: new URL('../../autocars/index.html', import.meta.url).href,
  title: 'AUTOCARS — Bodyline Coachworks, a one-off car builder site template',
  background: '#0A0A09',
  peekDepth: 0.18
});
