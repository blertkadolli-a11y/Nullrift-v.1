/* ==========================================================================
   NULLRIFT — GALLERY ORCHESTRATOR
   Owns the single RAF, lazy-mounts each exhibit module on approach, pauses
   anything offscreen, and drives the library chrome (entrance, hover
   ownership, progress rail, per-frame status).
   Every exhibit module is an ES module with a default export:
     create({ root, reduced, preview })
       -> { setPreview, resize, update, activate, deactivate, destroy }
   ========================================================================== */

/* gallery.html cache-busts this file with ?v=N, but a relative specifier drops
   the query when it resolves — so every exhibit module and the prompt table
   would keep loading from cache after an edit. Carry the version across, and
   one bump in the markup invalidates the whole graph. */
const VERSION = new URL(import.meta.url).search;

function versioned(spec) {
  const url = new URL(spec, import.meta.url);
  if (VERSION && !url.search) url.search = VERSION;
  return url.href;
}

/* Loaded eagerly, but through the versioned URL, so it cannot go stale. */
const promptsReady = import(versioned('./prompts.js'));

/* Small and needed on the first prompt click, so it comes in with the page.
   Signing in itself happens on auth.html, not in a dialog here. */
import * as auth from './auth.js';
let prompts = null;
promptsReady.then(function (m) { prompts = m; }, function () { prompts = null; });

/* ==========================================================================
   COMMERCE CONFIG — the only block you edit to go live.

   CONTACT_MAIL   the address the pricing section writes to.
   CHECKOUT       one Polar Checkout Link per tier (https://buy.polar.sh/…).
                  The page adds the signed-in account to it at click time
                  (reference_id + customer_email), which is how
                  api/payment-webhook.mjs knows whose plan to unlock. A
                  signed-out visitor is sent to sign in first and comes
                  straight back to the same checkout. Each link's product must
                  also be listed in POLAR_PRODUCT_TIERS on Vercel (SETUP.md §7).
   BOOKING        one URL per call length for the Studio tier.

   A tier left blank renders as visibly disabled rather than as a buy button
   that goes nowhere. Never ship a live-looking checkout that cannot take
   money — that is how you lose a customer permanently.
   ========================================================================== */
const CONTACT_MAIL = 'nullriftdesign@gmail.com';

const CHECKOUT = {
  monthly: 'https://buy.polar.sh/polar_cl_NP7YuzWFYgRXVJGnXHEQk0mOFVp1bXHIlrB413F3fYD',
  pro: 'https://buy.polar.sh/polar_cl_4dlhAAAVNK0XM9avaOordzs5KmDi5TNgdQ6Tz2XQ3li',
  team: 'https://buy.polar.sh/polar_cl_PhUNUH2lgt8jcBPUpojEfDXSs7mGWNNW9HJei2KGQtY'
};

/* Studio is booked, not bought — the price is agreed on the call, so the card
   sells a slot rather than a checkout.

   `url` is deliberately format-agnostic. It can be a Cal.com event that takes
   the deposit itself (its Stripe app), or a Stripe Payment Link whose
   post-payment redirect lands on the Cal.com event. Both satisfy "paid before
   the booking confirms" and the markup cannot tell them apart, so switching
   between them later is one string, not a rebuild.

   `deposit` is what the copy quotes, in whole dollars, and it must match what
   the URL actually charges. Set it to 0 to present that length as free — that
   is the whole change required if the deposit turns out to be suppressing
   bookings. */
const BOOKING = {
  '15': { url: '', deposit: 50, label: 'Fit check' },
  '30': { url: '', deposit: 50, label: 'Full brief' }
};

/* The founding-100 offer that greets a visitor when the grid comes into view.

   `url` follows the same rule as CHECKOUT, and is handled the same way: a
   Polar Checkout Link whose product is mapped to `pro` in
   POLAR_PRODUCT_TIERS (the website build is arranged by email after). Blank
   renders the button visibly disabled instead of live-looking and dead.

   `claimed` is the only number the copy is allowed to quote, and it is a
   number you set by hand from what you have actually sold. It deliberately
   does not tick down on its own: an invented counter is a lie told to every
   visitor, and it is the kind of lie people screenshot. Leave it null and the
   copy simply says how many seats exist, which is true on day one. */
const OFFER = {
  seats: 100,
  claimed: null,
  price: 200,
  url: 'https://buy.polar.sh/polar_cl_k7M8hrK1Yb3063hzxEwjoUN8LHCiWAwgrDUJl1ECcGV',
  /* Shown on the button when `url` is blank. */
  deadLabel: 'Opening soon'
};

const html = document.documentElement;
html.classList.add('g-js');

const reduced = window.NR
  ? !!window.NR.prefersReducedMotion
  : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MOUNT_MARGIN = '30% 0px 30% 0px';
const MAX_DT = 0.05;

/* Only one exhibit can be under the cursor. That one is worth every frame; the
   rest are drifting on ambient loops where half the frame rate is invisible.
   Splitting the two is what keeps a grid of live WebGL inside the 60fps budget
   without dropping resolution — which is the thing you can actually see. */
const IDLE_STEP = 1 / 32;

/* ---------------------------------------------------------------- registry */

class Exhibit {
  constructor(el) {
    this.el = el;
    this.id = el.dataset.exhibit;
    /* What the chrome prints for this card. The id is the prompt key and is
       shared by both shelves, so a template carries its own label (TPL.01)
       rather than reading as an animation exhibit. */
    this.code = el.dataset.code || 'EX.' + this.id;
    this.specifier = el.dataset.module;
    this.stage = el.querySelector('[data-stage]');
    this.frame = el.querySelector('.exhibit__frame');
    this.statusEl = el.querySelector('[data-mount-status]');
    this.instance = null;
    this.state = 'idle';
    this.active = false;
    this.pendingSize = null;
    this.lastW = 0;
    this.lastH = 0;
    this.acc = 0;
    /* Geometry differs between a card and full page; resolution no longer does.
       Modules read this to size their element counts, not their framebuffers. */
    this.preview = true;
  }

  /* Modules that expose setPreview re-derive their own resolution and element
     counts; the forced measure below is what actually applies the new budget. */
  setPreview(next) {
    if (this.preview === next) return;
    this.preview = next;
    if (!this.instance) return;
    if (typeof this.instance.setPreview === 'function') {
      this.guard(() => this.instance.setPreview(next));
      this.measure(true);
    }
  }

  setStatus(label, state) {
    if (!this.statusEl) return;
    this.statusEl.textContent = label;
    this.statusEl.dataset.state = state;
  }

