/* ==========================================================================
   NULLRIFT — accounts

   Supabase Auth over plain fetch. No SDK, because the whole site's premise is
   that you can read it top to bottom with no build step.

   Ways in, all ending in the same session object:
     - email + password (sign in / create account)
     - Google, Apple, GitHub … (OAuth, PKCE)
     - a one-time code emailed to you (passwordless)
   plus "forgot password" (code or link) and "set a new password".

   The URL and anon key below are PUBLIC values by design — the anon key is
   safe in client code, it only grants what row-level security allows. The
   service-role key must never appear in this directory.

   What this module does NOT do: decide whether you may read a prompt. It only
   proves who you are. That decision lives in api/prompt.mjs, on the server.
   ========================================================================== */

export const SUPABASE_URL = 'https://ehkhrlecjhyghzmeoakf.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_6Gph6ewu8_ccR8S1Uus7rQ_pH_CqQoT';

const STORE_KEY = 'nr-session';
const PKCE_KEY = 'nr-pkce';
const listeners = new Set();

let session = null;

export function isConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/* ------------------------------------------------------------- session io

   "Keep me signed in" decides the store: localStorage survives closing the
   browser, sessionStorage ends with the tab. Either way the refresh token
   keeps the session alive while it is in use, so nobody is signed out in the
   middle of reading. */

function store(remember) {
  try { return remember ? window.localStorage : window.sessionStorage; }
  catch (err) { return null; }
}

function load() {
  for (const remember of [true, false]) {
    try {
      const raw = store(remember) && store(remember).getItem(STORE_KEY);
      if (!raw) continue;
      const s = JSON.parse(raw);
      if (s && s.access_token) { s.remember = remember; return s; }
    } catch (err) { /* corrupt or blocked — try the other store */ }
  }
  return null;
}

function save(next) {
  session = next;
  [true, false].forEach((remember) => {
    try {
      const st = store(remember);
      if (!st) return;
      if (next && !!next.remember === remember) st.setItem(STORE_KEY, JSON.stringify(next));
      else st.removeItem(STORE_KEY);
    } catch (err) { /* private mode — the session just will not persist */ }
  });
  listeners.forEach((fn) => fn(next));
}

session = load();

export function getSession() { return session; }
export function getEmail() { return session && session.user ? session.user.email : ''; }
export function getUser() { return session ? session.user : null; }
export function onChange(fn) { listeners.add(fn); fn(session); return () => listeners.delete(fn); }

/* Refresh slightly early so a click never lands on a token that expired in
   flight. */
function expired(s) {
  if (!s || !s.expires_at) return false;
  return Date.now() > (s.expires_at * 1000) - 60000;
}

class AuthError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code || '';
  }
}

/* Supabase's own wording is written for developers. These are the ones a
   visitor actually meets, said plainly. */
const FRIENDLY = {
  invalid_credentials: 'That email and password do not match. Check both, or reset your password.',
  email_not_confirmed: 'Confirm your email first — we sent you a code when you signed up.',
  user_already_exists: 'An account with that email already exists. Sign in instead.',
  email_exists: 'An account with that email already exists. Sign in instead.',
  weak_password: 'Choose a stronger password: at least 8 characters, not a common one.',
  same_password: 'That is already your password. Choose a different one.',
  otp_expired: 'That code has expired or was already used. Ask for a new one.',
  over_email_send_rate_limit: 'Too many emails in a short time. Wait a minute and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
  signup_disabled: 'New accounts are closed right now.',
  provider_disabled: 'That sign-in method is not switched on yet.',
  validation_failed: 'Check the email address and try again.',
  bad_code_verifier: 'That sign-in link was opened in a different browser. Start again here.',
  flow_state_not_found: 'That sign-in took too long or was already used. Start again.',
  flow_state_expired: 'That sign-in took too long or was already used. Start again.'
};

