/* ==========================================================================
   GET /api/prompt?id=NN

   The only way a prompt body reaches a browser. Two gates, in order:

     1. Who are you?   — the Authorization bearer token is handed to Supabase,
                         which is the only thing that can say whether it is a
                         real, unexpired session. We never parse the JWT
                         ourselves; a token you decode without verifying is a
                         token an attacker writes for you.
     2. Have you paid? — a row in `entitlements` for that user id.

   Gate 2 is currently OFF (REQUIRE_PAID below), because nothing on the site
   can take money yet. Sign-in alone is enough today. Flip it to true the day
   checkout goes live and the same endpoint starts enforcing payment with no
   other change.

   Runs on Vercel Functions with zero dependencies — Node 18+ has fetch, and
   Supabase speaks plain REST.
   ========================================================================== */

import { getBody } from './_data/prompt-bodies.mjs';

/* Flip to true once checkout is wired and buyers get an `entitlements` row. */
const REQUIRE_PAID = false;

/* NEXT_PUBLIC_* is accepted too: those are the names Supabase's own dashboard
   hands you, so a copy-paste into Vercel works without being renamed first. */
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  /* The whole point is that this response is per-session. Never let a shared
     cache hold one user's paid body and hand it to the next request. */
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

/* Ask Supabase who the bearer token belongs to. A 200 here is the only proof
   of identity we accept. */
async function resolveUser(token) {
  const r = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return null;
  const user = await r.json();
  return user && user.id ? user : null;
}

/* Read the caller's own entitlement row, using the caller's own token so
   Supabase row-level security is what enforces the boundary. This endpoint
   never holds the service-role key, so a bug here cannot leak another
   account's data. */
async function resolveTier(token, userId) {
  const url = SUPABASE_URL + '/rest/v1/entitlements'
    + '?user_id=eq.' + encodeURIComponent(userId)
    + '&select=tier&limit=1';
  const r = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) && rows.length ? rows[0].tier : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    /* Misconfigured server must fail closed. Returning the prompt because the
       env vars are missing would defeat the entire endpoint. */
    return send(res, 503, {
      error: 'auth_unconfigured',
      message: 'SUPABASE_URL and SUPABASE_ANON_KEY are not set on the server.'
    });
  }

  const id = new URL(req.url, 'http://localhost').searchParams.get('id');
  const body = getBody(id);
  if (!body) return send(res, 404, { error: 'unknown_prompt' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return send(res, 401, { error: 'sign_in_required' });

  let user;
  try {
    user = await resolveUser(token);
  } catch (err) {
    return send(res, 502, { error: 'auth_unreachable' });
  }
  if (!user) return send(res, 401, { error: 'sign_in_required' });

  if (REQUIRE_PAID) {
    let tier = null;
    try {
      tier = await resolveTier(token, user.id);
    } catch (err) {
      return send(res, 502, { error: 'auth_unreachable' });
    }
    /* 402 is the signal the client turns into "go to pricing" rather than
       "sign in again" — the two dead ends need different exits. */
    if (!tier) return send(res, 402, { error: 'payment_required' });
  }

  return send(res, 200, { id: String(id).padStart(2, '0'), body });
}
