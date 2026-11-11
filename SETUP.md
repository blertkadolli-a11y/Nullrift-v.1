# Going live — accounts, sign-in and the prompt gate

The prompt bodies are never shipped to the browser. They live in
`api/_data/prompt-bodies.mjs`, outside `public/`, and `api/prompt.mjs` releases
them one at a time, only to a request that has a valid session.

Live site: **Vercel project `nullrift-v-1`** (repo `Nullrift-v.1`, branch
`main`), served at `https://nullrift-v-1.vercel.app`. Supabase project:
**`nullrift2.0`** (`ehkhrlecjhyghzmeoakf`, EU West / Ireland).

---

## Already done (in code and in the live database)

**Sign-in page (`/auth.html`)**
- Email + password sign-in, with "Keep me signed in". Off = the session ends
  when the tab closes.
- Create account: username + email + password, confirmed with an emailed
  code (or the link in the same email).
- **Forgot password**: the email has a code and a link. Either one opens
  "Choose a new password".
- "Change password" in the account menu. People who joined with Google can
  use it to add a password.
- Passwordless "email me a sign-in code" is still there as an option.
- "Continue with Google / Apple / GitHub / Microsoft / Discord" buttons appear
  **automatically** for every provider you switch on in Supabase. None are
  on yet, so none show.
- Password managers: the fields use the standard `username`,
  `current-password` and `new-password` autocomplete names, so Chrome, Safari,
  1Password and others offer to save and fill passwords. Passwords
  themselves are only ever stored hashed by Supabase.
- Sessions refresh themselves. Going offline for a moment no longer signs
  anyone out.

**Database (applied to the live project)**
- `profiles` was missing its INSERT policy, so saving a username or picture
  failed. Fixed. The one existing account had no profile row; backfilled.
- The sign-up trigger now also fills the username and picture from Google /
  GitHub / Apple.
- `avatars` storage bucket created (public, 2 MB, images only). Each account
  can only write inside its own folder.
- Fixed both security warnings (the trigger function was callable over the
  API) and all three performance warnings on the row-level-security policies.
- `supabase-setup.sql` is the full schema. Everything above the
  "entitlements" block matches what is live; the payments block below it is
  **not applied yet** (section 7, step 1).

**Site**
- `privacy.html`, `terms.html`, `404.html`, `robots.txt`, link-preview tags.

---

## You need to do these before launch, in this order

### 1. Vercel environment variables — the live site is broken without them

Right now `https://nullrift-v-1.vercel.app/api/prompt` answers **503
"auth_unconfigured"**, so *every prompt is locked for everyone*. On Vercel →
project **`nullrift-v-1`** → Settings → Environment Variables, add these for
Production and Preview:

    SUPABASE_URL         https://ehkhrlecjhyghzmeoakf.supabase.co
    SUPABASE_ANON_KEY    sb_publishable_6Gph6ewu8_ccR8S1Uus7rQ_pH_CqQoT

Both are public values: the same ones are already in `public/js/gallery/auth.js`.
Then redeploy, because env var changes only apply to new deployments.

### 2. Supabase → Authentication → URL Configuration

- **Site URL**: your real domain, e.g. `https://nullrift.design` (or
  `https://nullrift-v-1.vercel.app` until the domain is connected).
- **Redirect URLs**: add every address the sign-in page can be on:

      https://nullrift.design/auth.html**
      https://nullrift-v-1.vercel.app/auth.html**
      http://localhost:8080/auth.html**

  The `**` matters: it allows the `?next=…&mode=reset` part of the address.
  Without these, Google sign-in, email links and password-reset links all land
  on the wrong page.

### 3. Supabase → Authentication → Sign In / Providers → Email

- **Confirm email**: ON (already on).
- **Minimum password length**: 8 (the site asks for 8; Supabase defaults to 6).
- **Leaked password protection**: ON if your plan has it. It blocks
  passwords that have appeared in data breaches. This is the last warning in
  Supabase's security advisor.
- **Email OTP length**: 6. **Email OTP expiry**: 3600 seconds.

### 4. Sending email (SMTP) and the three templates

