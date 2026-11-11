/* ==========================================================================
   NULLRIFT — the sign-in page

   One page, several doors, one session at the end:

     signin    email + password            (default)
     signup    username + email + password → confirm with emailed code/link
     otp       passwordless: email a code
     forgot    email a password-reset code/link
     code      type the emailed code (sign-in, sign-up or reset)
     newpass   choose a new password (after a reset, or ?mode=password)
     profile   first time only: username + picture
   plus "Continue with Google / Apple / GitHub …" above the forms.

   ?mode= picks the opening door (signin | signup | otp | forgot | password).
   ?next= carries where the visitor was going, so a prompt they clicked before
   signing in is what they land back on.
   ========================================================================== */

import * as auth from './auth.js';
import { PRESETS, presetSvg } from './avatars.js';

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const steps = {};
$$('[data-step]').forEach((el) => { steps[el.dataset.step] = el; });

const msgEl = $('[data-auth-msg]');
const heading = $('[data-auth-heading]');
const deck = $('[data-auth-deck]');
const social = $('[data-auth-social]');

/* What the code step is confirming: 'otp' (passwordless sign-in), 'signup'
   (confirming a new account) or 'recovery' (password reset). */
let codeKind = 'otp';
const verifyType = () => (codeKind === 'recovery' ? 'recovery' : 'email');
let email = '';
let remember = true;
let preset = PRESETS[0];
let afterPassword = 'leave';

const CODE_MIN = 6;
const CODE_MAX = 10;
const CODE_LENGTH = 6;
const PW_MIN = 8;

/* ---------------------------------------------------------------- routes */

/* Only same-origin relative paths are honoured. An open redirect here would
   let anyone send a NULLRIFT sign-in link that bounces to a site they
   control. */
function nextTarget() {
  const raw = new URL(location.href).searchParams.get('next') || 'gallery.html';
  if (/^[a-z][a-z0-9+.-]*:|^\/\/|^\\/i.test(raw)) return 'gallery.html';
  return raw.replace(/^\/+/, '');
}

/* Where emailed links and OAuth come back to: this page, with next= kept. */
function returnUrl(extra) {
  const u = new URL(location.pathname, location.origin);
  u.searchParams.set('next', nextTarget());
  if (extra) Object.keys(extra).forEach((k) => u.searchParams.set(k, extra[k]));
  return u.href;
}

function leave() {
  location.replace(nextTarget());
}

/* ----------------------------------------------------------------- views */

const COPY = {
  signin:  ['Sign in to NULLRIFT', 'One account unlocks every prompt you have access to.'],
  signup:  ['Create your account', 'Free to make. Unlocks the prompts on your plan.'],
  otp:     ['Sign in with a code', 'We email you a code. No password needed.'],
  forgot:  ['Reset your password', 'Enter your email and we will send you a code and a link to choose a new one.'],
  code:    ['Check your email', 'Enter the code we sent. It expires in an hour.'],
  newpass: ['Choose a new password', 'Make it at least 8 characters. Your password manager can suggest one.'],
  profile: ['Welcome to NULLRIFT', 'Pick how you want to appear. You can change both later.']
};

/* Social buttons belong with the doors that start a sign-in, not with the
   ones that finish one. */
const SHOW_SOCIAL = { signin: true, signup: true, otp: true };

let current = null;

function show(name, opts) {
  opts = opts || {};
  current = name;
  Object.keys(steps).forEach((k) => { steps[k].hidden = k !== name; });
  if (!opts.keepMessage) message('');
  social.hidden = !(SHOW_SOCIAL[name] && providerCount > 0);

  const c = COPY[name] || COPY.signin;
  heading.textContent = opts.title || c[0];
  deck.textContent = opts.deck || c[1];

  /* Carry a typed email between doors so nobody types it twice. */
  const emailInput = steps[name].querySelector('input[type="email"]:not([hidden])');
  if (emailInput && !emailInput.value && email) emailInput.value = email;

  const first = name === 'code' ? $('#au-code')
    : steps[name].querySelector('input:not([type="hidden"]):not([hidden]):not([type="checkbox"])');
  const target = emailInput && emailInput.value && name !== 'code'
    ? steps[name].querySelector('input[type="password"], input[name="username"]') || first
    : first;
  if (target && !opts.noFocus) setTimeout(() => target.focus(), 0);
}