  async mount() {
    if (this.state !== 'idle') return;
    this.state = 'mounting';
    this.setStatus('BOOT', 'loading');
    try {
      const mod = await import(versioned(this.specifier));
      const factory = mod && (mod.default || mod.create);
      if (typeof factory !== 'function') throw new Error('no factory');
      this.instance = factory({ root: this.stage, reduced, preview: this.preview });
      this.state = 'ready';
      this.measure(true);
      if (this.active) this.resume();
      else this.setStatus(reduced ? 'STATIC' : 'READY', 'ready');
    } catch (err) {
      this.state = 'failed';
      this.instance = null;
      this.setStatus('UNAVAILABLE', 'failed');
    }
  }

  measure(force) {
    if (!this.instance || typeof this.instance.resize !== 'function') return;
    const rect = this.stage.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (!w || !h) return;
    if (!force && w === this.lastW && h === this.lastH) return;
    this.lastW = w;
    this.lastH = h;
    this.guard(() => this.instance.resize(w, h));
  }

  resume() {
    if (this.state !== 'ready' || !this.instance) return;
    this.measure(false);
    this.guard(() => this.instance.activate && this.instance.activate());
    this.setStatus(reduced ? 'STATIC' : 'LIVE', reduced ? 'ready' : 'live');
  }

  pause() {
    if (this.state !== 'ready' || !this.instance) return;
    this.guard(() => this.instance.deactivate && this.instance.deactivate());
    this.setStatus('PAUSED', 'ready');
  }

  tick(dt, elapsed) {
    if (reduced || !this.active || this.state !== 'ready' || !this.instance) return;
    if (typeof this.instance.update !== 'function') return;

    /* The hovered exhibit — and a fullscreen one, which is the whole page —
       runs every frame. Everything else coalesces to ~32Hz and is handed the
       accumulated dt, so its motion stays correct, just resolved less often. */
    if (this !== hot && this !== expanded) {
      this.acc += dt;
      if (this.acc < IDLE_STEP) return;
      dt = this.acc;
      this.acc = 0;
    }

    this.guard(() => this.instance.update(dt, elapsed));
  }

  destroy() {
    if (this.instance) this.guard(() => this.instance.destroy && this.instance.destroy());
    this.instance = null;
    this.state = 'destroyed';
  }

  /* A module that throws is retired rather than allowed to spam the console. */
  guard(fn) {
    try {
      fn();
    } catch (err) {
      this.instance = null;
      this.state = 'failed';
      this.active = false;
      this.setStatus('UNAVAILABLE', 'failed');
    }
  }
}

const exhibits = Array.from(document.querySelectorAll('[data-exhibit]'), (el) => new Exhibit(el));
const byEl = new Map(exhibits.map((ex) => [ex.el, ex]));

/* The catalogue grows, so nothing states its own size in the markup. Every
   printed count is derived from the cards actually on the page — add a card
   and the masthead follows on its own. The HTML keeps a plausible value as
   the no-JS fallback. */
function stampCounts() {
  const pad = (n) => String(n).padStart(2, '0');
  const total = pad(exhibits.length);
  document.querySelectorAll('[data-count-total]').forEach((el) => {
    el.textContent = total;
  });
  document.querySelectorAll('[data-count-range]').forEach((el) => {
    el.textContent = 'EX. 01 — ' + total;
  });
}
stampCounts();

/* The switch between the two shelves quotes both of their sizes, and this page
   only holds one shelf's cards — so those counts come from the catalogue
   table, which knows every entry and which shelf it is on. */
promptsReady.then((m) => {
  if (!m || typeof m.countByKind !== 'function') return;
  const counts = m.countByKind();
  document.querySelectorAll('[data-count-kind]').forEach((el) => {
    const n = counts[el.dataset.countKind];
    if (typeof n === 'number') el.textContent = String(n).padStart(2, '0');
  });
}, () => { /* the markup keeps its fallback numbers */ });

/* ------------------------------------------------------------- commerce ui */

/* Blank config target → visibly disabled, never a live-looking control that
   goes nowhere. Shared by checkout and booking so there is one behaviour to
   reason about, and one place to fix it. */
function wireTarget(el, url, deadLabel) {
  const label = el.querySelector('[data-cta-label]') || el.querySelector('span') || el;
  if (url) {
    el.href = url;
    el.removeAttribute('data-unwired');
    el.removeAttribute('aria-disabled');
    if (el.dataset.label) label.textContent = el.dataset.label;
    return;
  }
  el.setAttribute('data-unwired', '');
  el.setAttribute('aria-disabled', 'true');
  el.removeAttribute('href');
  if (!el.dataset.label) el.dataset.label = label.textContent;
  label.textContent = deadLabel;
}

function wireCommerce() {
  /* querySelectorAll, not querySelector: the Studio card carries a second
     mailto beside the one in the pricing footnote. */
  document.querySelectorAll('[data-contact-mail]').forEach((mail) => {
    const subject = mail.dataset.contactMail || 'NULLRIFT — commission a system';
    if (!mail.dataset.keepText) mail.textContent = CONTACT_MAIL;
    mail.href = 'mailto:' + CONTACT_MAIL + '?subject=' + encodeURIComponent(subject);
  });

  document.querySelectorAll('[data-checkout]').forEach((el) => {
    const url = CHECKOUT[el.dataset.checkout];
    wireTarget(el, url, 'Checkout not connected');
    if (url) el.dataset.checkoutUrl = url;
  });

  document.querySelectorAll('[data-book]').forEach((el) => {
    const slot = BOOKING[el.dataset.book];
    wireTarget(el, slot && slot.url, 'Booking not connected');
  });

  /* The quoted deposit comes from the same object that holds the URL charging
     it, so the copy cannot drift away from what the visitor is actually asked
     to pay. */
  document.querySelectorAll('[data-deposit]').forEach((el) => {
    const slot = BOOKING[el.dataset.deposit];
    if (!slot) return;
    el.textContent = slot.deposit > 0 ? '$' + slot.deposit + ' deposit' : 'Free';
  });
}

/* This orchestrator runs both shelves — gallery.html and templates.html — so
   every path back here is built from the page actually loaded. */
const PAGE = (location.pathname.split('/').pop() || 'gallery.html');

/* Where "sign in" goes, with a same-origin return path attached. `cardId` is
   the card's element id, so signing in lands back on the very card. */
function authHref(cardId) {
  const back = PAGE + (cardId ? '#' + cardId : location.hash || '');
  return 'auth.html?next=' + encodeURIComponent(back);
}