Follow `SMTP-SETUP.md`. Without your own SMTP, Supabase sends only a few emails
per hour. That is not enough for a launch, and it won't let you edit the
templates, so people would get a link with no code. Paste the three files in
`email-templates/` (confirm sign-up, sign-in code, reset password).

### 5. Google sign-in

You have to do this step yourself, because it creates credentials in your
Google account.

1. **console.cloud.google.com** → create a project (e.g. "NULLRIFT").
2. **APIs & Services → OAuth consent screen**: External. App name
   `NULLRIFT`, your support email, logo optional. App domain: your site URL,
   with privacy policy `…/privacy.html` and terms `…/terms.html`. Scopes:
   only `email`, `profile`, `openid`. **Publish the app**, or only test users
   can sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorised JavaScript origins: `https://nullrift.design`,
     `https://nullrift-v-1.vercel.app`, `http://localhost:8080`
   - Authorised redirect URI (exactly this one):

         https://ehkhrlecjhyghzmeoakf.supabase.co/auth/v1/callback

4. Copy the **Client ID** and **Client secret**.
5. Supabase → Authentication → Sign In / Providers → **Google** → enable, paste
   both → Save.

Reload `/auth.html`. "Continue with Google" appears by itself.

### 6. Other providers (optional)

The page draws a button for each of these once it is enabled in Supabase, and
each uses the same callback URL as above:

- **GitHub**: github.com → Settings → Developer settings → OAuth Apps → New.
  Free, and five minutes. Recommended, since your buyers are developers.
- **Apple**: needs a paid Apple Developer account ($99/year).
- **Microsoft** (`azure`) and **Discord** also work.

### 7. Payments (Polar)

**What the code already does.** Every buy button is a Polar Checkout Link.
For a signed-in visitor the page adds their account to the link
(`reference_id` = their user id, `customer_email` = their email); a signed-out
visitor is sent through sign-in first and lands straight back in the same
checkout. When Polar reports the payment, `api/payment-webhook.mjs` checks
Polar's signature and writes the buyer's `entitlements` row. `api/prompt.mjs`
then gates on it (`REQUIRE_PAID = true`):

| Plan | Polar product | What it unlocks |
|---|---|---|
| Monthly $7/mo | recurring, monthly | Any **3 prompts per billing month**, each one stays open while subscribed. Ends at the end of the paid period after cancelling; immediately on a failed renewal or an immediate cancel. |
| Pro $89.99 | one-time | Everything, never expires. |
| Team $149.99 | one-time | Everything, never expires (one shared account). |
| Founding $200 | one-time | Same as Pro (the website build is arranged by email). |

A full refund of a one-time order ends its access. A partial refund does not.
Someone who pays with an email that has no NULLRIFT account yet is kept in
`pending_entitlements` and gets the plan the moment they sign up with that
email. A buyer who already has Pro and also subscribes to Monthly keeps Pro.

**Do these in order. Order matters: step 1 must be done before the site is
deployed, or every prompt answers 503.**

1. **Supabase → SQL Editor → New query**: paste the part of
   `supabase-setup.sql` from `-- --- entitlements: who has paid` down to (not
   including) `-- --- avatar uploads`, and Run. "Success. No rows returned."
   is success. It is safe to run twice.

2. **Polar: start in the sandbox** (`https://sandbox.polar.sh`, a separate
   test account, test card `4242 4242 4242 4242`, any future date, any CVC).
   Create an organization, then under **Products** create four products:
   - *NULLRIFT Monthly* — Recurring, monthly, $7
   - *NULLRIFT Pro* — One-time, $89.99
   - *NULLRIFT Team* — One-time, $149.99
   - *NULLRIFT Founding* — One-time, $200

   Copy each product's **ID** (a UUID, shown on the product and in its URL).

3. **Polar → Products → Checkout Links**: create one link per product.
   Set **Success URL** to
   `https://nullrift-v-1.vercel.app/gallery.html?checkout_id={CHECKOUT_ID}`.
   Copy each link's URL.

