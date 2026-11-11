/* NULLRIFT — TPL.03 WOBL

   public/wobl/ is the author's Vite build of the WOBL project, built with
   base /wobl/. Five asset URLs are hard-coded strings that a base does not
   rewrite (the bear models, the HDRI and the product shots), so they are
   prefixed after the build:

     cd ../WOBL && npx vite build --base /wobl/ --outDir <tmp>
     perl -pi -e 's#([`\x27"])/(products|models|hdri)/#$1/wobl/$2/#g' <tmp>/assets/*.js
     rm -rf public/wobl && cp -R <tmp> public/wobl
*/

import { frameTemplate } from './frame-template.js';

export default frameTemplate({
  page: new URL('../../wobl/index.html', import.meta.url).href,
  title: 'WOBL — living 3D jelly-bear brand site template',
  background: '#2A1D7C',
  peekDepth: 0.14
});
