/* NULLRIFT — TPL.02 HADAL

   public/hadal/ is the author's Vite build of the HADAL project, built with
   base /hadal/ so its assets resolve under this site:

     cd ../HADAL && npx vite build --base /hadal/ --outDir <tmp>
     # MODEL_URL is a hard-coded string, which a base does not rewrite:
     sed -i '' 's#`/models/hadal.glb`#`/hadal/models/hadal.glb`#' <tmp>/assets/index-*.js
     rm -rf public/hadal && cp -R <tmp> public/hadal

   HADAL is long (eleven pinned chapters), so a hover sinks only as far as the
   plunge below the surface. */

import { frameTemplate } from './frame-template.js';

export default frameTemplate({
  page: new URL('../../hadal/index.html', import.meta.url).href,
  title: 'HADAL — scroll-driven 3D submersible site template',
  background: '#03060A',
  peekDepth: 0.12
});