async function call(method, path, payload, token) {
  let r;
  try {
    r = await fetch(SUPABASE_URL + '/auth/v1/' + path, {
      method,
      headers: Object.assign(
        { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        token ? { Authorization: 'Bearer ' + token } : {}
      ),
      body: payload ? JSON.stringify(payload) : undefined
    });
  } catch (err) {
    throw new AuthError('Could not reach the server. Check your connection and try again.', 0, 'network');
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const code = data.error_code || data.code || data.error || '';
    const raw = data.error_description || data.msg || data.message || 'Something went wrong.';
    throw new AuthError(FRIENDLY[code] || raw, r.status, code);
  }
  return data;
}

const post = (path, payload, token) => call('POST', path, payload, token);

function slimUser(u) {
  if (!u || !u.id) return null;
  return {
    id: u.id,
    email: u.email,
    provider: (u.app_metadata && u.app_metadata.provider) || 'email',
    name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || ''
  };
}

function adopt(data, remember) {
  if (!data || !data.access_token) return null;
  const keep = remember == null ? (session ? !!session.remember : true) : !!remember;
  save({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || (data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined),
    user: slimUser(data.user) || (session && session.user) || null,
    remember: keep
  });
  return session;
}

let refreshing = null;

async function refresh() {
  if (!session || !session.refresh_token) return null;
  /* One refresh at a time. Refresh tokens are single-use, so two parallel
     refreshes would have the second one revoke the session. */
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      return adopt(await post('token?grant_type=refresh_token', {
        refresh_token: session.refresh_token
      }));
    } catch (err) {
      /* Only a rejected token ends the session. Being offline does not —
         signing someone out because their wifi blinked is a bug. */
      if (err.status >= 400 && err.status < 500) save(null);
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/* The one function the rest of the app needs: a token that is good right now,
   or null. */
export async function getAccessToken() {
  if (!session) return null;
  if (expired(session)) await refresh();
  return session ? session.access_token : null;
}

/* Keep a long-open tab signed in: refresh when it comes back into view. */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && session && expired(session)) refresh();
  });
}

/* ------------------------------------------------------------ providers */

/* Which OAuth providers are switched on in the Supabase dashboard. The page
   only draws buttons for these, so a provider that is not configured yet
   never shows up as a button that fails. */
let providersCache = null;

export async function getProviders() {
  if (providersCache) return providersCache;
  try {
    const r = await fetch(SUPABASE_URL + '/auth/v1/settings', {
      headers: { apikey: SUPABASE_ANON_KEY }
    });
    const s = await r.json();
    const ext = (s && s.external) || {};
    providersCache = {
      oauth: Object.keys(ext).filter((k) => ext[k] === true && k !== 'email' && k !== 'phone' && k !== 'anonymous_users'),
      email: ext.email !== false,
      signupDisabled: !!s.disable_signup,
      autoconfirm: !!s.mailer_autoconfirm
    };
  } catch (err) {
    providersCache = { oauth: [], email: true, signupDisabled: false, autoconfirm: false };
  }
  return providersCache;
}

/* ------------------------------------------------------------------ PKCE */

function b64url(bytes) {
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function pkcePair() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: b64url(new Uint8Array(digest)) };
}

function stash(value) {
  try {
    if (value) localStorage.setItem(PKCE_KEY, JSON.stringify(value));
    else localStorage.removeItem(PKCE_KEY);
  } catch (err) { /* blocked storage: the exchange will report it */ }
}

function unstash() {
  try { return JSON.parse(localStorage.getItem(PKCE_KEY) || 'null'); }
  catch (err) { return null; }
}

/* Off to Google (or GitHub, Apple …). Comes back to `redirectTo` with
   ?code=…, which exchangeCode() turns into a session. */
export async function startOAuth(provider, redirectTo, remember) {
  const { verifier, challenge } = await pkcePair();
  stash({ verifier, remember: remember !== false, at: Date.now() });
  const q = new URLSearchParams({
    provider,
    redirect_to: redirectTo,
    code_challenge: challenge,
    code_challenge_method: 's256'
  });
  location.assign(SUPABASE_URL + '/auth/v1/authorize?' + q.toString());
}

export function hasPendingOAuth() {
  return !!unstash();
}

export async function exchangeCode(code) {
  const pending = unstash();
  stash(null);
  if (!pending || !pending.verifier) {
    throw new AuthError(FRIENDLY.bad_code_verifier, 400, 'bad_code_verifier');
  }
  const out = adopt(await post('token?grant_type=pkce', {
    auth_code: code,
    code_verifier: pending.verifier
  }), pending.remember);
  await loadProfile();
  return out;
}

/* --------------------------------------------------------------- actions */

export async function signIn(email, password, remember) {
  const out = adopt(await post('token?grant_type=password', { email, password }), remember);
  await loadProfile();
  return out;
}

