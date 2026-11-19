# Launch status — 19 Nov 2026

Everything is merged into **`main`** and live on https://nullrift-v-1.vercel.app.

## What is done

**Templates shelf**: TPL.01 Oblique, TPL.02 HADAL, TPL.03 WOBL, TPL.04 AUTOCARS, each with
a live preview, fullscreen and a prompt released only through `/api/prompt`.

**Speed**: template cards no longer run when nobody can see them. `public/js/frame-shim.js`
loads first in every template page and lets the shelf pause a card off screen, run it at
about 30fps on screen, at full speed when hovered or open, and at a lower pixel ratio while
it is a thumbnail. Cards behind a fullscreen exhibit pause on both shelves.
**When you rebuild a template into `public/`, put
`<script src="/js/frame-shim.js"></script>` right after `<meta charset>` in its HTML
again** (every `.html` file for AUTOCARS).

**Accounts**: email + password, sign-up with emailed code, forgot / reset / change password,
passwordless code, "keep me signed in". Social buttons appear on their own once a provider is
switched on in Supabase.

**Supabase**: security advisor clean apart from two intended items (`pending_entitlements`
is written only by the server; `prompt_access` is meant to be called by signed-in users).
Custom email through Resend (hello@contact.nullrift.design). Email limit raised from 30 to
100 per hour so a launch rush does not stop sign-up codes. Minimum password 8 characters.

**Payments (Polar)**: Monthly $7/mo, Pro $89.99, Team $149.99, Founding 100 $200, wired to
the buy buttons. Webhook live with both secrets (checked: it rejects unsigned calls).

**Prompts**: animation prompts 01–08 now end with "Make it run in the buyer's project"
(the host loop, resize, pause off screen, React/Next notes) and "Done means" (checks the
AI must pass), so a pasted prompt produces something that runs straight away.

**Site**: link-preview image (`public/assets/og.jpg`), sitemap, Privacy, Terms, 404,
security headers, robots.txt.

## You must do

1. **Test a purchase without spending money**: Polar → Products → Discounts → a 100% code,
   sign in on the site, buy Pro with it, check a prompt opens and the account menu says
   "Pro plan". Delete the code afterwards.
2. **Polar → Finance → Account → Verify your identity**, and check the payout account
   (Polar says another member connected it).

## Google / Apple sign-in (your accounts, your secrets)

**Google (free, recommended for launch)**
1. https://console.cloud.google.com → create a project "NULLRIFT".
2. APIs & Services → OAuth consent screen → External → app name NULLRIFT, your email,
   authorised domain `supabase.co` (and `nullrift.design` once it is yours) → Publish.
3. Credentials → Create credentials → OAuth client ID → Web application.
   - Authorised JavaScript origins: `https://nullrift-v-1.vercel.app`
   - Authorised redirect URI: `https://ehkhrlecjhyghzmeoakf.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client secret into Supabase → Authentication → Sign In / Providers
   → Google → enable → Save. The "Continue with Google" button then appears by itself.

**Apple** needs a paid Apple Developer account ($99/year). Worth it later, not for launch.
**GitHub** is free and suits a developer audience: GitHub → Settings → Developer settings →
OAuth Apps → New, callback URL as above, then paste into Supabase → GitHub.

## When nullrift.design points at Vercel

Tell Claude, or change these from `https://nullrift-v-1.vercel.app` to
`https://nullrift.design`:
- Polar: the 4 checkout links' success/return URLs, and the webhook URL
  (`/api/payment-webhook`).
- Supabase → URL Configuration → Site URL.
- `public/*.html` og:url / og:image tags, `public/sitemap.xml`, `public/robots.txt`.
- Google OAuth client: add the new origin.

## Optional / later

- Archive the old "Pro" $10 product in Polar (no orders, not used).
- Have Privacy and Terms checked; add your legal name, country and governing law.
- Leaked-password check (HaveIBeenPwned) needs the Supabase Pro plan.
- Founding 100 buyers get Pro automatically; watch Polar → Sales for them.