/* ---------------------------------------------------------------- checkout

   Every live buy button carries data-checkout-url (its bare Polar link). Its
   real href is rebuilt whenever the session changes:

     signed in   → the Polar link + reference_id=<user id> + customer_email,
                   so the webhook can match the payment to this account even
                   if they pay with a different email
     signed out  → auth.html, with next= pointing back here plus ?buy=<plan>,
                   so after signing in they land straight in the checkout

   Rebuilding the href (rather than intercepting clicks) keeps it a real link:
   middle-click and "open in new tab" carry the account too. */
function checkoutKey(el) {
  return el.dataset.checkout || (el.hasAttribute('data-offer-cta') ? 'offer' : '');
}

function personalisedCheckout(url, user) {
  const u = new URL(url);
  u.searchParams.set('reference_id', user.id);
  if (user.email) u.searchParams.set('customer_email', user.email);
  return u.href;
}

function checkoutUrlFor(key) {
  if (key === 'offer') return OFFER.url || '';
  return Object.prototype.hasOwnProperty.call(CHECKOUT, key) ? CHECKOUT[key] : '';
}

/* ?buy=<plan> on arrival means "I signed in to buy this": take them on to it,
   once, and drop the parameter so Back does not loop them into it again. */
let pendingBuy = (function () {
  const key = new URL(location.href).searchParams.get('buy') || '';
  return checkoutUrlFor(key) ? key : '';
})();

function personaliseCheckouts(session) {
  const user = session && session.user && session.user.id ? session.user : null;

  document.querySelectorAll('[data-checkout-url]').forEach((el) => {
    const url = el.dataset.checkoutUrl;
    if (user) {
      el.href = personalisedCheckout(url, user);
    } else {
      const back = PAGE + '?buy=' + encodeURIComponent(checkoutKey(el)) + '#pricing';
      el.href = 'auth.html?next=' + encodeURIComponent(back);
    }
  });

  if (pendingBuy && user) {
    const key = pendingBuy;
    pendingBuy = '';
    const here = new URL(location.href);
    here.searchParams.delete('buy');
    history.replaceState(history.state, '', here.pathname + here.search + here.hash);
    location.assign(personalisedCheckout(checkoutUrlFor(key), user));
  }
}

/* ------------------------------------------------------------------ plans */

const TIER_NAME = { monthly: 'Monthly', pro: 'Pro', team: 'Team' };

function planText(e) {
  if (!e) return '';
  const name = TIER_NAME[e.tier] || e.tier;
  if (e.tier === 'monthly' && e.period_end) {
    const d = new Date(e.period_end);
    if (!Number.isNaN(d.getTime())) {
      return name + ' plan · renews ' + d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }
  }
  return name + ' plan';
}

/* The account menu's plan line. textContent only; the "See plans" link is
   built as a node, never from strings. */
async function paintPlan(el) {
  if (!el) return;
  const e = await auth.loadEntitlement();
  el.textContent = '';
  if (e) {
    el.textContent = planText(e);
    el.dataset.kind = 'active';
    return;
  }
  el.dataset.kind = 'none';
  el.append('No plan yet · ');
  const a = document.createElement('a');
  a.href = (document.getElementById('pricing') ? '' : 'gallery.html') + '#pricing';
  a.textContent = 'See plans';
  el.appendChild(a);
}

/* -------------------------------------------------------- back from Polar

   Polar sends a buyer back to gallery.html?checkout_id=… The plan is written
   by the webhook, which usually lands within a few seconds but is not
   instant. So: say the payment arrived, wait for the plan to appear, then say
   it is open, instead of leaving them on a page that still looks locked. */
function wireCheckoutReturn() {
  const url = new URL(location.href);
  if (!url.searchParams.get('checkout_id')) return;
  url.searchParams.delete('checkout_id');
  history.replaceState(history.state, '', url.pathname + url.search + url.hash);

  const bar = document.createElement('div');
  bar.className = 'paid';
  bar.setAttribute('role', 'status');
  bar.innerHTML =
    '<span class="paid__pip" aria-hidden="true"></span>' +
    '<p class="paid__msg"></p>' +
    '<button type="button" class="paid__x" aria-label="Dismiss">&times;</button>';
  document.body.appendChild(bar);
  const msg = bar.querySelector('.paid__msg');
  bar.querySelector('.paid__x').addEventListener('click', () => bar.remove());

  function say(text, kind, link) {
    msg.textContent = text;
    bar.dataset.kind = kind || 'wait';
    if (link) {
      msg.append(' ');
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      msg.appendChild(a);
    }
  }

  if (!auth.getSession()) {
    say('Payment received. Sign in with the email you paid with and your plan unlocks automatically.',
      'ok', { href: authHref(), text: 'Sign in' });
    return;
  }

  say('Payment received. Unlocking your plan…', 'wait');
  const started = Date.now();
  (async function poll() {
    const e = await auth.loadEntitlement();
    if (e) {
      say('You are in. Your ' + planText(e) + ' is active, so every prompt on it is open.', 'ok');
      return;
    }
    if (Date.now() - started > 90000) {
      say('Payment received, but activation is taking longer than usual. Reload in a minute. If it is still not active, email ' +
        CONTACT_MAIL + ' with your receipt and we will sort it out.', 'slow');
      return;
    }
    setTimeout(poll, 3000);
  })();
}

/* Cards that have moved shelf. An old link to the gallery still has to land
   on the thing it pointed at, not on a grid that no longer holds it. */
const MOVED = {
  'ex-09': 'templates.html#tpl-01'
};

/* ------------------------------------------------------------- account ui */

/* Signed out: one "Sign in" button. Signed in: the person's picture and first
   name, opening a small menu.

   The shell is built once per sign-in state and then *repainted* in place.
   Rebuilding it on every profile change used to destroy the very button the
   visitor had just clicked — the menu vanished mid-interaction and menuOpen
   desynced from a menu that no longer existed. */