/* Email confirmation is ON for this project, so sign-up normally returns no
   session: the visitor confirms with the code (or link) we email, and that is
   what signs them in. Username and picture ride along in user_metadata; a
   Postgres trigger writes the profile row when the account is created. */
export async function signUp(email, password, profile, redirectTo, remember) {
  const path = redirectTo ? 'signup?redirect_to=' + encodeURIComponent(redirectTo) : 'signup';
  const data = await post(path, {
    email,
    password,
    data: {
      username: (profile && profile.username) || '',
      avatar_preset: (profile && profile.avatar_preset) || 'a1'
    }
  });
  /* Supabase answers a sign-up for an address that already exists with a
     fake user that has no identities, so it does not reveal who has an
     account. Say the useful thing without confirming it either way. */
  if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { pending: true, maybeExisting: true };
  }
  if (!data.access_token) return { pending: true };
  adopt(data, remember);
  await loadProfile();
  return { pending: false };
}

export async function resendSignup(email, redirectTo) {
  const path = redirectTo ? 'resend?redirect_to=' + encodeURIComponent(redirectTo) : 'resend';
  await post(path, { type: 'signup', email });
}

/* Passwordless: email a one-time code. The same box serves sign-up and
   sign-in. */
export async function sendCode(email, redirectTo) {
  const path = redirectTo ? 'otp?redirect_to=' + encodeURIComponent(redirectTo) : 'otp';
  await post(path, { email, create_user: true });
}

/* `type` is 'email' for sign-in codes and sign-up confirmations, 'recovery'
   for a password reset. A recovery code signs you in too, so you can then set
   the new password. */
export async function verifyCode(email, token, type, remember) {
  let data;
  try {
    data = await post('verify', { email, token, type: type || 'email' });
  } catch (err) {
    /* Older projects only accept the specific type for sign-up codes. */
    if ((type || 'email') === 'email' && err.status === 403) {
      data = await post('verify', { email, token, type: 'signup' });
    } else {
      throw err;
    }
  }
  const out = adopt(data, remember);
  await loadProfile();
  return out;
}

/* Sends the "reset your password" email. It carries both a code and a link;
   either one lands the visitor on the "choose a new password" step. */
export async function requestPasswordReset(email, redirectTo) {
  const path = redirectTo ? 'recover?redirect_to=' + encodeURIComponent(redirectTo) : 'recover';
  await post(path, { email });
}

/* Needs a live session — after a recovery code/link, or from the account
   menu for someone already signed in. */
export async function updatePassword(password) {
  const token = await getAccessToken();
  if (!token) throw new AuthError('Your reset link has expired. Ask for a new one.', 401, 'no_session');
  const u = await call('PUT', 'user', { password }, token);
  if (u && u.id && session) save(Object.assign({}, session, { user: slimUser(u) }));
}

/* A link (rather than a code) comes back with the session in the URL hash.
   The hash carries no identity, so the user has to be fetched. */
export async function adoptTokens(t) {
  if (!t || !t.access_token) return null;
  let user = null;
  try {
    const r = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + t.access_token }
    });
    if (r.ok) user = await r.json();
  } catch (err) { /* fall through — a session without a cached user still works */ }

  adopt({
    access_token: t.access_token,
    refresh_token: t.refresh_token || '',
    expires_at: Number(t.expires_at) || undefined,
    expires_in: Number(t.expires_in) || undefined,
    user
  }, true);
  await loadProfile();
  return session;
}

/* A profile the trigger auto-named ('user', 'user1', …) has never been through
   the setup step: a code sign-up carries no username to seed it. */
export function needsProfileSetup() {
  if (!session) return false;
  if (!profile || !profile.username) return true;
  return /^user\d*$/.test(profile.username);
}

export async function signOut() {
  const token = session && session.access_token;
  profile = null;
  save(null);
  if (!token) return;
  try {
    await fetch(SUPABASE_URL + '/auth/v1/logout', {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
    });
  } catch (err) { /* local session is already gone, which is what matters */ }
}


/* ==========================================================================
   PROFILE

   username + avatar. Read with the caller's own token so row-level security,
   not this file, decides what is visible. Cached in memory only — it is
   re-fetched on every sign-in, so a change made on another device shows up
   here rather than being pinned to whatever localStorage remembers.
   ========================================================================== */