function message(text, kind) {
  msgEl.textContent = text || '';
  msgEl.hidden = !text;
  msgEl.dataset.kind = kind || 'error';
}

function busy(form, on, label) {
  const go = form.querySelector('.auth__go');
  if (!go) return;
  go.disabled = on;
  form.setAttribute('aria-busy', String(on));
  if (on) {
    go.dataset.idle = go.textContent;
    go.textContent = label;
  } else if (go.dataset.idle) {
    go.textContent = go.dataset.idle;
  }
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function rememberFrom(form) {
  const box = form.querySelector('input[name="remember"]');
  return box ? box.checked : true;
}

/* After any successful sign-in: first-timers pick a name, everyone else goes
   back to what they were doing. */
function finish() {
  if (auth.needsProfileSetup()) show('profile');
  else leave();
}

/* Every [data-go] link switches door. */
$$('[data-go]').forEach((b) => {
  b.addEventListener('click', () => {
    const form = b.closest('form');
    const typed = form && form.querySelector('input[type="email"]');
    if (typed && typed.value.trim()) email = typed.value.trim();
    show(b.dataset.go);
  });
});

/* ------------------------------------------------------- show password */

$$('[data-peek]').forEach((b) => {
  b.addEventListener('click', () => {
    const input = b.parentElement.querySelector('input');
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    b.textContent = showing ? 'Show' : 'Hide';
    b.setAttribute('aria-pressed', String(!showing));
    b.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    input.focus();
  });
});

/* A gentle meter, not a rulebook: length is what actually matters. */
$$('[data-pw-meter]').forEach((hint) => {
  const input = hint.parentElement.querySelector('#' + hint.id.replace('-hint', ''));
  if (!input) return;
  const idle = hint.textContent;
  input.addEventListener('input', () => {
    const n = input.value.length;
    if (!n) { hint.textContent = idle; hint.dataset.kind = ''; return; }
    if (n < PW_MIN) { hint.textContent = (PW_MIN - n) + ' more character' + (PW_MIN - n === 1 ? '' : 's') + '.'; hint.dataset.kind = 'weak'; return; }
    const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(input.value)).length;
    const strong = n >= 14 || (n >= 10 && classes >= 3);
    hint.textContent = strong ? 'Strong password.' : 'Good. Longer is stronger.';
    hint.dataset.kind = strong ? 'strong' : 'ok';
  });
});

/* ----------------------------------------------------------- providers */

