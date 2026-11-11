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
- `supabase-setup.sql` is the full schema, matching what is live.

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

### 7. Payments — nothing can be bought yet

- `CHECKOUT`, `BOOKING` and `OFFER.url` in `public/js/gallery/index.js` are
  all empty, so every buy button shows as disabled.
- Nothing writes a row into `entitlements` when someone pays. Until something
  does, `REQUIRE_PAID` in `api/prompt.mjs` has to stay `false`, which means
  **any signed-in account can read every prompt for free**.
- For a paid launch you need a payment-provider webhook (Stripe or Lemon
  Squeezy) that inserts the buyer's `entitlements` row, then set
  `REQUIRE_PAID = true`.

### 8. Domain

`nullrift.design` is not connected to the `nullrift-v-1` Vercel project. Add it
under Vercel → Domains. Then update the Site URL (step 2) and the Google
origins (step 5).

### 9. Legal

`privacy.html` and `terms.html` are written from what the site actually does,
but they are a starting point, not legal advice. Have them checked, and add
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
