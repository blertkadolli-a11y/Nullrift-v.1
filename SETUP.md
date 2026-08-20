# Going live — accounts and the prompt gate

The prompt bodies are no longer shipped to the browser. They live in
`api/_data/prompt-bodies.mjs`, outside `public/`, and are released one at a time
by `api/prompt.mjs` only to a request carrying a valid session.

Nothing below is optional: until Supabase is configured, `/api/prompt` returns
**503** and every prompt stays locked. That is deliberate — a misconfigured
server fails closed rather than handing out the product.

## Status

Project `ehkhrlecjhyghzmeoakf` is **connected and verified**:

- `public/js/gallery/auth.js` — filled in
- `.env` — filled in (gitignored)
- `/api/prompt` returns 401 to anonymous callers and rejects forged tokens
  against the real project

Still outstanding: the Vercel environment variables (below) and, only when the
paywall is switched on, the `entitlements` table.

## Vercel environment variables — REQUIRED before deploying

`.env` is local only. On **project `nullrift2-0`** (the one serving
nullrift2-0.vercel.app — not `nullrift` or `nullrift-y9zj`):

Settings → Environment Variables →

    SUPABASE_URL         https://ehkhrlecjhyghzmeoakf.supabase.co
    SUPABASE_ANON_KEY    sb_publishable_...

Without these, the deployed `/api/prompt` returns **503** and every prompt stays
locked. It fails closed, so nothing leaks — but nothing works either.

Also confirm Settings → Build & Deployment → **Output Directory** is empty or
`public`. The static files moved into `public/` and `api/` must stay outside it.

## Sign-in is passwordless — one email template edit REQUIRED

Sign-in happens on `/auth.html`: you type an email, Supabase sends a six-digit
code, you type it in. No passwords, and no "confirm your address then come back
and sign in" round trip — receiving the code *is* the proof the address works.

A code rather than a magic link on purpose: a link has to return to an
allow-listed redirect URL, which means separate configuration for localhost and
for the deployed site, and a link opened in the wrong browser is dead. A code is
typed into the tab that is already open.

**Supabase's default template emails a link, not a code.** Until you change it,
people will receive a link and have nothing to type. Fix it once:

1. Supabase → **Authentication** → **Emails** (or Email Templates).
2. Open the **Magic Link** template.
3. Make sure the body contains `{{ .Token }}` — that is the six-digit code.
   Keeping `{{ .ConfirmationURL }}` as well is fine; then either works.

Something like:

```html
<h2>Your NULLRIFT sign-in code</h2>
<p>Enter this code to sign in:</p>
<p style="font-size:28px;letter-spacing:6px;"><strong>{{ .Token }}</strong></p>
<p>It expires in an hour. If you didn't ask for it, ignore this email.</p>
```

Supabase's built-in mailer is rate-limited on the free tier — a handful of
emails per hour. For real traffic, attach your own SMTP under
Authentication → Emails.

## Run the setup SQL — REQUIRED

Everything below (usernames, profile pictures, and later the paywall) needs
tables that do not exist yet. They are all in one file: **`supabase-setup.sql`**
in the project folder.

1. Open **supabase.com/dashboard** and pick the project (`ehkhrlecjhyghzmeoakf`).
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `supabase-setup.sql`, copy all of it, paste, press **Run** (Cmd+Enter).
4. You should see **"Success. No rows returned."** That is what success looks
   like for this kind of statement — it is not an error message.

Safe to run twice; every statement is if-not-exists / drop-if-exists.

What it creates:

- `profiles` — username + chosen picture, with row-level security so each
  account can only read and change its own row
- a trigger that writes the profile row at sign-up (needed because email
  confirmation is on, so the browser has no session at that moment)
- `entitlements` — unused until the paywall, created now to save a second trip
- storage policies for avatar uploads

### Then, only if you want custom uploads

Left sidebar → **Storage** → **New bucket** → name it exactly `avatars` →
turn **Public bucket** ON → Create.

Skip this if the six built-in pictures are enough. Everything else works
without it; "Upload a picture…" will simply report that the bucket is missing.

## Turning the paywall on

Today anyone signed in can read the prompts, because nothing can take money
yet. The `entitlements` table already exists from the setup SQL. When checkout
is live:

1. Give each buyer a row: `insert into entitlements (user_id, tier) values
   ('<their-uuid>', 'pro');`
2. In `api/prompt.mjs`, set `REQUIRE_PAID = true`.

That is the whole change. Signed-in users without a row then get **402**, which
the panel turns into a "See pricing" button instead of a "Sign in" button.

Both branches are already tested — see the verification notes in the commit.

## Running it locally

```bash
node dev-server.mjs
```

Serves `public/` **and** runs `api/*.js`, with no packages to install. It reads
`.env` the same way Vercel reads its environment variables, so what works here
works deployed. `Open NULLRIFT.command` now uses it too.

## What is still public, on purpose

`public/js/gallery/prompts.js` holds each exhibit's title, tech, use-case and
filename — all of it already visible on the cards. There are no prompt bodies
in it. Verify any time with:

```bash
curl -s http://localhost:8080/js/gallery/prompts.js | grep -c "Build a production-ready"
```

`0` is the answer you want.