function wireAccount() {
  const slot = document.querySelector('[data-account-slot]');
  if (!slot) return;

  let menuOpen = false;
  let shell = null;   /* 'out' | 'in' — which markup is currently mounted */
  let av = null;      /* avatars module, imported once */

  function closeMenu() {
    menuOpen = false;
    const m = slot.querySelector('.acct__menu');
    if (m) m.hidden = true;
    const t = slot.querySelector('.acct__chip');
    if (t) t.setAttribute('aria-expanded', 'false');
  }

  /* Capture phase, deliberately. Each exhibit installs a capture-phase click
     handler that calls stopPropagation() so a click on a live preview counts
     as opening the card — which means a bubble listener here never sees clicks
     on most of the page, and the menu could not be dismissed. document is the
     outermost node, so its capture listener runs before any of them. */
  document.addEventListener('click', (e) => {
    if (menuOpen && !slot.contains(e.target)) closeMenu();
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });

  function say(text, kind) {
    const note = slot.querySelector('[data-avatar-note]');
    if (!note) return;
    note.hidden = !text;
    note.dataset.kind = kind || 'ok';
    note.textContent = text || '';
  }

  /* Everything that can change without the account changing. Called on every
     profile update, and it touches only text and the avatar — never innerHTML
     on the container, so open menus and live listeners survive. */
  function paint() {
    const profile = auth.getProfile();
    const name = av.firstName(profile, auth.getEmail());

    const face = slot.querySelector('.acct__chip .avatar');
    if (face) face.innerHTML = av.renderAvatar(profile);

    /* textContent, not interpolation — a username is user input and must never
       reach innerHTML. */
    const n1 = slot.querySelector('.acct__name');
    const n2 = slot.querySelector('.acct__whoname');
    const mail = slot.querySelector('.acct__mail');
    if (n1) n1.textContent = name;
    if (n2) n2.textContent = name;
    if (mail) mail.textContent = auth.getEmail();

    slot.querySelectorAll('.acct__mark').forEach((b) => {
      const current = profile && !profile.avatar_url &&
        profile.avatar_preset === b.dataset.preset;
      b.setAttribute('aria-checked', String(!!current));
    });
  }

  function buildSignedIn() {
    slot.innerHTML =
      '<button type="button" class="acct__chip" aria-haspopup="true" aria-expanded="false">' +
        '<span class="avatar avatar--sm"></span>' +
        '<span class="acct__name"></span>' +
      '</button>' +
      '<div class="acct__menu" hidden>' +
        '<p class="acct__who"><span class="acct__whoname"></span>' +
          '<span class="acct__mail"></span></p>' +
        '<p class="acct__plan" data-acct-plan>Checking your plan…</p>' +
        '<p class="acct__label">Profile picture</p>' +
        '<div class="acct__marks" role="radiogroup" aria-label="Profile picture"></div>' +
        '<button type="button" class="acct__item" data-avatar-pick>Upload a picture…</button>' +
        '<input type="file" accept="image/*" hidden data-avatar-file>' +
        '<p class="acct__note" data-avatar-note hidden></p>' +
        '<a class="acct__item" data-password-link href="auth.html?mode=password&amp;next=' + encodeURIComponent(PAGE) + '">Change password</a>' +
        '<button type="button" class="acct__item" data-signout>Sign out</button>' +
      '</div>';

    const chip = slot.querySelector('.acct__chip');
    const menu = slot.querySelector('.acct__menu');
    chip.addEventListener('click', () => {
      menuOpen = !menuOpen;
      menu.hidden = !menuOpen;
      chip.setAttribute('aria-expanded', String(menuOpen));
      /* Read on open, not on every page load: most visits never open the
         menu, and a plan can change (a purchase, a refund) between opens. */
      if (menuOpen) paintPlan(slot.querySelector('[data-acct-plan]'));
    });

    slot.querySelector('[data-signout]').addEventListener('click', async () => {
      closeMenu();
      await auth.signOut();
    });

    /* The same six pictures as sign-up, so one can be changed without going
       anywhere near a file dialog. */
    const marks = slot.querySelector('.acct__marks');
    av.PRESETS.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'acct__mark';
      b.dataset.preset = id;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-label', 'Profile picture ' + id.slice(1));
      b.innerHTML = av.presetSvg(id);
      b.addEventListener('click', async () => {
        say('Saving…');
        try {
          /* Clearing avatar_url is what lets a preset win again for someone
             who had previously uploaded a photo. */
          await auth.saveProfile({ avatar_preset: id, avatar_url: null });
          say('');
        } catch (err) {
          say(err.message, 'error');
        }
      });
      marks.appendChild(b);
    });

    /* A plain button forwarding to the hidden input, rather than a <label>
       wrapping it: the label sits inside a menu that closes on outside clicks,
       and the file dialog was swallowing the interaction. */
    slot.querySelector('[data-avatar-pick]').addEventListener('click', () => {
      slot.querySelector('[data-avatar-file]').click();
    });

    slot.querySelector('[data-avatar-file]').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      say('Uploading…');
      try {
        await auth.uploadAvatar(file);
        say('');
      } catch (err) {
        say(err.message, 'error');
      }
    });
  }

  function buildSignedOut() {
    /* A real link to a real page, not a modal: it can be opened in a new tab,
       linked to, and bookmarked, and `next` brings the visitor back here. */
    slot.innerHTML =
      '<a class="nr-cta nr-cta--ghost" href="' + authHref() + '">Sign in</a>';
  }

  auth.onChange(async (session) => {
    if (!av) av = await import(versioned('./avatars.js'));

    if (!session) {
      if (shell !== 'out') { buildSignedOut(); shell = 'out'; menuOpen = false; }
      return;
    }

    if (shell !== 'in') { buildSignedIn(); shell = 'in'; menuOpen = false; }
    paint();
  });
}
wireAccount();
wireCommerce();
auth.onChange(personaliseCheckouts);
wireCheckoutReturn();

/* --------------------------------------------------------------- lifecycle */

const mountObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const ex = byEl.get(entry.target);
    if (!ex) return;
    if (entry.isIntersecting) {
      ex.active = true;
      if (ex.state === 'idle') ex.mount();
      else ex.resume();
    } else if (ex.active) {
      ex.active = false;
      ex.pause();
    }
  });
}, { rootMargin: MOUNT_MARGIN, threshold: 0 });

exhibits.forEach((ex) => mountObserver.observe(ex.el));

/* Resize is debounced so a drag-resize does not rebuild every scene per frame. */
let resizeTimer = 0;
const resizeObserver = new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    exhibits.forEach((ex) => ex.measure(false));
  }, 140);
});
exhibits.forEach((ex) => resizeObserver.observe(ex.stage));

/* Moving the window between displays changes DPR; force a full re-measure. */
let dprQuery = null;
function watchPixelRatio() {
  if (dprQuery) dprQuery.removeEventListener('change', onPixelRatio);
  dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  dprQuery.addEventListener('change', onPixelRatio);
}
function onPixelRatio() {
  exhibits.forEach((ex) => ex.measure(true));
  watchPixelRatio();
}
watchPixelRatio();

/* ------------------------------------------------------------------- clock */

let rafId = 0;
let last = 0;
let elapsed = 0;
let running = false;