let profile = null;

export function getProfile() { return profile; }

function restHeaders(token, extra) {
  const h = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json'
  };
  return Object.assign(h, extra || {});
}

export async function loadProfile() {
  const token = await getAccessToken();
  if (!token || !session.user) { profile = null; return null; }
  try {
    const r = await fetch(
      SUPABASE_URL + '/rest/v1/profiles?user_id=eq.' +
      encodeURIComponent(session.user.id) +
      '&select=username,avatar_preset,avatar_url&limit=1',
      { headers: restHeaders(token) }
    );
    if (!r.ok) { profile = null; return null; }
    const rows = await r.json();
    profile = Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (err) {
    /* No profiles table yet, or offline. The nav falls back to the email
       local-part rather than breaking. */
    profile = null;
  }
  listeners.forEach((fn) => fn(session));
  return profile;
}

/* The signed-in account's plan, read with its own token (row-level security
   only ever returns its own row). null = no plan, or it has expired. Only
   used for display — what a visitor may read is decided on the server. */
export async function loadEntitlement() {
  const token = await getAccessToken();
  if (!token || !session || !session.user) return null;
  try {
    const r = await fetch(
      SUPABASE_URL + '/rest/v1/entitlements?user_id=eq.' +
      encodeURIComponent(session.user.id) + '&select=tier,expires_at,period_end&limit=1',
      { headers: restHeaders(token) }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    const e = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!e) return null;
    if (e.expires_at && new Date(e.expires_at).getTime() <= Date.now()) return null;
    return e;
  } catch (err) {
    return null;
  }
}

export async function saveProfile(patch) {
  const token = await getAccessToken();
  if (!token || !session.user) throw new Error('Not signed in.');

  /* Upsert, not update. Accounts created before the profiles table existed
     have no row — the trigger only fires for new sign-ups — and a PATCH
     against a missing row silently touches nothing. POST with
     resolution=merge-duplicates inserts when absent and merges when present,
     so the two cases stop being different. */
  const body = Object.assign(
    {
      user_id: session.user.id,
      /* username is NOT NULL, so an insert has to carry one. Prefer what is
         already there; fall back to the email local-part. */
      username: (profile && profile.username) ||
        String(session.user.email || 'user').split('@')[0]
    },
    patch
  );

  const r = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
    method: 'POST',
    headers: restHeaders(token, {
      Prefer: 'resolution=merge-duplicates,return=representation'
    }),
    body: JSON.stringify(body)
  });

  const data = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = (data && (data.message || data.msg)) || 'Could not save your profile.';
    /* 23505 is the unique violation on username — say which field, not "error". */
    if (data && data.code === '23505') throw new Error('That username is taken.');
    if (data && data.code === '23514') throw new Error('Usernames are 2 to 32 characters.');
    throw new Error(msg);
  }

  /* PostgREST answers 200 with [] when nothing matched, which is what a
     row-level-security mismatch looks like from out here. Treating that as
     success is what made a failed save look like nothing happening at all. */
  if (!Array.isArray(data) || !data.length) {
    throw new Error('The server saved nothing. Check the profiles policies.');
  }
  profile = data[0];
  listeners.forEach((fn) => fn(session));
  return profile;
}

/* Custom avatars only work once signed in, because Storage writes are
   authorised by the session. That is why sign-up offers presets only. */
export async function uploadAvatar(file) {
  const token = await getAccessToken();
  if (!token || !session.user) throw new Error('Sign in first.');
  if (!/^image\//.test(file.type)) throw new Error('That file is not an image.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Images must be under 2 MB.');

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  /* Path is namespaced by user id so the Storage policy can allow a person to
     write only inside their own folder. */
  const path = session.user.id + '/avatar-' + Date.now() + '.' + ext;

  const up = await fetch(SUPABASE_URL + '/storage/v1/object/avatars/' + path, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + token,
      'Content-Type': file.type,
      'x-upsert': 'true'
    },
    body: file
  });
  if (!up.ok) {
    const e = await up.json().catch(() => ({}));
    throw new Error(e.message || 'Upload failed. Is the "avatars" bucket set up?');
  }

  const url = SUPABASE_URL + '/storage/v1/object/public/avatars/' + path;
  await saveProfile({ avatar_url: url });
  return url;
}
