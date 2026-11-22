/* ==========================================================================
   GET /api/keepalive  → { ok: true } when the database answered

   Supabase pauses a Free-plan project after a week with no database
   activity, and a paused project means nobody can sign in. Vercel's cron
   (vercel.json → "crons") calls this once a day so that never happens.

   It reads one row of `entitlements` as an anonymous visitor. Row-level
   security hands back an empty list, so nothing is exposed, but the query
   still reaches Postgres, which is what counts as activity. Safe for anyone
   to call; it changes nothing.
   ========================================================================== */

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: 'supabase_unconfigured' }));
    return;
  }

  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/entitlements?select=user_id&limit=1', {
      headers: { apikey: SUPABASE_ANON_KEY }
    });
    res.statusCode = r.ok ? 200 : 502;
    res.end(JSON.stringify({ ok: r.ok, status: r.status }));
  } catch (err) {
    console.error('keepalive: database unreachable', err);
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, error: 'unreachable' }));
  }
}