function frame(now) {
  rafId = requestAnimationFrame(frame);
  const dt = last ? Math.min((now - last) / 1000, MAX_DT) : 1 / 60;
  last = now;
  elapsed += dt;
  for (let i = 0; i < exhibits.length; i += 1) exhibits[i].tick(dt, elapsed);
  updateProgress();
}

function startClock() {
  if (running) return;
  running = true;
  last = 0;
  rafId = requestAnimationFrame(frame);
}

function stopClock() {
  running = false;
  cancelAnimationFrame(rafId);
}

function onVisibility() {
  if (document.hidden) {
    stopClock();
    exhibits.forEach((ex) => { if (ex.active) ex.pause(); });
  } else {
    exhibits.forEach((ex) => { if (ex.active) ex.resume(); });
    startClock();
  }
}
document.addEventListener('visibilitychange', onVisibility);

/* ---------------------------------------------------------- progress rail */

const progressBar = document.querySelector('[data-progress-bar]');
let lastProgress = -1;

function updateProgress() {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (Math.abs(p - lastProgress) < 0.0008) return;
  lastProgress = p;
  progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
}

/* --------------------------------------------------------- anchor scrolling */

function onAnchorClick(event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  /* Card links open the exhibit rather than scrolling to it. */
  if (link.hasAttribute('data-card-open')) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  const offset = target.getBoundingClientRect().top + window.scrollY - 24;
  window.scrollTo({ top: offset, behavior: reduced ? 'auto' : 'smooth' });
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}
document.addEventListener('click', onAnchorClick);

/* ----------------------------------------------------- card hover ownership

   Every preview shares one cursor, so exactly one card may be "hot" at a time.
   Direct-mounted stages sit at real page coordinates, so a hovered module gets
   genuine pointer events with no remapping — the others simply never receive
   any and stay on their own idle loops.

   Clicks are a different matter: the card is a link, so pointerdown/up/click
   are swallowed in the capture phase before a module can treat them as input.
   Inside fullscreen the card is no longer a link and everything passes through.
------------------------------------------------------------------------------ */

let hot = null;

function setHot(ex) {
  if (hot === ex) return;
  if (hot) hot.el.classList.remove('is-hot');
  hot = ex;
  if (hot) hot.el.classList.add('is-hot');
}

exhibits.forEach((ex) => {
  const el = ex.el;

  el.addEventListener('pointerenter', () => { if (!expanded) setHot(ex); });
  el.addEventListener('pointerleave', () => { if (hot === ex) setHot(null); });

  ['pointerdown', 'pointerup'].forEach((type) => {
    el.addEventListener(type, (event) => {
      if (expanded || event.target.closest('.card__info')) return;
      event.stopPropagation();
    }, true);
  });

  /* A click on the preview is a click on the card, i.e. a navigation. */
  el.addEventListener('click', (event) => {
    if (expanded || event.target.closest('.card__info')) return;
    event.stopPropagation();
    event.preventDefault();
    openExhibit(ex);
  }, true);

  /* A card preview must never eat the page scroll. */
  el.addEventListener('wheel', (event) => {
    if (!expanded) event.stopPropagation();
  }, true);
});

/* ------------------------------------------------------ founding-100 offer

   Shown once the catalogue is actually on screen — the moment someone is
   looking at the work is the moment the offer means something. Dismissing it
   collapses it to a tab rather than destroying it, and that choice is
   remembered, so a returning visitor is never popped at twice.
--------------------------------------------------------------------------- */

function wireOffer() {
  const card = document.getElementById('offer');
  const tab = document.getElementById('offer-tab');
  const section = document.getElementById('catalogue');
  if (!card || !tab || !section) return;

  const KEY = 'nr.offer.dismissed';
  let dismissed = false;
  try { dismissed = localStorage.getItem(KEY) === '1'; } catch (err) { /* private mode */ }

  /* Every number in the copy comes from OFFER, so the markup cannot drift
     away from what is actually being sold. */
  document.querySelectorAll('[data-offer-seats]').forEach((el) => {
    el.textContent = String(OFFER.seats);
  });
  document.querySelectorAll('[data-offer-price]').forEach((el) => {
    el.textContent = String(OFFER.price);
  });

  /* Only quote a remaining count once there is a real one to quote. */
  const countEl = card.querySelector('[data-offer-count]');
  if (countEl) {
    const taken = Number(OFFER.claimed);
    countEl.textContent = Number.isFinite(taken) && OFFER.claimed !== null
      ? taken + ' of ' + OFFER.seats + ' claimed'
      : OFFER.seats + ' seats total';
  }

  /* Same rule the pricing CTAs follow: no destination, no live-looking
     button. wireTarget owns that decision in one place. */
  const cta = card.querySelector('[data-offer-cta]');
  if (cta) {
    wireTarget(cta, OFFER.url, OFFER.deadLabel);
    if (OFFER.url) {
      cta.dataset.checkoutUrl = OFFER.url;
      personaliseCheckouts(auth.getSession());
    }
  }

  /* Centre stage means it is a real modal: it takes the scroll and the focus
     while it is up, and gives both back on the way out. */
  let lastOfferFocus = null;

  function show() {
    lastOfferFocus = document.activeElement;
    card.hidden = false;
    tab.hidden = true;
    document.body.style.overflow = 'hidden';
    const sheet = card.querySelector('.offer__card');
    if (sheet) sheet.focus({ preventScroll: true });
  }

  function collapse() {
    if (card.hidden) return;
    card.hidden = true;
    tab.hidden = false;
    /* The prompt panel and fullscreen own this same property. Only hand the
       scroll back if neither of them is still holding it. */
    if (!expanded && (!promptPanel || promptPanel.hidden)) {
      document.body.style.overflow = '';
    }
    const restore = lastOfferFocus;
    lastOfferFocus = null;
    if (restore && typeof restore.focus === 'function') {
      restore.focus({ preventScroll: true });
    } else {
      tab.focus({ preventScroll: true });
    }
    try { localStorage.setItem(KEY, '1'); } catch (err) { /* private mode */ }
  }

  card.querySelectorAll('[data-offer-dismiss]').forEach((el) => {
    el.addEventListener('click', collapse);
  });
  tab.addEventListener('click', show);

  /* Escape collapses rather than closes: the offer should always still be
     reachable, and a visitor pressing Escape wants it out of the way, not
     gone. Ignored while the prompt panel or a fullscreen exhibit owns the
     key — those have their own Escape behaviour and it must win. */
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || card.hidden) return;
    if (expanded || (promptPanel && !promptPanel.hidden)) return;
    collapse();
  });

  if (dismissed) {
    /* Already turned it down once. Offer the tab, never the card. */
    tab.hidden = false;
    return;
  }

  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      seen.disconnect();
      show();
    });
  }, { threshold: 0.18 });
  seen.observe(section);
}
wireOffer();

