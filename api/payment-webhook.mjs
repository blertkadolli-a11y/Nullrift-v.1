/* ==========================================================================
   POST /api/payment-webhook

   Polar calls this when money moves. It is the only thing that writes to
   `entitlements`, and it does so through two database functions
   (grant_entitlement / expire_entitlement in supabase-setup.sql) that hold
   all the rules about which plan wins and which news is stale.

     1. Is this really Polar? — Standard Webhooks signature over the raw body,
                                checked against POLAR_WEBHOOK_SECRET, with a
                                5-minute replay window.
     2. Which plan?           — the product id, looked up in
                                POLAR_PRODUCT_TIERS ("prod_id=pro,...").
     3. Which account?        — the NULLRIFT user id the checkout link carried
                                as reference_id; else the customer's external
                                id; else their email (matched in the database).
     4. Grant or expire.

   Events used:
     order.paid             one-time products (Pro, Team, the founding offer)
     order.refunded         full refund of a one-time order → access ends
     subscription.*         Monthly: active → access to the period end;
                            canceled / unpaid / revoked → access ends

   Anything Polar sends that we do not act on gets a 202, so Polar does not
   retry it. Anything we should have acted on but could not (bad config, the
   database unreachable) gets a 5xx, so it shows as failed in Polar's delivery
   log and can be redelivered once fixed — a buyer who paid must never be
   silently dropped.

   Zero dependencies, like api/prompt.mjs.
   ========================================================================== */

import { createHmac, timingSafeEqual } from 'node:crypto';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
/* Server-only. Never under public/, never NEXT_PUBLIC_*. */
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || '';

const TIERS = new Set(['monthly', 'pro', 'team']);
const PRODUCT_TIERS = parseTiers(process.env.POLAR_PRODUCT_TIERS || '');
const TOLERANCE_S = 5 * 60;
const MAX_BODY = 1024 * 1024;
/* A renewal webhook can land minutes after the period ends. Without a grace,
   every paying subscriber is locked out for that gap once a month. */
const RENEWAL_GRACE_MS = 2 * 24 * 60 * 60 * 1000;

