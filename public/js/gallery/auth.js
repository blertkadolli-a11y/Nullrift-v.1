/* ==========================================================================
   NULLRIFT — accounts

   Supabase Auth over plain fetch. No SDK, because the whole site's premise is
   that you can read it top to bottom with no build step, and the three calls
   we need are three calls.

   The URL and anon key below are PUBLIC values by design — the anon key is
   safe in client code, it only grants what row-level security allows. The
   service-role key must never appear in this directory.

   What this module does NOT do: decide whether you may read a prompt. It only
   proves who you are. The decision lives in api/prompt.js, on the server,
   because anything decided here is decided on the attacker's machine.
   ========================================================================== */

export const SUPABASE_URL = 'https://ehkhrlecjhyghzmeoakf.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_6Gph6ewu8_ccR8S1Uus7rQ_pH_CqQoT';

const STORE_KEY = 'nr-session';
const listeners = new Set();

let session = null;

export function isConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/* ------------------------------------------------------------- session io */

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.access_token) return null;
    return s;
  } catch (err) {
    return null;
  }
}

function save(next) {
  session = next;
  try {
    if (next) localStorage.setItem(STORE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORE_KEY);
  } catch (err) { /* private mode — the session just will not persist */ }
  listeners.forEach((fn) => fn(next));
}

session = load();

export function getSession() { return session; }
export function getEmail() { return session && session.user ? session.user.email : ''; }
export function onChange(fn) { listeners.add(fn); fn(session); return () => listeners.delete(fn); }

/* Supabase access tokens are short-lived. Refresh slightly early so a click
   never lands on a token that expired in flight. */
function expired(s) {
  if (!s || !s.expires_at) return false;
  return Date.now() > (s.expires_at * 1000) - 30000;
}

async function post(path, payload) {
  const r = await fetch(SUPABASE_URL + '/auth/v1/' + path, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.error_description || data.msg || data.message || 'Something went wrong.';
    throw new Error(msg);
  }
  return data;
}

function adopt(data) {
  if (!data || !data.access_token) return null;
  save({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    user: data.user ? { id: data.user.id, email: data.user.email } : null
  });
  return session;
}

async function refresh() {
  if (!session || !session.refresh_token) return null;
  try {
    return adopt(await post('token?grant_type=refresh_token', {
      refresh_token: session.refresh_token
    }));
  } catch (err) {
    save(null);
    return null;
  }
}

/* The one function the rest of the app needs: a token that is good right now,
   or null. */
export async function getAccessToken() {
  if (!session) return null;
  if (expired(session)) await refresh();
  return session ? session.access_token : null;
}

/* --------------------------------------------------------------- actions */

/* ==========================================================================
   PASSWORDLESS

   A six-digit code rather than a magic link, deliberately. A link has to come
   back to an allow-listed redirect URL, which means separate configuration for
   localhost and for the deployed site, and a link that lands in the wrong
   browser is dead. A code is typed into whatever tab is already open, so the
   same flow works everywhere with no per-environment setup.
   ========================================================================== */

export async function sendCode(email, redirectTo) {
  /* create_user lets the same box serve sign-up and sign-in — there is no
     meaningful difference to the visitor, and asking them to pick is friction
     that exists only because of how the backend is built.

     redirect_to is what brings the emailed link back to this page rather than
     to the project's default Site URL. It must be listed under Supabase →
     Authentication → URL Configuration → Redirect URLs, or Supabase ignores it
     and the link lands somewhere useless. */
  const path = redirectTo
    ? 'otp?redirect_to=' + encodeURIComponent(redirectTo)
    : 'otp';
  await post(path, { email, create_user: true });
}

/* A magic link comes back with the session in the URL hash rather than as a
   code to type. Supported so a link still works if the email template has not
   been switched to send {{ .Token }}, or if someone's mail client eats the
   code. The hash carries no identity, so the user has to be fetched. */
export async function adoptTokens(t) {
  if (!t || !t.access_token) return null;
  let user = null;
  try {
    const r = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + t.access_token }
    });
    if (r.ok) user = await r.json();
  } catch (err) { /* fall through — a session without a cached user still works */ }

  save({
    access_token: t.access_token,
    refresh_token: t.refresh_token || '',
    expires_at: Number(t.expires_at) || undefined,
    user: user && user.id ? { id: user.id, email: user.email } : null
  });
  await loadProfile();
  return session;
}

export async function verifyCode(email, token) {
  const out = adopt(await post('verify', { email, token, type: 'email' }));
  await loadProfile();
  return out;
}

/* A profile the trigger auto-named ('user', 'user1', …) has never been through
   the setup step: an OTP sign-up carries no username metadata to seed it. */
export function needsProfileSetup() {
  if (!session) return false;
  if (!profile || !profile.username) return true;
  return /^user\d*$/.test(profile.username);
}

export async function signIn(email, password) {
  const out = adopt(await post('token?grant_type=password', { email, password }));
  await loadProfile();
  return out;
}

/* Username and avatar ride along in user_metadata rather than being written
   to a table here, because this project has email confirmation ON: sign-up
   returns no session, so the browser has no permission to insert anything.
   A Postgres trigger reads this metadata and materialises the profile row
   when the account is confirmed (see SETUP.md). */
export async function signUp(email, password, profile) {
  const data = await post('signup', {
    email,
    password,
    data: {
      username: (profile && profile.username) || '',
      avatar_preset: (profile && profile.avatar_preset) || 'a1'
    }
  });
  if (!data.access_token) return { pending: true };
  adopt(data);
  await loadProfile();
  return { pending: false };
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