/* ------------------------------------------- expand + buyer prompt chrome */

let expanded = null;
const expandBar = document.getElementById('expand-bar');
const expandIdEl = document.querySelector('[data-expand-id]');
const expandTechEl = document.querySelector('[data-expand-tech]');
const expandTitleEl = document.querySelector('[data-expand-title]');

/* Opening an exhibit is a real navigation: it writes a history entry, so the
   URL is shareable and Back returns to the grid. */
function openExhibit(ex) {
  if (!ex || expanded === ex) return;
  const hash = '#' + ex.el.id;
  if (window.location.hash !== hash) {
    /* nrEntry marks an entry this page actually pushed, so the close path
       knows it has one of its own to unwind. A deep link replaces state
       instead, and unwinding that would walk off the site. */
    window.history.pushState({ nrExhibit: ex.id, nrEntry: true }, '', hash);
  }
  openExpand(ex);
}

function onPopState() {
  const id = (window.location.hash || '').replace('#', '');
  const target = id ? exhibits.find((ex) => ex.el.id === id) : null;
  if (target) openExpand(target);
  else closeExpand(true);
}
window.addEventListener('popstate', onPopState);

function openExpand(ex) {
  if (!ex || expanded === ex) return;
  if (expanded) closeExpand(true);

  setHot(null);
  expanded = ex;
  const title =
    (ex.el.querySelector('.card__title') || {}).textContent || 'EXHIBIT';
  ex.el.classList.add('is-expanded');
  html.classList.add('is-expanded');

  if (expandBar) {
    expandBar.hidden = false;
    if (expandIdEl) expandIdEl.textContent = ex.code;
    if (expandTitleEl) expandTitleEl.textContent = title.trim().toUpperCase();

    /* The card plate is hidden in fullscreen — it sat in the same corner as
       this bar and the two printed over each other. Its tech tag is the one
       thing the bar did not already say, so it moves here rather than being
       lost. The plate reads "EX.09 · DOM"; only the tech half is wanted. */
    if (expandTechEl) {
      /* A template card has no plate — it wears browser chrome instead — so
         it states its tag outright. */
      const plate = ex.el.querySelector('.card__plate span');
      const tech = ex.el.dataset.tech || (plate
        ? (plate.textContent.split(/[·\u00b7]/).pop() || '').trim()
        : '');
      expandTechEl.textContent = tech ? '\u00b7 ' + tech.toUpperCase() : '';
      expandTechEl.hidden = !tech;
    }
  }

  /* Ensure the module is live, promoted to full quality, and sized to the
     new stage. setPreview must land before the forced measure. */
  ex.active = true;
  if (ex.state === 'idle') ex.mount().then(() => {
    ex.setPreview(false);
    ex.resume();
    ex.measure(true);
  });
  else {
    ex.setPreview(false);
    ex.resume();
    requestAnimationFrame(() => ex.measure(true));
  }

  const closeBtn = expandBar && expandBar.querySelector('[data-expand-close]');
  if (closeBtn) closeBtn.focus({ preventScroll: true });
}

function closeExpand(silent) {
  if (!expanded) return;
  const ex = expanded;
  expanded = null;
  ex.el.classList.remove('is-expanded');
  html.classList.remove('is-expanded');
  if (expandBar) expandBar.hidden = true;

  /* A close is only honest if the URL closes with it. Left pointing at the
     exhibit, a reload silently re-opens something the visitor shut, and since
     openExhibit only pushes an entry when the hash actually changes, the next
     open pushes nothing and Back stops closing. A history-driven close is
     skipped: there the history is already the thing telling us where we are. */
  if (!silent && window.location.hash === '#' + ex.el.id) {
    window.history.replaceState(
      null, '', window.location.pathname + window.location.search
    );
  }

  /* Back down to card quality so the grid stays cheap. */
  ex.setPreview(true);

  /* Two frames, not one. The card is still laid out fixed and full-bleed when
     the class comes off, and a rect read in the very next frame can still
     describe the fullscreen box — which reads as "already on screen" and
     silently cancels the scroll below. One more frame and the grid layout is
     the one being measured. */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ex.measure(true);

    /* A deep link opens fullscreen from a page that was never scrolled to the
       grid, so closing would strand the visitor at the masthead with no sign
       of where the exhibit went — a button that says BACK TO GALLERY has to
       land on the gallery. Only when the card is genuinely off screen: an
       ordinary close is already parked on it, and must not jump. */
    const box = ex.el.getBoundingClientRect();
    const margin = 80;
    if (box.bottom < margin || box.top > window.innerHeight - margin) {
      /* An explicit target rather than scrollIntoView: the grid entrance is
         driven by a ScrollTrigger that has never fired on this path, and a
         plain scrollTo fires it the same way a visitor's own scroll would. */
      const top = box.top + window.scrollY - (window.innerHeight - box.height) / 2;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    }

    if (!silent) {
      const link = ex.el.querySelector('[data-card-open]');
      if (link) link.focus({ preventScroll: true });
    }
  }));
}

/* ---- prompt panel ------------------------------------------------------- */

const promptPanel = document.getElementById('prompt-panel');
const promptFields = {
  id: document.querySelector('[data-prompt-id]'),
  title: document.querySelector('[data-prompt-title]'),
  tech: document.querySelector('[data-prompt-tech]'),
  use: document.querySelector('[data-prompt-use]'),
  file: document.querySelector('[data-prompt-file]'),
  body: document.querySelector('[data-prompt-body]'),
  copyLabel: document.querySelector('[data-prompt-copy-label]')
};
let promptOpenFor = null;
let copyTimer = 0;
let lastFocus = null;

/* The body of the currently open prompt, once the server has released it.
   Deliberately not cached across prompts: each one is fetched, and each fetch
   is checked. */
let openBody = '';

/* One round trip, one prompt. Returns { body } or { error } — the caller
   turns the error into the right dead end, because "sign in" and "pay" need
   different exits. `unlock` is the Monthly "spend one of this month's
   unlocks on this prompt" request, and is only ever sent from a click. */
