/* ==========================================================================
   NULLRIFT — the account page

   Plan & billing   what the account holds, when it renews or ends, Monthly's
                    allowance, and the way to Polar's customer portal for
                    cancelling, changing card and receipts.
   Profile          username and picture.
   Security         change password, sign out here or everywhere.
   Data             copy or deletion requests, by email.

   Reads only what row-level security lets this visitor read about
   themselves. Nothing here can change a plan: plans are written by the
   payment webhook alone.
   ========================================================================== */

import * as auth from './auth.js';
import { PRESETS, presetSvg, renderAvatar, firstName } from './avatars.js';

const PORTAL = 'https://polar.sh/nullrift/portal';
const CONTACT = 'nullriftdesign@gmail.com';
const ALLOWANCE = 3;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const GRACE_MS = 60 * 1000;

const $ = (s, r) => (r || document).querySelector(s);
const main = $('#main');

const TIERS = {
  monthly: { name: 'Monthly', price: '$7 a month' },
  pro: { name: 'Pro', price: '$89.99, paid once' },
  team: { name: 'Team', price: '$149.99, paid once, 6 seats' }
};

function day(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function button(label, href, kind) {
  const a = document.createElement('a');
  a.className = 'frame__btn' + (kind === 'primary' ? ' frame__btn--prompt' : '');
  a.href = href;
  if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
  const s = document.createElement('span');
  s.textContent = label;
  a.appendChild(s);
  if (/^https?:/.test(href)) {
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    a.appendChild(arrow);
  }
  return a;
}

function status(text, kind) {
  const el = $('[data-acc-status]');
  el.textContent = text;
  el.dataset.kind = kind;
}

/* ------------------------------------------------------------------ plan */

async function paintPlan() {
  const data = await auth.loadAccount();
  const name = $('[data-acc-planname]');
  const detail = $('[data-acc-plandetail]');
  const actions = $('[data-acc-plan-actions]');
  const note = $('[data-acc-billing-note]');
  actions.innerHTML = '';

  const e = data && data.entitlement;
  const tier = e && TIERS[e.tier] ? e.tier : null;

  if (!data || !tier || !data.active) {
    status(e && tier ? 'Ended' : 'No plan', 'none');
    name.textContent = e && tier ? TIERS[tier].name + ' has ended' : 'No plan yet';
    detail.textContent = e && tier && e.expires_at
      ? 'Your access ended on ' + day(e.expires_at) + '. Pick a plan to open the library again.'
      : 'Pick a plan to open every prompt, or try Impact Grid free first.';
    actions.append(button('See plans', 'pricing.html', 'primary'), button('Try Impact Grid free', 'gallery.html#ex-06'));
    if (e) actions.append(button('Billing history', PORTAL));
    note.hidden = !e;
    return;
  }

  const t = TIERS[tier];
  name.textContent = t.name;

  if (tier === 'monthly') {
    const end = e.period_end || e.expires_at;
    /* The webhook writes expires_at exactly at the period end when the
       subscription is set to stop, and a little after it when it renews. */
    const cancelling = e.expires_at && e.period_end &&
      Math.abs(new Date(e.expires_at) - new Date(e.period_end)) < GRACE_MS;
    if (cancelling) {
      status('Cancelled', 'warn');
      detail.textContent = t.price + ' · cancelled, you keep access until ' + day(end) + '.';
    } else {
      status('Active', 'ok');
      detail.textContent = t.price + ' · renews on ' + day(end) + '.';
    }

    const since = new Date(e.period_start || e.created_at || 0).getTime();
    const used = data.unlocks.filter((u) => new Date(u.unlocked_at).getTime() >= since).length;
    const left = Math.max(0, ALLOWANCE - used);
    $('[data-acc-meter]').hidden = false;
    $('[data-acc-meter-text]').textContent = used + ' of ' + ALLOWANCE;
    $('[data-acc-meter-bar]').style.width = Math.min(100, (used / ALLOWANCE) * 100) + '%';
    $('[data-acc-meter-note]').textContent = left
      ? left + ' left. Open any prompt on the site to use one.'
      : 'All used. They refill on ' + day(e.period_end) + '.';

    actions.append(
      button(cancelling ? 'Renew or manage billing' : 'Manage or cancel subscription', PORTAL, 'primary'),
      button('Upgrade to Pro', 'pricing.html')
    );
  } else {
    status('Active', 'ok');
    const granted = new Date(e.granted_at || e.created_at || Date.now());
    const until = new Date(granted.getTime() + YEAR_MS);
    const fresh = until.getTime() > Date.now();
    detail.textContent = t.price + ' · bought ' + day(granted.toISOString()) + '. ' +
      (fresh
        ? 'Every new system released until ' + day(until.toISOString()) + ' is included.'
        : 'Everything you had stays yours; new systems are no longer included.');
    actions.append(button('Browse the library', 'gallery.html', 'primary'), button('Receipts & invoices', PORTAL));
  }

  /* What is open on this account (Monthly keeps what it unlocked). */
  if (data.unlocks.length && tier === 'monthly') {
    let titles = {};
    try {
      const m = await import('./prompts.js' + new URL(import.meta.url).search);
      Object.keys(m.PROMPTS).forEach((k) => { titles[k] = m.PROMPTS[k]; });
    } catch (err) { titles = {}; }
    const list = $('[data-acc-unlocked-list]');
    list.innerHTML = '';
    data.unlocks.forEach((u) => {
      const p = titles[u.prompt_id];
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = p && p.kind === 'template' ? 'templates.html' : 'gallery.html#ex-' + u.prompt_id;
      a.textContent = p ? p.title : 'System ' + u.prompt_id;
      const when = document.createElement('span');
      when.textContent = day(u.unlocked_at);
      li.append(a, when);
      list.appendChild(li);
    });
    $('[data-acc-unlocked]').hidden = false;
  }
}

/* --------------------------------------------------------------- profile */

function profileNote(text, kind) {
  const n = $('[data-acc-profile-note]');
  n.hidden = !text;
  n.dataset.kind = kind || 'ok';
  n.textContent = text || '';
}

function paintProfile() {
  const profile = auth.getProfile();
  $('[data-acc-avatar]').innerHTML = renderAvatar(profile);
  const input = $('#acc-username');
  if (document.activeElement !== input) {
    input.value = (profile && profile.username) || firstName(profile, auth.getEmail());
  }
  document.querySelectorAll('.acc__mark').forEach((b) => {
    const on = profile && !profile.avatar_url && profile.avatar_preset === b.dataset.preset;
    b.setAttribute('aria-checked', String(!!on));
  });
}

function wireProfile() {
  const marks = $('[data-acc-marks]');
  PRESETS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'acc__mark';
    b.dataset.preset = id;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.setAttribute('aria-label', 'Profile picture ' + id.slice(1));
    b.innerHTML = presetSvg(id);
    b.addEventListener('click', async () => {
      profileNote('Saving…');
      try {
        await auth.saveProfile({ avatar_preset: id, avatar_url: null });
        profileNote('Saved.');
        paintProfile();
      } catch (err) { profileNote(err.message, 'error'); }
    });
    marks.appendChild(b);
  });

  $('[data-acc-upload]').addEventListener('click', () => $('[data-acc-file]').click());
  $('[data-acc-file]').addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    profileNote('Uploading…');
    try {
      await auth.uploadAvatar(file);
      profileNote('Saved.');
      paintProfile();
    } catch (err) { profileNote(err.message, 'error'); }
  });

  $('[data-acc-profile]').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const input = $('#acc-username');
    const username = input.value.trim().replace(/\s+/g, ' ');
    if (username.length < 2) { input.focus(); profileNote('Pick a username of at least 2 characters.', 'error'); return; }
    profileNote('Saving…');
    try {
      await auth.saveProfile({ username });
      profileNote('Saved.');
      paintProfile();
    } catch (err) { profileNote(err.message, 'error'); }
  });
}