const PROVIDERS = {
  google: {
    label: 'Google',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3Z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"/></svg>'
  },
  apple: {
    label: 'Apple',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.3 0 2.2-1.3 3-2.5a10 10 0 0 0 1.4-2.8c0-.1-2.6-1-2.6-4.2ZM13.9 5.1c.7-.8 1.2-2 1-3.1-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4Z"/></svg>'
  },
  github: {
    label: 'GitHub',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z"/></svg>'
  },
  azure: { label: 'Microsoft', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M1 1h10.5v10.5H1z"/><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/><path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>' },
  discord: { label: 'Discord', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#5865F2" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.2-.3 13.8.1 18.3a19.9 19.9 0 0 0 6 3l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.8-3.6-13.9ZM8 15.5c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.7 8 10.7s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>' }
};

/* Most-used first. Anything enabled in Supabase but not listed here is left
   out rather than drawn without an icon. */
const ORDER = ['google', 'apple', 'github', 'azure', 'discord'];

let providerCount = 0;

async function drawProviders() {
  const info = await auth.getProviders();
  const list = ORDER.filter((p) => info.oauth.indexOf(p) !== -1);
  providerCount = list.length;
  const wrap = $('[data-auth-providers]');
  wrap.innerHTML = '';
  list.forEach((id) => {
    const p = PROVIDERS[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'auth__provider';
    b.dataset.provider = id;
    b.innerHTML = '<span class="auth__provider-icon">' + p.icon + '</span><span></span>';
    b.lastChild.textContent = 'Continue with ' + p.label;
    b.addEventListener('click', async () => {
      $$('.auth__provider').forEach((x) => { x.disabled = true; });
      b.lastChild.textContent = 'Opening ' + p.label + '…';
      const form = steps[current];
      try {
        await auth.startOAuth(id, returnUrl(), form ? rememberFrom(form) : true);
      } catch (err) {
        $$('.auth__provider').forEach((x) => { x.disabled = false; });
        b.lastChild.textContent = 'Continue with ' + p.label;
        message(err.message);
      }
    });
    wrap.appendChild(b);
  });
  if (current) social.hidden = !(SHOW_SOCIAL[current] && providerCount > 0);

  if (info.signupDisabled) {
    $$('[data-go="signup"]').forEach((b) => { b.parentElement.hidden = true; });
  }
}

/* --------------------------------------------------------------- sign in */

steps.signin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const value = form.email.value.trim();
  const password = form.password.value;
  if (!validEmail(value)) { form.email.focus(); return message('Enter a valid email address.'); }
  if (!password) { form.password.focus(); return message('Enter your password.'); }

  email = value;
  remember = rememberFrom(form);
  busy(form, true, 'Signing in…');
  try {
    await auth.signIn(value, password, remember);
    finish();
  } catch (err) {
    if (err.code === 'email_not_confirmed') {
      /* They signed up but never confirmed. Send a fresh code and let them
         finish right here instead of hunting for the old email. */
      try { await auth.resendSignup(value, returnUrl()); } catch (e2) { /* rate limit: old code may still work */ }
      codeKind = 'signup';
      $('[data-auth-sentto]').textContent = value;
      show('code', { title: 'Confirm your email', deck: 'Your account is not confirmed yet. We just sent a new code.' });
      return;
    }
    message(err.message);
    form.password.select();
  } finally {
    busy(form, false);
  }
});

/* --------------------------------------------------------------- sign up */

steps.signup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const username = form.username.value.trim().replace(/\s+/g, ' ');
  const value = form.email.value.trim();
  const password = form.password.value;

  if (username.length < 2) { form.username.focus(); return message('Pick a username of at least 2 characters.'); }
  if (!validEmail(value)) { form.email.focus(); return message('Enter a valid email address.'); }
  if (password.length < PW_MIN) { form.password.focus(); return message('Your password needs at least ' + PW_MIN + ' characters.'); }

  email = value;
  remember = rememberFrom(form);
  busy(form, true, 'Creating account…');
  try {
    const out = await auth.signUp(value, password, { username, avatar_preset: preset }, returnUrl(), remember);
    if (!out.pending) return finish();
    codeKind = 'signup';
    $('[data-auth-sentto]').textContent = value;
    show('code', {
      title: 'Confirm your email',
      deck: out.maybeExisting
        ? 'If this address is new, a confirmation code is on its way. If you already have an account, sign in or reset your password instead.'
        : 'Enter the code we sent to finish creating your account. You can also click the link in the email.'
    });
  } catch (err) {
    message(err.message);
  } finally {
    busy(form, false);
  }
});

/* ---------------------------------------------------------- passwordless */

steps.otp.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const value = form.email.value.trim();
  if (!validEmail(value)) { form.email.focus(); return message('Enter a valid email address.'); }

  busy(form, true, 'Sending…');
  try {
    await auth.sendCode(value, returnUrl());
    email = value;
    codeKind = 'otp';
    remember = true;
    $('[data-auth-sentto]').textContent = email;
    show('code');
  } catch (err) {
    message(err.message);
  } finally {
    busy(form, false);
  }
});