async function fetchBody(id, unlock) {
  let token = null;
  try {
    token = await auth.getAccessToken();
  } catch (err) { token = null; }
  if (!token) return { error: 'sign_in_required' };

  let r;
  try {
    r = await fetch('/api/prompt?id=' + encodeURIComponent(id), {
      method: unlock ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + token }
    });
  } catch (err) {
    return { error: 'offline' };
  }
  if (r.ok) {
    const data = await r.json().catch(() => null);
    return data && data.body ? { body: data.body } : { error: 'bad_response' };
  }
  if (r.status === 401) return { error: 'sign_in_required' };
  if (r.status === 402) {
    /* Monthly answers carry the allowance, so the gate can say how many are
       left or when it refills instead of a generic "pay". */
    const data = await r.json().catch(() => null);
    const kind = data && (data.error === 'unlock_required' || data.error === 'allowance_spent')
      ? data.error : 'payment_required';
    return { error: kind, remaining: data && data.remaining, refillsAt: data && data.refills_at };
  }
  if (r.status === 503) return { error: 'auth_unconfigured' };
  return { error: 'unavailable' };
}

const GATE_COPY = {
  sign_in_required: 'Sign in to read this prompt.',
  payment_required: 'This prompt is part of a paid tier. See pricing to unlock it.',
  unlock_required: 'Monthly opens any 3 systems per billing month, and anything you unlock stays open while you are subscribed.',
  allowance_spent: 'You have used this month\u2019s 3 unlocks. Pro opens the whole shelf for good.',
  auth_unconfigured: 'Accounts are not configured on this deployment yet.',
  offline: 'Could not reach the server. Check your connection and try again.',
  bad_response: 'The server did not return the prompt. Try again.',
  unavailable: 'The prompt could not be loaded right now.'
};

async function openPrompt(ex) {
  /* The table is a separate module now, so wait for it rather than assuming
     it has landed. In practice it resolves long before anyone can click. */
  const api = prompts || await promptsReady.catch(function () { return null; });
  const data = api && api.getPrompt(ex.id);
  if (!data || !promptPanel) return;

  lastFocus = document.activeElement;
  promptOpenFor = ex;
  openBody = '';
  /* Metadata is public and paints immediately; only the body waits on the
     server, so the panel never opens blank. */
  if (promptFields.id) promptFields.id.textContent = ex.code;
  if (promptFields.title) promptFields.title.textContent = data.title;
  if (promptFields.tech) promptFields.tech.textContent = data.tech;
  if (promptFields.use) promptFields.use.textContent = data.use;
  if (promptFields.file) promptFields.file.textContent = data.file;
  if (promptFields.body) promptFields.body.textContent = 'Unlocking…';
  if (promptFields.copyLabel) promptFields.copyLabel.textContent = 'Copy prompt';
  setPromptGate(null);

  const copyBtn = promptPanel.querySelector('[data-prompt-copy]');
  if (copyBtn) copyBtn.classList.remove('is-copied');

  promptPanel.hidden = false;
  html.classList.add('is-prompt-open');
  document.body.style.overflow = expanded ? 'hidden' : 'hidden';

  const closeBtn = promptPanel.querySelector('.prompt__x');
  if (closeBtn) closeBtn.focus({ preventScroll: true });

  await releaseBody(ex.id);
}

/* Ask the server for the body, and if it says no, show the matching way out.
   Re-entrant by design: signing in from the gate calls straight back here. */
async function releaseBody(id, unlock) {
  const out = await fetchBody(id, unlock);

  /* The visitor may have closed the panel, or opened a different card, while
     the request was in flight — do not paint a stale body into it. */
  if (!promptOpenFor || promptOpenFor.id !== id) return;

  if (out.body) {
    openBody = out.body;
    if (promptFields.body) promptFields.body.textContent = out.body;
    setPromptGate(null);
    return;
  }

  openBody = '';
  if (promptFields.body) promptFields.body.textContent = '';
  setPromptGate(out.error, out);
}

