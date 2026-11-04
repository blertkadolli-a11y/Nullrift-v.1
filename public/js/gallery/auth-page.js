/* ==========================================================================
   NULLRIFT — the sign-in page

   Three steps on one page: email → code → (first time only) username and
   picture. No passwords, so there is nothing to forget, nothing to leak, and
   no separate "confirm your address then come back and sign in" round trip —
   receiving the code is the proof the address is real.

   ?next= carries where the visitor was going, so a prompt they clicked before
   signing in is what they land back on.
   ========================================================================== */

import * as auth from './auth.js';
import { PRESETS, presetSvg } from './avatars.js';

const steps = {
  email: document.querySelector('[data-step="email"]'),
  code: document.querySelector('[data-step="code"]'),
  profile: document.querySelector('[data-step="profile"]')
};
const msgEl = document.querySelector('[data-auth-msg]');
const heading = document.querySelector('[data-auth-heading]');
const deck = document.querySelector('[data-auth-deck]');

let email = '';
let preset = PRESETS[0];

/* Supabase's OTP length is a project setting (Authentication → Sign In /
   Providers → Email → Email OTP Length), not something this page controls, and
   it can be anywhere from 6 to 10 digits. Hard-coding 6 here is what silently
   blocked sign-in when the project was issuing 8 — the input capped at six
   characters and the check rejected everything.

   So: accept any length in Supabase's supported range, and use CODE_LENGTH
   only to decide when to auto-submit. If the two ever disagree the visitor
   just presses the button instead of it firing on the last keystroke — a lost
   nicety, never a blocked sign-in. */
const CODE_MIN = 6;
const CODE_MAX = 10;
const CODE_LENGTH = 6;

/* Only same-origin paths are honoured. An open redirect here would let anyone
   send a NULLRIFT sign-in link that bounces to a site they control. */
function nextTarget() {
  const raw = new URL(location.href).searchParams.get('next') || 'gallery.html';
  if (/^https?:|^\/\//i.test(raw)) return 'gallery.html';
  return raw;
}

function show(name) {
  Object.keys(steps).forEach((k) => { if (steps[k]) steps[k].hidden = k !== name; });
  message('');
  if (name === 'code') {
    heading.textContent = 'Check your email';
    deck.textContent = 'We sent a six-digit code. It expires in an hour.';
    steps.code.querySelector('#au-code').focus();
  } else if (name === 'profile') {
    heading.textContent = 'Welcome to NULLRIFT';
    deck.textContent = 'Pick how you want to appear. You can change both later.';
    steps.profile.querySelector('#au-user').focus();
  } else {
    heading.textContent = 'Sign in to NULLRIFT';
    deck.textContent = 'One account unlocks every prompt you have access to.';
  }
}

function message(text, kind) {
  msgEl.textContent = text || '';
  msgEl.hidden = !text;
  msgEl.dataset.kind = kind || 'error';
}

function busy(form, on, label) {
  const go = form.querySelector('.auth__go');
  go.disabled = on;
  if (on) {
    go.dataset.idle = go.textContent;
    go.textContent = label;
  } else if (go.dataset.idle) {
    go.textContent = go.dataset.idle;
  }
}

function leave() {
  location.href = nextTarget();
}

/* --------------------------------------------------------------- step 1 */

steps.email.addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = e.currentTarget.email.value.trim();
  if (!value || value.indexOf('@') < 1) return message('Enter a valid email address.');

  busy(e.currentTarget, true, 'Sending…');
  try {
    await auth.sendCode(value);
    email = value;
    document.querySelector('[data-auth-sentto]').textContent = email;
    show('code');
  } catch (err) {
    message(err.message);
  } finally {
    busy(e.currentTarget, false);
  }
});

/* --------------------------------------------------------------- step 2 */

steps.code.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = e.currentTarget.token.value.replace(/\D/g, '');
  if (token.length < CODE_MIN) {
    return message('That code looks too short — check the email and retype it.');
  }

  busy(e.currentTarget, true, 'Signing in…');
  try {
    await auth.verifyCode(email, token);
    if (auth.needsProfileSetup()) show('profile');
    else leave();
  } catch (err) {
    message(err.message);
  } finally {
    busy(e.currentTarget, false);
  }
});

steps.code.querySelector('[data-auth-back]').addEventListener('click', () => show('email'));

steps.code.querySelector('[data-auth-resend]').addEventListener('click', async () => {
  message('');
  try {
    await auth.sendCode(email);
    message('Another code is on the way.', 'ok');
  } catch (err) {
    message(err.message);
  }
});

/* Typing the last digit is unambiguous intent — submit rather than making them
   reach for a button they can already see the end of. */
steps.code.querySelector('#au-code').addEventListener('input', (e) => {
  const v = e.target.value.replace(/\D/g, '').slice(0, CODE_MAX);
  e.target.value = v;
  if (v.length === CODE_LENGTH) steps.code.requestSubmit();
});

/* --------------------------------------------------------------- step 3 */

const strip = document.querySelector('[data-auth-avatars]');
PRESETS.forEach((id, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'auth__avatar';
  b.dataset.preset = id;
  b.setAttribute('role', 'radio');
  b.setAttribute('aria-checked', String(i === 0));
  b.setAttribute('aria-label', 'Profile picture ' + id.slice(1));
  b.innerHTML = presetSvg(id);
  b.addEventListener('click', () => {
    preset = id;
    strip.querySelectorAll('[data-preset]').forEach((x) => {
      x.setAttribute('aria-checked', String(x.dataset.preset === id));
    });
  });
  strip.appendChild(b);
});

steps.profile.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = e.currentTarget.username.value.trim();
  if (username.length < 2) return message('Pick a username of at least 2 characters.');

  busy(e.currentTarget, true, 'Saving…');
  try {
    await auth.saveProfile({ username, avatar_preset: preset, avatar_url: null });
    leave();
  } catch (err) {
    message(err.message);
  } finally {
    busy(e.currentTarget, false);
  }
});

steps.profile.querySelector('[data-auth-skip]').addEventListener('click', leave);

/* ------------------------------------------------------------------ boot */

/* A magic link lands here with the session in the hash. Consume it, then strip
   it from the address bar — a URL carrying a live access token should not sit
   in history or get pasted to anyone. */
const hash = new URLSearchParams(location.hash.replace(/^#/, ''));

if (hash.get('error_description')) {
  message(hash.get('error_description').replace(/\+/g, ' '));
  history.replaceState(null, '', location.pathname + location.search);
} else if (hash.get('access_token')) {
  message('Signing you in…', 'ok');
  auth.adoptTokens({
    access_token: hash.get('access_token'),
    refresh_token: hash.get('refresh_token'),
    expires_at: hash.get('expires_at')
  }).then(() => {
    history.replaceState(null, '', location.pathname + location.search);
    if (auth.needsProfileSetup()) show('profile');
    else leave();
  }).catch((err) => message(err.message));
}

/* Already signed in and already set up: there is nothing to do here. */
else if (auth.getSession()) {
  auth.loadProfile().then(() => {
    if (auth.needsProfileSetup()) show('profile');
    else leave();
  });
}

if (!auth.isConfigured()) {
  message('Accounts are not configured on this deployment yet.');
}