/* -------------------------------------------------------- forgot password */

steps.forgot.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const value = form.email.value.trim();
  if (!validEmail(value)) { form.email.focus(); return message('Enter a valid email address.'); }

  busy(form, true, 'Sending…');
  try {
    await auth.requestPasswordReset(value, returnUrl({ mode: 'reset' }));
    email = value;
    codeKind = 'recovery';
    $('[data-auth-sentto]').textContent = email;
    /* Same answer whether or not the address has an account, so this page
       cannot be used to find out who is a customer. */
    show('code', {
      title: 'Check your email',
      deck: 'If an account exists for that address, we sent a reset code and a link. Enter the code, or click the link.'
    });
  } catch (err) {
    message(err.message);
  } finally {
    busy(form, false);
  }
});

/* ------------------------------------------------------------------ code */

steps.code.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const token = form.token.value.replace(/\D/g, '');
  if (token.length < CODE_MIN) {
    form.token.focus();
    return message('That code looks too short. Check the email and type it again.');
  }

  busy(form, true, 'Checking…');
  try {
    await auth.verifyCode(email, token, verifyType(), remember);
    form.token.value = '';
    if (codeKind === 'recovery') {
      afterPassword = 'leave';
      openNewPassword();
    } else {
      finish();
    }
  } catch (err) {
    message(err.message);
    form.token.select();
  } finally {
    busy(form, false);
  }
});

$('[data-auth-back]').addEventListener('click', () => {
  show({ recovery: 'forgot', signup: 'signup', otp: 'otp' }[codeKind] || 'signin');
});

$('[data-auth-resend]').addEventListener('click', async (e) => {
  const b = e.currentTarget;
  b.disabled = true;
  message('');
  try {
    if (codeKind === 'recovery') await auth.requestPasswordReset(email, returnUrl({ mode: 'reset' }));
    else if (codeKind === 'signup') await auth.resendSignup(email, returnUrl());
    else await auth.sendCode(email, returnUrl());
    message('Another email is on the way.', 'ok');
  } catch (err) {
    message(err.message);
  } finally {
    /* A short cool-down stops a double-click from tripping the rate limit. */
    setTimeout(() => { b.disabled = false; }, 20000);
  }
});

$('#au-code').addEventListener('input', (e) => {
  const v = e.target.value.replace(/\D/g, '').slice(0, CODE_MAX);
  e.target.value = v;
  if (v.length === CODE_LENGTH) steps.code.requestSubmit();
});

/* ---------------------------------------------------------- new password */

function openNewPassword(opts) {
  const user = $('[data-newpass-user]');
  user.value = auth.getEmail() || email;
  show('newpass', opts);
}

steps.newpass.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const password = form.password.value;
  if (password.length < PW_MIN) { form.password.focus(); return message('Your password needs at least ' + PW_MIN + ' characters.'); }
  if (password !== form.confirm.value) { form.confirm.focus(); return message('The two passwords do not match.'); }

  busy(form, true, 'Saving…');
  try {
    await auth.updatePassword(password);
    message('Password saved.', 'ok');
    form.password.value = '';
    form.confirm.value = '';
    setTimeout(() => {
      if (afterPassword === 'leave') finish();
    }, 700);
  } catch (err) {
    if (err.status === 401) {
      message('Your reset link has expired. Ask for a new one.');
      show('forgot', { keepMessage: true });
    } else {
      message(err.message);
    }
  } finally {
    busy(form, false);
  }
});

/* --------------------------------------------------------------- profile */

