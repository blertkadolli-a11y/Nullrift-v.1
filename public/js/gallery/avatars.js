/* ==========================================================================
   NULLRIFT — preset profile pictures

   Six flat portrait illustrations, drawn as inline SVG. No image files, no
   uploads, no external service — they render identically at 26px in the nav
   and at swatch size in the picker, and they cost nothing to serve.

   Each one is self-contained: its own circular background, its own clip path.
   The clip id is uniquified per call because the same avatar is frequently on
   the page more than once (nav chip + picker swatch), and duplicate ids would
   make every copy clip against whichever one rendered last.

   A custom upload, when there is one, replaces these entirely — `renderAvatar`
   below is the single place that decides.
   ========================================================================== */

export const PRESETS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];

/* bg, skin, hair — chosen to stay distinct at 26px, where fine detail is lost
   and only the silhouette and colour separate one person from another. */
const FACES = {
  a1: { bg: '#8b93ff', skin: '#f4d9c2', hair: '#3a2d26', style: 'short' },
  a2: { bg: '#2dd4bf', skin: '#8d5a44', hair: '#1c1512', style: 'curls' },
  a3: { bg: '#fbbf24', skin: '#f0c9a8', hair: '#7c4a2d', style: 'long' },
  a4: { bg: '#fb7185', skin: '#5c3a2a', hair: '#241a15', style: 'bun' },
  a5: { bg: '#34d399', skin: '#e8c4a0', hair: '#d6d3d1', style: 'beard' },
  a6: { bg: '#64748b', skin: '#c98d63', hair: '#2b2320', style: 'glasses' }
};

let uid = 0;

export function isPreset(id) {
  return Object.prototype.hasOwnProperty.call(FACES, id);
}

function hairFor(style, hair) {
  switch (style) {
    case 'curls':
      return '<path d="M9.6 12.6a6.4 6.4 0 0 1 12.8 0c0 .9-.5 1.2-1.1.7-1.6-1.4-3.4-2-5.3-2s-3.7.6-5.3 2c-.6.5-1.1.2-1.1-.7Z" fill="' + hair + '"/>' +
             '<circle cx="9.8" cy="11.4" r="2.1" fill="' + hair + '"/>' +
             '<circle cx="22.2" cy="11.4" r="2.1" fill="' + hair + '"/>';
    case 'long':
      return '<path d="M8.9 21V12.9a7.1 7.1 0 0 1 14.2 0V21c0 .8-1 1-1.4.3-.5-.9-.8-2.6-.8-4.5 0-.7-.6-1-1.1-.6-1 .8-2.3 1.2-3.8 1.2s-2.8-.4-3.8-1.2c-.5-.4-1.1-.1-1.1.6 0 1.9-.3 3.6-.8 4.5-.4.7-1.4.5-1.4-.3Z" fill="' + hair + '"/>';
    case 'bun':
      return '<circle cx="16" cy="6.2" r="2.6" fill="' + hair + '"/>' +
             '<path d="M9.7 13.2a6.3 6.3 0 0 1 12.6 0c0 .8-.6 1.1-1.2.6-1.5-1.3-3.3-1.9-5.1-1.9s-3.6.6-5.1 1.9c-.6.5-1.2.2-1.2-.6Z" fill="' + hair + '"/>';
    case 'beard':
      return '<path d="M9.7 13a6.3 6.3 0 0 1 12.6 0c0 .8-.6 1.1-1.2.6-1.5-1.3-3.3-1.9-5.1-1.9s-3.6.6-5.1 1.9c-.6.5-1.2.2-1.2-.6Z" fill="' + hair + '"/>' +
             '<path d="M10.9 16.4c0 3.4 2.3 5.7 5.1 5.7s5.1-2.3 5.1-5.7c0-.6-.5-.9-1-.6-1.2.8-2.6 1.2-4.1 1.2s-2.9-.4-4.1-1.2c-.5-.3-1-.0-1 .6Z" fill="' + hair + '" opacity="0.92"/>';
    case 'glasses':
      return '<path d="M9.7 13a6.3 6.3 0 0 1 12.6 0c0 .8-.6 1.1-1.2.6-1.5-1.3-3.3-1.9-5.1-1.9s-3.6.6-5.1 1.9c-.6.5-1.2.2-1.2-.6Z" fill="' + hair + '"/>' +
             '<g fill="none" stroke="#1f2937" stroke-width="1.1" opacity="0.85">' +
             '<circle cx="12.9" cy="15.4" r="2.5"/><circle cx="19.1" cy="15.4" r="2.5"/>' +
             '<path d="M15.4 15.4h1.2"/></g>';
    default:
      return '<path d="M9.7 13.4a6.3 6.3 0 0 1 12.6 0c0 .8-.6 1.1-1.2.6-1.5-1.3-3.3-1.9-5.1-1.9s-3.6.6-5.1 1.9c-.6.5-1.2.2-1.2-.6Z" fill="' + hair + '"/>';
  }
}

export function presetSvg(id) {
  const f = FACES[isPreset(id) ? id : 'a1'];
  const clip = 'nra' + (uid += 1);
  return (
    '<svg class="avatar__art" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
      '<defs><clipPath id="' + clip + '"><circle cx="16" cy="16" r="16"/></clipPath></defs>' +
      '<g clip-path="url(#' + clip + ')">' +
        '<circle cx="16" cy="16" r="16" fill="' + f.bg + '"/>' +
        /* shoulders first, head over them */
        '<path d="M16 20.6c5.6 0 10.2 3.6 10.2 8.2V34H5.8v-5.2c0-4.6 4.6-8.2 10.2-8.2Z" fill="' + f.skin + '"/>' +
        '<circle cx="16" cy="14.6" r="6.3" fill="' + f.skin + '"/>' +
        hairFor(f.style, f.hair) +
      '</g>' +
    '</svg>'
  );
}

/* The one place that resolves a profile to a visual. Falls back all the way
   down to a1 so the nav never renders an empty hole. */
export function renderAvatar(profile) {
  if (profile && profile.avatar_url) {
    const safe = String(profile.avatar_url).replace(/"/g, '&quot;');
    return '<img class="avatar__img" src="' + safe + '" alt="" loading="lazy">';
  }
  return presetSvg(profile && profile.avatar_preset);
}

/* "Blert Kadolli" → "Blert". Used for the nav chip, which has room for one
   word and reads warmer with a first name than with an email address. */
export function firstName(profile, fallbackEmail) {
  const name = profile && profile.username ? String(profile.username).trim() : '';
  if (name) return name.split(/\s+/)[0];
  const email = String(fallbackEmail || '');
  return email ? email.split('@')[0] : 'Account';
}
