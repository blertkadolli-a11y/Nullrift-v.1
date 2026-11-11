# Getting the six-digit code to actually arrive

## Why this is necessary

Supabase will not let you edit email templates on the built-in mailer — the
dashboard says *"Set up custom SMTP to edit templates."* Its default template
sends a **link**, not a code, and there is no way to add the `{{ .Token }}`
placeholder while that restriction is in place.

So the order is: **connect your own SMTP → templates unlock → paste the
template with `{{ .Token }}` → codes arrive.**

You would want this eventually regardless. Supabase's built-in mailer is
rate-limited to a handful of emails per hour and is explicitly not meant for
production traffic.

**I never see your API key or password.** You paste those straight into
Supabase. Nothing sensitive needs to come through chat.

---

## Step 1 — Create a Resend account

Resend is the least fiddly option and Supabase documents it directly. Brevo,
Mailgun, Postmark and SendGrid all work the same way if you prefer one of them.

1. Go to **resend.com** and sign up (your Gmail is fine as the login).
2. Free tier is generous enough for early users — check their current limits on
   the pricing page, since these change.

## Step 2 — Verify nullrift.design

1. In Resend: **Domains** → **Add Domain** → type `nullrift.design`.
2. Resend shows you a set of DNS records — typically an **MX**, and **TXT**
   records for SPF and DKIM.
3. Add each one at whoever you registered `nullrift.design` with (Namecheap,
   GoDaddy, Cloudflare, Vercel — wherever you bought it). There is usually a
   panel called **DNS**, **DNS Records** or **Advanced DNS**.
4. Copy the values exactly. A trailing dot or a missing one is the usual reason
   verification fails.
5. Back in Resend, click **Verify**. It is often a few minutes; it can take
   longer while DNS propagates.

**Verification must go green before anything else works.** An unverified domain
means Resend refuses to send.

## Step 3 — Create an API key

Resend → **API Keys** → **Create API Key**. Copy it now; it is shown once.

This is the value you will paste as the SMTP *password* in the next step.

## Step 4 — Point Supabase at it

Supabase → **Authentication** → **Emails** → the **Set up SMTP** button you
already found (or the SMTP Settings tab). Turn on custom SMTP and enter:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (or `587` if 465 is blocked) |
| Username | `resend` |
| Password | the API key from step 3 |
| Sender email | `hello@nullrift.design` |
| Sender name | `NULLRIFT` |

The sender address must be **on the domain you verified**. Using your Gmail
address here will fail — Resend can only send as `nullrift.design`.

Save.

## Step 5 — Now the templates unlock

The *"Set up custom SMTP to edit templates"* banner disappears and the Subject
and Body fields become editable. Paste each file from `email-templates/` into
its template (delete what is there first), and set the subject:

| Supabase template | File | Subject |
|---|---|---|
| **Confirm signup** | `email-templates/confirm-signup.html` | Confirm your NULLRIFT account |
| **Magic Link** | `email-templates/magic-link.html` | Your NULLRIFT sign-in code |
| **Reset Password** | `email-templates/reset-password.html` | Reset your NULLRIFT password |

All three contain `{{ .Token }}` (the code the site asks for) and a link as a
fallback. Without this step people get a link only and nothing to type.

## Step 6 — Test

Go to the sign-in page, request a code, and check the email. You should see a
large six-digit number.

The site already accepts **both** the code and the link, so nothing is broken
while you work through this — if a link arrives, clicking it still signs you in.

---

## If the code still does not arrive

- **Resend → Logs** shows every send attempt and why one failed. Check there
  first; it is more informative than anything Supabase surfaces.
- A sender address not on the verified domain is the most common failure.
- Supabase → Authentication → **Rate Limits** caps auth emails per hour. Raise
  it if you are testing repeatedly.
- Check spam. A newly verified domain has no sending reputation yet, so the
  first few can land there.

## Redirect URLs (required for links, Google and password reset)

See "Supabase → URL Configuration" in `SETUP.md`. Without it, emailed links and
"Continue with Google" land on the wrong page.