/* "prod_a=monthly, prod_b=pro" → Map. Unknown tiers are dropped loudly. */
function parseTiers(raw) {
  const map = new Map();
  for (const pair of raw.split(/[,\n]/)) {
    const [id, tier] = pair.split('=').map((s) => (s || '').trim());
    if (!id || !tier) continue;
    if (!TIERS.has(tier)) {
      console.error('payment-webhook: POLAR_PRODUCT_TIERS has unknown tier "' + tier + '" for ' + id);
      continue;
    }
    map.set(id, tier);
  }
  return map;
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

/* The signature is over the exact bytes Polar sent, so the body must be read
   raw. Vercel only parses req.body when something reads it; this never does. */
function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('too_large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/* Standard Webhooks: base64(HMAC-SHA256(key, id + "." + timestamp + "." + body)),
   sent as one or more space-separated "v1,<sig>" in webhook-signature.

   Which key depends on when the Polar secret was made. Secrets from
   8 Sep 2026 on are Standard Webhooks secrets (key = base64-decoded part after
   "whsec_"); older ones are keyed on the UTF-8 bytes of the whole string.
   Polar's own SDK tries both, so this does too. */
function signingKeys(secret) {
  const keys = [Buffer.from(secret, 'utf8')];
  if (secret.startsWith('whsec_')) {
    const decoded = Buffer.from(secret.slice(6), 'base64');
    if (decoded.length) keys.unshift(decoded);
  }
  return keys;
}

export function verifySignature(raw, headers, secret, nowS = Math.floor(Date.now() / 1000)) {
  const id = headers['webhook-id'];
  const ts = headers['webhook-timestamp'];
  const sigHeader = headers['webhook-signature'];
  if (!id || !ts || !sigHeader || !secret) return false;

  const t = Number(ts);
  if (!Number.isFinite(t) || Math.abs(nowS - t) > TOLERANCE_S) return false;

  const given = String(sigHeader).split(' ')
    .map((part) => part.split(','))
    .filter(([v, sig]) => v === 'v1' && sig)
    .map(([, sig]) => Buffer.from(sig, 'base64'));
  if (!given.length) return false;

  const signed = Buffer.concat([Buffer.from(id + '.' + ts + '.', 'utf8'), raw]);
  for (const key of signingKeys(secret)) {
    const expected = createHmac('sha256', key).update(signed).digest();
    for (const g of given) {
      if (g.length === expected.length && timingSafeEqual(g, expected)) return true;
    }
  }
  return false;
}

/* PostgREST RPC with the service key. New-style sb_secret_ keys are not JWTs
   and go in apikey only; a legacy service_role JWT goes in both headers. */
async function rpc(fn, args) {
  const headers = { 'Content-Type': 'application/json', apikey: SERVICE_KEY };
  if (SERVICE_KEY.startsWith('eyJ')) headers.Authorization = 'Bearer ' + SERVICE_KEY;
  const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
    method: 'POST', headers, body: JSON.stringify(args)
  });
  const text = await r.text();
  if (!r.ok) throw new Error(fn + ' → ' + r.status + ' ' + text.slice(0, 300));
  try { return JSON.parse(text); } catch (err) { return text; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* The checkout link carries ?reference_id=<supabase user id>, which Polar
   copies into the checkout's metadata and on to the order / subscription. */
function userHint(data) {
  const candidates = [
    data.metadata && data.metadata.reference_id,
    data.customer && data.customer.external_id
  ];
  for (const c of candidates) if (typeof c === 'string' && UUID.test(c)) return c;
  return null;
}

function tierFor(data) {
  const productId = data.product_id || (data.product && data.product.id);
  return productId ? PRODUCT_TIERS.get(productId) || null : null;
}

function iso(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* Returns [status, payload]. Exported so it can be exercised without HTTP. */
export async function handleEvent(event) {
  const type = event && event.type;
  const data = (event && event.data) || {};
  const eventAt = iso(data.modified_at) || iso(event.timestamp) || iso(data.created_at);

  if (type === 'order.paid') {
    /* A subscription's orders are covered by its subscription.* events. */
    if (data.subscription_id) return [202, { ignored: 'subscription_order' }];
    const tier = tierFor(data);
    if (!tier) return unmapped(data);
    const out = await rpc('grant_entitlement', {
      p_user: userHint(data),
      p_email: data.customer && data.customer.email,
      p_tier: tier,
      p_expires_at: null,
      p_period_start: null,
      p_period_end: null,
      p_source: 'order:' + data.id,
      p_event_at: eventAt
    });
    return [200, { ok: true, type, out }];
  }

  if (type === 'order.refunded') {
    if (data.subscription_id) return [202, { ignored: 'subscription_order' }];
    /* A partial refund is a goodwill credit, not a return of the product. */
    if (data.status !== 'refunded') return [202, { ignored: 'partial_refund' }];
    const n = await rpc('expire_entitlement', { p_source: 'order:' + data.id, p_event_at: eventAt });
    return [200, { ok: true, type, expired: n }];
  }

  if (typeof type === 'string' && type.startsWith('subscription.')) {
    const tier = tierFor(data);
    if (!tier) return unmapped(data);
    const source = 'sub:' + data.id;
    const status = data.status;

    /* Revoked means the period is over; whatever status it reports, it ends. */
    if (type === 'subscription.revoked' ||
        ['canceled', 'unpaid', 'incomplete_expired', 'paused'].includes(status)) {
      const n = await rpc('expire_entitlement', { p_source: source, p_event_at: eventAt });
      return [200, { ok: true, type, expired: n }];
    }

    if (status === 'active' || status === 'trialing') {
      const end = iso(data.current_period_end);
      /* Cancelled-at-period-end means it will not renew: end exactly there. */
      const expires = end
        ? new Date(new Date(end).getTime() + (data.cancel_at_period_end ? 0 : RENEWAL_GRACE_MS)).toISOString()
        : null;
      const out = await rpc('grant_entitlement', {
        p_user: userHint(data),
        p_email: data.customer && data.customer.email,
        p_tier: tier,
        p_expires_at: expires,
        p_period_start: iso(data.current_period_start),
        p_period_end: end,
        p_source: source,
        p_event_at: eventAt
      });
      return [200, { ok: true, type, out }];
    }

    /* past_due: the renewal is being retried. The row's own expires_at (period
       end + grace) is what keeps or ends access meanwhile. incomplete: no
       payment yet. Neither changes anything. */
    return [202, { ignored: 'status_' + status }];
  }

  return [202, { ignored: type || 'unknown' }];
}

/* A product we were not told about is a config gap on our side, not Polar's.
   5xx so it is visible and redeliverable after POLAR_PRODUCT_TIERS is fixed. */
function unmapped(data) {
  const productId = data.product_id || (data.product && data.product.id) || '(none)';
  console.error('payment-webhook: product ' + productId + ' is not in POLAR_PRODUCT_TIERS');
  return [500, { error: 'unmapped_product', product_id: productId }];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });

  if (!WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_KEY) {
    console.error('payment-webhook: POLAR_WEBHOOK_SECRET, SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    return send(res, 503, { error: 'payments_unconfigured' });
  }

  let raw;
  try {
    raw = await readRaw(req);
  } catch (err) {
    return send(res, 413, { error: 'too_large' });
  }

  if (!verifySignature(raw, req.headers, WEBHOOK_SECRET)) {
    return send(res, 403, { error: 'bad_signature' });
  }

  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    return send(res, 400, { error: 'bad_json' });
  }

  try {
    const [status, payload] = await handleEvent(event);
    if (status >= 500) console.error('payment-webhook: ' + event.type + ' failed', payload);
    else console.log('payment-webhook: ' + event.type + ' ' + JSON.stringify(payload));
    return send(res, status, payload);
  } catch (err) {
    console.error('payment-webhook: ' + (event && event.type) + ' threw: ' + err.message);
    return send(res, 500, { error: 'handler_failed' });
  }
}
