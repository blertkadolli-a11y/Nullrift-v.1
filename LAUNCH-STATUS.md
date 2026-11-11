# Launch status — 11 Nov 2026

Everything is on branch **`launch`** (pushed; Vercel builds a preview of it).
`main`, which is what nullrift-v-1.vercel.app serves, does not have the
payment work yet. Merge `launch` into `main` only after step 1 below.

## What is done

**Templates shelf** — four templates, each with a live preview, fullscreen view
and a prompt released only through `/api/prompt`:
TPL.01 Oblique · TPL.02 HADAL · TPL.03 WOBL · TPL.04 AUTOCARS (Bodyline Coachworks).
WOBL and HADAL are Vite builds under `/wobl/` and `/hadal/`; AUTOCARS is a
static export of the Next.js project under `/autocars/` (its enquiry form
cannot send in a static preview and says so). How each was built is written at
the top of `public/js/gallery/1x-*.js`.

**Accounts** — email + password, create account with emailed code, forgot /
reset password, change password, passwordless code, "keep me signed in",
password-manager friendly. Google / Apple / GitHub buttons appear by
themselves once a provider is switched on in Supabase.

**Supabase (live project)**
- Payment tables and functions; 17 + 4 scenario tests passed and were rolled back.
- Site URL `https://nullrift-v-1.vercel.app`; redirect URLs for the live site,
  Vercel previews, nullrift.design (+ www) and localhost.
- Minimum password length 8.
- Email templates **Confirm sign up**, **Magic link or OTP** and **Reset
  password** all carry the 6-digit code and a link, in the NULLRIFT style.

**Polar (organisation "Nullrift", live)**
- Products: NULLRIFT Monthly $7/mo, Pro $89.99, Team $149.99, Founding 100 $200.
- One checkout link each ("Site - …"), wired into the buy buttons. Buyers come
  back to `gallery.html?checkout_id=…`, which confirms the payment and the plan.
- Webhook "NULLRIFT site - grant access" → `/api/payment-webhook`
  (API 2026-10, 12 events). Checked on the preview: it answers.

**Rules the code enforces** (matching the pricing copy and terms)
- Monthly: 3 new prompts per billing month; unlocked ones stay open while subscribed.
- Pro / Team: everything on the shelf, plus every prompt released in the 12
  months after purchase. **When you add a prompt, give it a date in `RELEASED`
  in `api/_data/prompt-bodies.mjs`.**
- Refund or cancellation ends access. Paying before signing up works: the plan
  waits for the account with that email.

**Vercel `nullrift-v-1`**: SUPABASE_URL, SUPABASE_ANON_KEY, POLAR_PRODUCT_TIERS
set for Production, Preview and Development. Security headers in `vercel.json`.

**Site**: Privacy (names Polar as merchant of record), Terms (plan rules,
refunds), 404 page, robots.txt, link-preview tags; tested on phone width with
no overflow and no console errors on every page.

## You must do (they involve secrets or your identity)

1. **Vercel → nullrift-v-1 → Settings → Environment Variables**, for Production
   and Preview, tick *Sensitive*:
   - `POLAR_WEBHOOK_SECRET` — Polar → Settings → Webhooks → "NULLRIFT site -
     grant access" → **Copy Secret**.
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API Keys →
     a secret key.
2. **Polar → Finance → Account → Verify your identity.** Also check the payout
   account: Polar says it was "connected by another member". Payouts go there.
3. **Merge `launch` into `main`** (or tell me to). Vercel then deploys it live.
4. **Test a purchase without spending money:** Polar → Products → Discounts →
   create a 100% code, sign in on the site, buy Pro with the code, check a
   prompt opens and the account menu says "Pro plan". Then delete the code,
   and refund/remove the $0 order if you like (a refund locks it again).

## Optional / later

- **Google sign-in**: create the OAuth client in Google Cloud and paste it into
  Supabase (SETUP.md §5). The button then appears on its own.
- **Domain**: nullrift.design currently points at a Modulify site, not Vercel.
  When you move it: add it in Vercel → Domains, then change the 4 Polar
  checkout links' success/return URLs, the Polar webhook URL and the Supabase
  Site URL to the new domain.
- Archive the old **"Pro" $10** product in Polar (no orders, not used).
- Have Privacy and Terms checked; add your legal name, country and governing law.
- Founding 100 buyers get Pro automatically; the website build is yours to
  arrange — watch Polar → Sales for "NULLRIFT Founding 100".
