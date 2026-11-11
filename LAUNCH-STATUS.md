# Launch status — 11 Nov 2026

Branch **`launch`** holds everything below. `main` (what is live) does not have
the payment work yet.

## Done

**Polar (live account, organisation "Nullrift")**
- Products: NULLRIFT Monthly $7/mo (`04f2017c-a6c4-4f62-a366-a4a6b2482cf9`),
  NULLRIFT Pro $89.99 (`30efbd51-8aa5-463a-9220-b762d50bea8c`),
  NULLRIFT Team $149.99 (`889d6362-b168-4c7a-a7df-39be0d344886`),
  NULLRIFT Founding 100 $200 (`140dd619-7ff6-498e-a7cd-7912191f130a`).
- One checkout link each ("Site - …"), returning to
  `https://nullrift-v-1.vercel.app/gallery.html?checkout_id={CHECKOUT_ID}`.
  Links are in `public/js/gallery/index.js` (CHECKOUT, OFFER.url).
- Webhook "NULLRIFT site - grant access" → `https://nullrift-v-1.vercel.app/api/payment-webhook`,
  Raw, API 2026-10, events: order.paid, order.refunded, subscription.* (11).
- The old "Pro $10" product and its link were left untouched (no orders). Archive it if unused.

**Supabase (live)**
- Payment tables and functions applied (entitlements, pending_entitlements,
  unlocks, prompt_access, grant/expire_entitlement). 17-case test passed and was rolled back.
- Site URL → `https://nullrift-v-1.vercel.app` (was localhost:8080).
- Redirect URLs added: live site, Vercel previews, www.nullrift.design, nullrift.design, localhost:8080.
- Minimum password length 8.
- Email templates: **Reset password** and **Confirm sign up** now contain the code (`{{ .Token }}`) and link.

**Vercel `nullrift-v-1`**: SUPABASE_URL, SUPABASE_ANON_KEY (fixed: were blank), POLAR_PRODUCT_TIERS.

**Site (branch `launch`)**: Polar checkout links, payment-received banner after checkout,
plan shown in the account menu.

## You must do (secrets — I never handle these)

1. Vercel → nullrift-v-1 → Settings → Environment Variables → add for Production + Preview, tick Sensitive:
   - `POLAR_WEBHOOK_SECRET` = Polar → Settings → Webhooks → "NULLRIFT site - grant access" → Copy Secret
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase → Project Settings → API Keys → secret key
2. Polar → Finance → Account → **Verify your identity** (needed for payouts). Also check the
   payout account: it was "connected by another member" — make sure that is you / someone you trust.
3. Then merge `launch` into `main` and push (or ask me). **Not before step 1**: `launch` requires
   payment for prompts, and without the two secrets a buyer's payment would not unlock anything.

## Still to do (I was stopped by the usage limit — resumes after ~17:40 UTC)

- Supabase **Magic link** email template: check it contains the code; paste
  `email-templates/magic-link.html` if not (subject "Your NULLRIFT sign-in code").
- Add the **WOBL** and **AUTOCARS** templates (TPL.03, TPL.04) like HADAL.
- Full audit + bug pass, then push `launch` for a Vercel preview.
- Google sign-in needs your Google Cloud OAuth client (SETUP.md §5).
- When nullrift.design points to Vercel: update the 4 Polar success/return URLs and the
  webhook URL, and the Supabase Site URL.