/* "14 Dec" — the day a Monthly allowance refills. */
function shortDate(isoString) {
  const d = isoString ? new Date(isoString) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/* The locked state of the panel: a message plus exactly one action. `info`
   carries the Monthly allowance (remaining, refillsAt) when there is one. */
function setPromptGate(kind, info) {
  if (!promptPanel) return;
  let gate = promptPanel.querySelector('[data-prompt-gate]');

  if (!kind) {
    if (gate) gate.hidden = true;
    promptPanel.classList.remove('is-locked');
    const btn = promptPanel.querySelector('[data-prompt-copy]');
    if (btn) btn.removeAttribute('aria-disabled');
    return;
  }

  if (!gate) {
    gate = document.createElement('div');
    gate.className = 'prompt__gate';
    gate.setAttribute('data-prompt-gate', '');
    gate.innerHTML =
      '<p class="prompt__gate-msg" data-gate-msg></p>' +
      '<button type="button" class="frame__btn frame__btn--prompt" data-gate-go></button>';
    const host = promptFields.body ? promptFields.body.parentNode : promptPanel;
    host.insertBefore(gate, promptFields.body || null);
    gate.querySelector('[data-gate-go]').addEventListener('click', onGateAction);
  }

  gate.hidden = false;
  gate.dataset.kind = kind;
  promptPanel.classList.add('is-locked');
  const copyBtn = promptPanel.querySelector('[data-prompt-copy]');
  if (copyBtn) copyBtn.setAttribute('aria-disabled', 'true');
  let msg = GATE_COPY[kind] || GATE_COPY.unavailable;
  const refills = shortDate(info && info.refillsAt);
  if (kind === 'allowance_spent' && refills) {
    msg = 'You have used this month\u2019s 3 unlocks. They refill on ' + refills +
      ', or Pro opens the whole shelf for good.';
  }
  gate.querySelector('[data-gate-msg]').textContent = msg;

  const go = gate.querySelector('[data-gate-go]');
  const left = info && typeof info.remaining === 'number' ? info.remaining : null;
  if (kind === 'sign_in_required') go.textContent = 'Sign in';
  else if (kind === 'payment_required') go.textContent = 'See pricing';
  else if (kind === 'unlock_required') {
    go.textContent = left === null ? 'Unlock this one' : 'Unlock this one (' + left + ' left)';
  } else if (kind === 'allowance_spent') go.textContent = 'See Pro';
  else go.textContent = 'Try again';
}

async function onGateAction() {
  const gate = promptPanel.querySelector('[data-prompt-gate]');
  const kind = gate ? gate.dataset.kind : '';
  const id = promptOpenFor ? promptOpenFor.id : null;

  if (kind === 'unlock_required' && id) {
    if (promptFields.body) promptFields.body.textContent = 'Unlocking…';
    setPromptGate(null);
    await releaseBody(id, true);
    return;
  }

  if (kind === 'payment_required' || kind === 'allowance_spent') {
    closePrompt();
    /* Only the gallery carries the full plans. Elsewhere, go to them. */
    const plans = document.getElementById('pricing');
    if (plans && plans.querySelector('[data-checkout]')) {
      plans.scrollIntoView({ behavior: 'smooth' });
    } else {
      location.href = 'gallery.html#pricing';
    }
    return;
  }

  if (kind === 'sign_in_required') {
    /* Carry the prompt they were opening, so signing in lands them back on it
       instead of dumping them at the top of the gallery. */
    location.href = authHref(promptOpenFor ? promptOpenFor.el.id : null);
    return;
  }

  if (id) {
    if (promptFields.body) promptFields.body.textContent = 'Unlocking…';
    setPromptGate(null);
    await releaseBody(id);
  }
}

function closePrompt() {
  if (!promptPanel || promptPanel.hidden) return;
  promptPanel.hidden = true;
  html.classList.remove('is-prompt-open');
  if (!expanded) document.body.style.overflow = '';
  const restore = lastFocus;
  lastFocus = null;
  promptOpenFor = null;
  openBody = '';
  if (restore && typeof restore.focus === 'function') {
    restore.focus({ preventScroll: true });
  }
}

async function copyPrompt() {
  /* Copies what the server actually released. There is no local table to fall
     back to any more, so a locked panel has nothing to copy. */
  if (!openBody) return;
  const label = promptFields.copyLabel;
  const btn = promptPanel && promptPanel.querySelector('[data-prompt-copy]');
  try {
    await navigator.clipboard.writeText(openBody);
  } catch (err) {
    /* Fallback for older engines / insecure contexts */
    const ta = document.createElement('textarea');
    ta.value = openBody;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  if (label) label.textContent = 'Copied';
  if (btn) btn.classList.add('is-copied');
  clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => {
    if (label) label.textContent = 'Copy prompt';
    if (btn) btn.classList.remove('is-copied');
  }, 1800);
}

function onGalleryClick(event) {
  const cardLink = event.target.closest('[data-card-open]');
  if (cardLink) {
    const article = cardLink.closest('[data-exhibit]');
    const ex = article && byEl.get(article);
    if (ex) {
      event.preventDefault();
      openExhibit(ex);
    }
    return;
  }

  if (event.target.closest('[data-expand-close]')) {
    event.preventDefault();
    /* Unwind the history entry openExhibit pushed. */
    if (window.history.state && window.history.state.nrEntry) window.history.back();
    else closeExpand(false);
    return;
  }

  const promptBtn = event.target.closest('[data-prompt]');
  if (promptBtn) {
    const article = promptBtn.closest('[data-exhibit]');
    const ex = article && byEl.get(article);
    if (ex) {
      event.preventDefault();
      openPrompt(ex);
    }
    return;
  }

  if (event.target.closest('[data-prompt-close]')) {
    event.preventDefault();
    closePrompt();
    return;
  }

  if (event.target.closest('[data-prompt-copy]')) {
    event.preventDefault();
    copyPrompt();
  }
}

function onGalleryKey(event) {
  if (event.key === 'Escape') {
    if (promptPanel && !promptPanel.hidden) {
      closePrompt();
      return;
    }
    if (expanded) {
      if (window.history.state && window.history.state.nrEntry) window.history.back();
      else closeExpand(false);
    }
  }
}

document.addEventListener('click', onGalleryClick);
document.addEventListener('keydown', onGalleryKey);

/* ------------------------------------------------------------ the entrance */

function composeEntrance() {
  const gsap = window.gsap;
  if (!gsap || reduced) {
    html.classList.add('g-static');
    return;
  }

  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  /* The masthead headline is deliberately absent from this timeline. It is
     plain text that paints with the document and glitches itself in CSS, so it
     can never be held hostage by a CDN script that has not arrived yet. Only
     the secondary copy fades, and that is allowed to wait. */
  const fades = document.querySelectorAll('[data-reveal-fade]');

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });

  /* The CSS start states resolve to pixels in the computed matrix, so every
     entrance tween declares its own from-state rather than reading them back. */
  /* The old masthead rule is gone with the hero rebuild, so only tween what is
     actually on the page — GSAP warns loudly about empty targets otherwise. */
  const rule = document.querySelectorAll('[data-reveal-rule]');
  if (rule.length) intro.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.1 }, 0);
  if (fades.length) {
    intro.fromTo(fades, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.05, stagger: 0.055 }, 0.3);
  }

  /* A starved ticker — a tab that boots in the background — can resolve the
     timeline's clock without ever rendering it, reporting "finished" over copy
     that is still invisible. A timer is not rAF-driven, so it still fires in
     that state and asserts the resting values directly. */
  window.setTimeout(function () {
    intro.progress(1);
    if (rule.length) gsap.set(rule, { scaleX: 1 });
    if (fades.length) gsap.set(fades, { opacity: 1, y: 0 });
  }, 4000);

  if (!window.ScrollTrigger) {
    gsap.set('.card', { opacity: 1 });
    return;
  }

  /* The grid reveals row by row. Cards animate opacity only — transform is
     reserved for the hover lift, which CSS owns, so the two never fight. */
  gsap.fromTo(
    '.card',
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.9,
      stagger: 0.07,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.library__grid', start: 'top 82%', once: true }
    }
  );
}

/* ----------------------------------------------------------------- teardown */

function teardown() {
  stopClock();
  mountObserver.disconnect();
  resizeObserver.disconnect();
  clearTimeout(resizeTimer);
  if (dprQuery) dprQuery.removeEventListener('change', onPixelRatio);
  window.removeEventListener('popstate', onPopState);
  document.removeEventListener('visibilitychange', onVisibility);
  document.removeEventListener('click', onAnchorClick);
  document.removeEventListener('click', onGalleryClick);
  document.removeEventListener('keydown', onGalleryKey);
  closePrompt();
  closeExpand(true);
  exhibits.forEach((ex) => ex.destroy());
}
window.addEventListener('pagehide', teardown, { once: true });

/* --------------------------------------------------------------------- boot */

function boot() {
  try {
    composeEntrance();
  } catch (err) {
    html.classList.add('g-static');
  }
  updateProgress();
  startClock();

  /* Deep link: /gallery.html#ex-04 opens that exhibit directly. */
  const id = (window.location.hash || '').replace('#', '');
  if (id && MOVED[id] && !document.getElementById(id)) {
    location.replace(MOVED[id]);
    return;
  }
  if (id) {
    const target = exhibits.find((ex) => ex.el.id === id);
    if (target) {
      window.history.replaceState({ nrExhibit: target.id, nrEntry: false }, '', '#' + id);
      openExpand(target);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