const strip = $('[data-auth-avatars]');
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
  const form = e.currentTarget;
  const username = form.username.value.trim().replace(/\s+/g, ' ');
  if (username.length < 2) { form.username.focus(); return message('Pick a username of at least 2 characters.'); }

  busy(form, true, 'Saving…');
  try {
    await auth.saveProfile({ username, avatar_preset: preset, avatar_url: null });
    leave();
  } catch (err) {
    message(err.message);
  } finally {
    busy(form, false);
  }
});

$('[data-auth-skip]').addEventListener('click', leave);

/* ------------------------------------------------------------------ boot */

/* Strip anything sensitive from the address bar once it has been read — a
   URL carrying a live token or code should not sit in history. */
function cleanUrl(keepMode) {
  const u = new URL(location.href);
  ['code', 'error', 'error_code', 'error_description', 'type', 'token_hash'].forEach((k) => u.searchParams.delete(k));
  if (!keepMode) u.searchParams.delete('mode');
  history.replaceState(null, '', u.pathname + (u.searchParams.toString() ? '?' + u.searchParams : ''));
}

async function boot() {
  drawProviders();

  if (!auth.isConfigured()) {
    show('signin', { noFocus: true });
    message('Accounts are not configured on this deployment yet.');
    return;
  }

  const url = new URL(location.href);
  const q = url.searchParams;
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const mode = q.get('mode') || '';

  /* 1. Something came back with an error (expired link, cancelled Google). */
  const err = q.get('error_description') || hash.get('error_description');
  if (err) {
    const code = q.get('error_code') || hash.get('error_code') || '';
    history.replaceState(null, '', location.pathname + location.search);
    cleanUrl(false);
    const expiredLink = /otp_expired|expired/i.test(code + err);
    show(mode === 'reset' ? 'forgot' : 'signin', { noFocus: true });
    message(expiredLink
      ? 'That link has expired or was already used. Ask for a new one below.'
      : decodeURIComponent(err.replace(/\+/g, ' ')));
    return;
  }

  /* 2. OAuth (or a PKCE email link) came back with ?code=. */
  const code = q.get('code');
  if (code) {
    show('signin', { noFocus: true });
    message('Signing you in…', 'ok');
    try {
      await auth.exchangeCode(code);
      cleanUrl(mode === 'reset');
      if (mode === 'reset') { afterPassword = 'leave'; openNewPassword(); }
      else finish();
    } catch (e) {
      cleanUrl(false);
      message(e.message);
    }
    return;
  }

  /* 3. An emailed link came back with the session in the hash. */
  if (hash.get('access_token')) {
    show('signin', { noFocus: true });
    message('Signing you in…', 'ok');
    try {
      await auth.adoptTokens({
        access_token: hash.get('access_token'),
        refresh_token: hash.get('refresh_token'),
        expires_at: hash.get('expires_at'),
        expires_in: hash.get('expires_in')
      });
      history.replaceState(null, '', location.pathname + location.search);
      if (hash.get('type') === 'recovery' || mode === 'reset') {
        cleanUrl(false);
        afterPassword = 'leave';
        openNewPassword();
      } else {
        cleanUrl(false);
        finish();
      }
    } catch (e) {
      message(e.message);
    }
    return;
  }

  /* 4. Signed in already. */
  if (auth.getSession()) {
    if (mode === 'password') {
      afterPassword = 'leave';
      openNewPassword({
        title: 'Change your password',
        deck: auth.getUser() && auth.getUser().provider !== 'email'
          ? 'Add a password so you can also sign in with your email.'
          : 'Choose a new password for ' + auth.getEmail() + '.'
      });
      return;
    }
    await auth.loadProfile();
    if (auth.getSession()) return finish();
  }

  /* 5. A fresh visit. */
  if (mode === 'password') {
    show('signin', { noFocus: true });
    message('Sign in first, then you can change your password. Forgot it? Use "Forgot password?".', 'ok');
    return;
  }
  const opening = { signup: 'signup', otp: 'otp', forgot: 'forgot', reset: 'forgot' }[mode] || 'signin';
  show(opening);
}

boot();
