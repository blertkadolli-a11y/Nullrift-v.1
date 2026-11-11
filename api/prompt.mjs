/* ==========================================================================
   GET  /api/prompt?id=NN   → the prompt body, or why not
   POST /api/prompt?id=NN   → same, but a Monthly subscriber spends one of the
                              month's 3 unlocks on it if it is not open yet

   The only way a prompt body reaches a browser. Two gates, in order:

     1. Who are you?   — the Authorization bearer token is handed to Supabase,
                         which is the only thing that can say whether it is a
                         real, unexpired session. We never parse the JWT
                         ourselves; a token you decode without verifying is a
                         token an attacker writes for you.
     2. Have you paid? — the database function prompt_access() answers, as the
                         visitor (their own token), from `entitlements` and
                         `unlocks`. Pro and Team open everything; Monthly opens
                         what was unlocked this subscription, 3 new ones per
                         billing month. Rows are written by
                         api/payment-webhook.mjs when Polar reports a payment.

   Failure codes the client turns into different exits:
     401 sign_in_required
     402 payment_required            → "See pricing"
     402 unlock_required (+remaining) → "Unlock this one"  (POST to spend)
     402 allowance_spent (+refills_at)→ "Refills on …"

   Runs on Vercel Functions with zero dependencies — Node 18+ has fetch, and
   Supabase speaks plain REST.
   ========================================================================== */

import { getBody, releasedAt } from './_data/prompt-bodies.mjs';

/* Pro and Team include every system released in the 12 months after the
   purchase; what is already theirs stays theirs. */
const NEW_RELEASES_FOR_MS = 365 * 24 * 60 * 60 * 1000;

/* true = sign-in is not enough, a plan is required. Needs the payments block of
   supabase-setup.sql applied; without it every prompt fails closed (503). */
const REQUIRE_PAID = true;

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

/* Ask the database whether this visitor may read this prompt, as the visitor:
   the caller's own token goes through, so auth.uid() inside the function is
   them and nobody else. This endpoint never holds the service-role key, so a
   bug here cannot read or grant another account's access. */
async function resolveAccess(token, promptId, unlock) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/prompt_access', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_prompt_id: promptId, p_unlock: !!unlock })
  });
  if (r.status === 404) return { status: 'unconfigured' };
  if (!r.ok) throw new Error('prompt_access ' + r.status);
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return send(res, 405, { error: 'method_not_allowed' });
  }

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

  const key = String(id).padStart(2, '0');

  if (REQUIRE_PAID) {
    let access;
    try {
      access = await resolveAccess(token, key, req.method === 'POST');
    } catch (err) {
      return send(res, 502, { error: 'auth_unreachable' });
    }
    const st = access && access.status;
    if (st === 'unconfigured') {
      return send(res, 503, {
        error: 'payments_unconfigured',
        message: 'prompt_access() is missing: apply the payments block of supabase-setup.sql.'
      });
    }
    if (st === 'sign_in_required') return send(res, 401, { error: 'sign_in_required' });
    /* 402 is the signal the client turns into "go to pricing" (or "unlock")
       rather than "sign in again" — the dead ends need different exits. */
    if (st === 'unlock_available') {
      return send(res, 402, {
        error: 'unlock_required',
        remaining: access.remaining,
        allowance: access.allowance,
        refills_at: access.refills_at || null
      });
    }
    if (st === 'allowance_spent') {
      return send(res, 402, {
        error: 'allowance_spent',
        allowance: access.allowance,
        refills_at: access.refills_at || null
      });
    }
    if (st !== 'unlocked') return send(res, 402, { error: 'payment_required' });

    if ((access.tier === 'pro' || access.tier === 'team') && access.granted_at) {
      const granted = new Date(access.granted_at).getTime();
      if (Number.isFinite(granted) && releasedAt(key).getTime() > granted + NEW_RELEASES_FOR_MS) {
        return send(res, 402, { error: 'outside_plan_year', tier: access.tier });
      }
    }

    return send(res, 200, {
      id: key,
      body,
      tier: access.tier || null,
      remaining: typeof access.remaining === 'number' ? access.remaining : null
    });
  }

  return send(res, 200, { id: key, body });
}
