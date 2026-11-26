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

**Keep-awake**: Vercel calls `/api/keepalive` daily so the free Supabase project never
pauses (a paused project stops every sign-in).

## You must do

1. **Test a purchase without spending money**: Polar → Products → Discounts → a 100% code,
   sign in on the site, buy Pro with it, check a prompt opens and the account menu says
   "Pro plan". Delete the code afterwards.
2. **Polar → Finance → Account → Verify your identity**, and check the payout account
   (Polar says another member connected it).

## Google sign-in: done

Google Cloud project **NULLRIFT** (Google Auth Platform, published, no logo so no review).
Web client **"NULLRIFT website"**: origin `https://nullrift-v-1.vercel.app`, redirect
`https://ehkhrlecjhyghzmeoakf.supabase.co/auth/v1/callback`. The site uses Google's own
button (Google Identity Services, `GOOGLE_CLIENT_ID` in `public/js/gallery/auth.js`), so
Google's screen names the site. Brand verification (shows "NULLRIFT") needs the real domain.

**Apple** needs a paid Apple Developer account ($99/year). Not needed for launch.

## When nullrift.design points at Vercel

Tell Claude, or change these from `https://nullrift-v-1.vercel.app` to
`https://nullrift.design`:
- Polar: the 4 checkout links' success/return URLs, and the webhook URL
  (`/api/payment-webhook`).
- Supabase → URL Configuration → Site URL.
- `public/*.html` og:url / og:image tags, `public/sitemap.xml`, `public/robots.txt`.
- Google client "NULLRIFT website": add `https://nullrift.design` to JavaScript origins, add
  `nullrift.design` to Branding → Authorized domains and update the three Branding links,
  then submit brand verification so the screen says NULLRIFT.
- `public/js/chrome.js`: `CANONICAL` (the address every *.vercel.app copy forwards to,
  so a sign-in never splits across two addresses).

## Optional / later

- Archive the old "Pro" $10 product in Polar (no orders, not used).
- Have Privacy and Terms checked; add your legal name, country and governing law.
- Leaked-password check (HaveIBeenPwned) needs the Supabase Pro plan.
- Founding 100 buyers get Pro automatically; watch Polar → Sales for them.