/* -------------------------------------------------------------- security */

function wireSecurity() {
  const user = auth.getUser();
  const method = user && user.provider && user.provider !== 'email'
    ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1)
    : 'Email';
  $('[data-acc-method]').textContent = method;
  if (method !== 'Email') {
    const link = $('[data-acc-password] span');
    link.textContent = 'Set a password';
  }

  $('[data-acc-signout]').addEventListener('click', async () => {
    await auth.signOut();
    location.href = 'gallery.html';
  });
  $('[data-acc-signout-all]').addEventListener('click', async () => {
    await auth.signOutEverywhere();
    location.href = 'auth.html';
  });

  const email = auth.getEmail();
  const mail = (subject) => 'mailto:' + CONTACT + '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent('Account email: ' + email + '\n\n');
  $('[data-acc-mail="export"]').href = mail('NULLRIFT — copy of my data');
  $('[data-acc-mail="delete"]').href = mail('NULLRIFT — delete my account');
}

/* ------------------------------------------------------------------ boot */

let booted = false;

auth.onChange(async (session) => {
  if (!session) {
    /* Signed out (here, from the header menu, or the session ran out). */
    if (!booted) location.replace('auth.html?next=account.html');
    else location.href = 'gallery.html';
    return;
  }
  const email = auth.getEmail();
  $('[data-acc-email]').textContent = email;
  $('[data-acc-email2]').textContent = email;
  if (booted) { paintProfile(); return; }
  booted = true;
  wireProfile();
  wireSecurity();
  try { await auth.loadProfile(); } catch (err) { /* defaults are fine */ }
  paintProfile();
  await paintPlan();
  main.setAttribute('aria-busy', 'false');
});