4. **Polar → Settings → Webhooks → Add Endpoint**
   - URL: `https://nullrift-v-1.vercel.app/api/payment-webhook`
   - Format: **Raw**
   - Events: `order.paid`, `order.refunded`, `subscription.created`,
     `subscription.active`, `subscription.updated`, `subscription.canceled`,
     `subscription.uncanceled`, `subscription.revoked`
   - Copy the secret (`whsec_…`).

5. **Vercel → `nullrift-v-1` → Settings → Environment Variables**: add these
   for Production and Preview, and tick **Sensitive**:

       SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API Keys →
                                  a secret key (sb_secret_…), or the legacy
                                  service_role key. Only the webhook reads it.
       POLAR_WEBHOOK_SECRET       the whsec_… from step 4
       POLAR_PRODUCT_TIERS        MONTHLY_ID=monthly,PRO_ID=pro,TEAM_ID=team,FOUNDING_ID=pro

   (`SUPABASE_URL` and `SUPABASE_ANON_KEY` from step 1 of this file are
   needed too.)

6. **`public/js/gallery/index.js`**, the COMMERCE CONFIG block: paste the
   checkout link URLs into `CHECKOUT.monthly`, `CHECKOUT.pro`,
   `CHECKOUT.team`, and the Founding one into `OFFER.url`. Commit and push;
   Vercel redeploys.

7. **Test it in the sandbox**, signed in as a test account:
   - Before buying, open any prompt: it must say *"This prompt is part of a
     paid tier"* with **See pricing**.
   - Buy Pro with the test card. In Polar → Settings → Webhooks → your
     endpoint, the delivery should show **200**. In Supabase:
     `select * from entitlements;` shows your row with `tier = pro`.
   - Reload the gallery and open a prompt: the body shows.
   - Refund the order in Polar: the row's `expires_at` is set and prompts lock
     again.
   - With a second test account, subscribe to Monthly: each prompt offers
     **Unlock this one (3 left)**; after three, the fourth says when the
     allowance refills.

   A delivery that shows **500** in Polar means something on our side needs
   fixing (usually a product missing from `POLAR_PRODUCT_TIERS`; the Vercel
   function log says which). Fix it, then press **Redeliver** in Polar; the
   buyer is not lost.

8. **Go live**: repeat steps 2–6 in the real Polar dashboard
   (`https://polar.sh`). Production has its own product ids, links and
   webhook secret, so all three env vars and all four URLs change.

**Granting access by hand** (Studio clients, comps, a support fix), in the
Supabase SQL Editor. It works whether or not that person has an account yet:

    select public.grant_entitlement(null, 'client@example.com', 'pro',
      null, null, null, 'manual:studio-client-name', now());

Take it away again with
`select public.expire_entitlement('manual:studio-client-name', now());`

**Studio booking** (`BOOKING` in the same config block) is a Cal.com link and
is not handled by Polar or the webhook.

**Testing the webhook locally**: put the three payment variables in `.env`,
run `node dev-server.mjs`, and point a Polar sandbox endpoint at it through a
tunnel (`cloudflared tunnel --url http://localhost:8080`).

### 8. Domain

`nullrift.design` is not connected to the `nullrift-v-1` Vercel project. Add it
under Vercel → Domains. Then update the Site URL (step 2) and the Google
origins (step 5).

### 9. Legal

`privacy.html` and `terms.html` are written from what the site actually does,
but they are a starting point, not legal advice. Polar is the merchant of
record (it charges the buyer and handles sales tax), so the pages should
name Polar where they say "our payment provider". Have them checked, and add
your legal name, country and governing law.

---

## Running it locally

```bash
node dev-server.mjs
```

Serves `public/` **and** runs `api/*.mjs`, with nothing to install. It reads
`.env` the same way Vercel reads its environment variables.

## What is still public, on purpose

`public/js/gallery/prompts.js` holds each card's title, tech, use-case and
filename, all of which are already visible on the cards. There are no prompt
bodies in it. Check any time with:

```bash
curl -s http://localhost:8080/js/gallery/prompts.js | grep -c "Build a production-ready"
```

`0` is the answer you want.
