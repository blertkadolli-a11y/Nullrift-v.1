-- ===========================================================================
-- NULLRIFT — Supabase schema (matches the live project ehkhrlecjhyghzmeoakf)
--
-- Already applied to the live project. Kept here so a fresh project can be
-- rebuilt: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
-- ===========================================================================


-- --- profiles: username + profile picture ----------------------------------

create table if not exists public.profiles (
  user_id       uuid primary key references auth.users on delete cascade,
  username      text unique not null,
  avatar_preset text default 'a1',
  avatar_url    text,
  created_at    timestamptz default now()
);

alter table public.profiles drop constraint if exists profiles_username_shape;
alter table public.profiles add constraint profiles_username_shape
  check (char_length(username) between 2 and 32 and username = btrim(username));

alter table public.profiles enable row level security;

-- Each account can read, create and change only its own row. (select auth.uid())
-- is evaluated once per query instead of once per row.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- The site upserts, which needs INSERT rights even when the row exists.
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);


-- --- create the profile row automatically for every new account -------------
--
-- Works for password sign-ups (username in metadata), code sign-ins (no
-- metadata: falls back to the email), and Google/Apple/GitHub (full_name,
-- name, user_name, avatar_url / picture).

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base      text;
  candidate text;
  n         int := 0;
  pic       text := nullif(coalesce(meta->>'avatar_url', meta->>'picture'), '');
begin
  base := coalesce(
    nullif(btrim(meta->>'username'), ''),
    nullif(btrim(meta->>'user_name'), ''),
    nullif(btrim(meta->>'full_name'), ''),
    nullif(btrim(meta->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );
  base := left(btrim(regexp_replace(base, '\s+', ' ', 'g')), 24);
  if char_length(base) < 2 then base := 'user'; end if;
  candidate := base;

  -- Taken? Add a number instead of raising: an error here would abort the
  -- whole sign-up with an unreadable message.
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := left(base, 24 - char_length(n::text)) || n::text;
  end loop;

  insert into public.profiles (user_id, username, avatar_preset, avatar_url)
  values (new.id, candidate, coalesce(nullif(meta->>'avatar_preset', ''), 'a1'), pic)
  on conflict (user_id) do nothing;

  return new;
end $$;

-- Only the trigger runs it; it is not callable through the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- --- entitlements: who has paid ---------------------------------------------
--
-- One row per account. Written only by api/payment-webhook.mjs (Polar), through
-- grant_entitlement() / expire_entitlement() below, with the service-role key.
-- Never from the browser.
--
--   tier          monthly | pro | team
--   expires_at    null = never (Pro, Team). Monthly: end of the paid period
--                 plus a short grace, so a renewal webhook that lands a few
--                 minutes late does not lock a paying subscriber out.
--                 A refund or cancellation sets it to now() rather than
--                 deleting the row, so a late, out-of-order "active" event for
--                 the same subscription cannot quietly re-grant access.
--   period_start  Monthly only: start of the current billing month. The
--   period_end    3-unlock allowance counts unlocks made since period_start.
--   source        the Polar purchase that granted it: order:<id> or sub:<id>.
--   event_at      when Polar last changed that purchase; older news is ignored.

create table if not exists public.entitlements (
  user_id    uuid primary key references auth.users on delete cascade,
  tier       text not null,
  created_at timestamptz default now()
);

alter table public.entitlements
  add column if not exists expires_at   timestamptz,
  add column if not exists period_start timestamptz,
  add column if not exists period_end   timestamptz,
  add column if not exists source       text,
  add column if not exists event_at     timestamptz,
  add column if not exists updated_at   timestamptz default now(),
  -- When the current purchase was made. Pro and Team include every system
  -- released in the 12 months after it (api/prompt.mjs + RELEASED in
  -- api/_data/prompt-bodies.mjs); a new purchase restarts the window.
  add column if not exists granted_at   timestamptz default now();

alter table public.entitlements drop constraint if exists entitlements_tier_check;
alter table public.entitlements add constraint entitlements_tier_check
  check (tier in ('monthly', 'pro', 'team'));

create index if not exists entitlements_source_idx on public.entitlements (source);

alter table public.entitlements enable row level security;

drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);


-- --- pending_entitlements: paid before having an account --------------------
--
-- Someone who pays with an email that has no confirmed NULLRIFT account yet.
-- The row waits here and moves into entitlements the moment an account with
-- that email is confirmed (trigger below). Service role only: no policies.

create table if not exists public.pending_entitlements (
  email        text primary key,          -- always lower-cased
  tier         text not null check (tier in ('monthly', 'pro', 'team')),
  expires_at   timestamptz,
  period_start timestamptz,
  period_end   timestamptz,
  source       text not null,
  event_at     timestamptz,
  created_at   timestamptz default now()
);

alter table public.pending_entitlements enable row level security;
revoke all on public.pending_entitlements from anon, authenticated;


-- --- unlocks: which prompts a Monthly subscriber has opened -----------------
--
-- Monthly is "any 3 systems per billing month; anything you unlock stays
-- unlocked while subscribed". A row here is one of those unlocks. Only
-- prompt_access() writes them, so the allowance cannot be skipped from the
-- browser.

create table if not exists public.unlocks (
  user_id     uuid not null references auth.users on delete cascade,
  prompt_id   text not null check (prompt_id ~ '^[0-9]{1,4}$'),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

alter table public.unlocks enable row level security;

drop policy if exists "read own unlocks" on public.unlocks;
create policy "read own unlocks" on public.unlocks
  for select to authenticated using ((select auth.uid()) = user_id);


-- --- the gate: may this account read this prompt? ---------------------------
--
-- Called by api/prompt.mjs with the visitor's own token, so auth.uid() is the
-- visitor. p_unlock = false only reports; true also spends one of the month's
-- unlocks if needed. The entitlement row is locked while it counts, so two
-- tabs unlocking at once cannot both take the last slot.
--
-- status: unlocked | unlock_available | allowance_spent | payment_required
--         | sign_in_required

create or replace function public.prompt_access(p_prompt_id text, p_unlock boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid       uuid := auth.uid();
  e         public.entitlements%rowtype;
  allowance constant int := 3;   -- the "3 systems per billing month" on the Monthly card
  used      int;
begin
  if uid is null then
    return jsonb_build_object('status', 'sign_in_required');
  end if;

  if p_unlock then
    select * into e from public.entitlements where user_id = uid for update;
  else
    select * into e from public.entitlements where user_id = uid;
  end if;

  if not found or (e.expires_at is not null and e.expires_at <= now()) then
    return jsonb_build_object('status', 'payment_required');
  end if;

  if e.tier <> 'monthly' then
    return jsonb_build_object('status', 'unlocked', 'tier', e.tier,
      'granted_at', coalesce(e.granted_at, e.created_at));
  end if;

  if exists (select 1 from public.unlocks u
              where u.user_id = uid and u.prompt_id = p_prompt_id) then
    return jsonb_build_object('status', 'unlocked', 'tier', 'monthly');
  end if;

  select count(*) into used from public.unlocks u
   where u.user_id = uid and u.unlocked_at >= coalesce(e.period_start, e.created_at);

  if used >= allowance then
    return jsonb_build_object('status', 'allowance_spent', 'tier', 'monthly',
      'allowance', allowance, 'remaining', 0, 'refills_at', e.period_end);
  end if;

  if not p_unlock then
    return jsonb_build_object('status', 'unlock_available', 'tier', 'monthly',
      'allowance', allowance, 'remaining', allowance - used, 'refills_at', e.period_end);
  end if;

  insert into public.unlocks (user_id, prompt_id) values (uid, p_prompt_id)
  on conflict do nothing;

  return jsonb_build_object('status', 'unlocked', 'tier', 'monthly',
    'allowance', allowance, 'remaining', allowance - used - 1, 'refills_at', e.period_end);
end $$;

revoke all on function public.prompt_access(text, boolean) from public, anon;
grant execute on function public.prompt_access(text, boolean) to authenticated;


-- --- writes from the payment webhook (service role only) --------------------

create or replace function public.tier_rank(p_tier text)
returns int language sql immutable set search_path = '' as $$
  select case p_tier when 'team' then 3 when 'pro' then 2 when 'monthly' then 1 else 0 end
$$;

-- Give an account a plan. p_user is the NULLRIFT user id the checkout link
-- carried; if it is missing or not a real account, the buyer is matched by
-- their confirmed email instead, and failing that the purchase is parked in
-- pending_entitlements until that email signs up.
--
-- A live better plan is never replaced by a lesser one (a Pro buyer who also
-- subscribes to Monthly keeps Pro), and older news about the same purchase
-- never overwrites newer news.
create or replace function public.grant_entitlement(
  p_user uuid, p_email text, p_tier text,
  p_expires_at timestamptz, p_period_start timestamptz, p_period_end timestamptz,
  p_source text, p_event_at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := p_user;
  em  text := lower(nullif(trim(coalesce(p_email, '')), ''));
  cur public.entitlements%rowtype;
begin
  if p_tier not in ('monthly', 'pro', 'team') then
    raise exception 'unknown tier %', p_tier;
  end if;

  if uid is not null and not exists (select 1 from auth.users where id = uid) then
    uid := null;
  end if;

  -- Confirmed emails only: an unconfirmed account with the buyer's address
  -- could belong to anyone.
  if uid is null and em is not null then
    select id into uid from auth.users
     where lower(email) = em and email_confirmed_at is not null
     order by created_at limit 1;
  end if;

  if uid is null then
    if em is null then
      raise exception 'purchase % has neither a user id nor an email', p_source;
    end if;
    insert into public.pending_entitlements as pe
      (email, tier, expires_at, period_start, period_end, source, event_at)
    values (em, p_tier, p_expires_at, p_period_start, p_period_end, p_source, p_event_at)
    on conflict (email) do update set
      tier = excluded.tier, expires_at = excluded.expires_at,
      period_start = excluded.period_start, period_end = excluded.period_end,
      source = excluded.source, event_at = excluded.event_at
    where (pe.source = excluded.source
           and coalesce(pe.event_at, '-infinity') <= coalesce(excluded.event_at, 'infinity'))
       or public.tier_rank(excluded.tier) >= public.tier_rank(pe.tier);
    return jsonb_build_object('result', 'pending', 'email', em);
  end if;

  select * into cur from public.entitlements where user_id = uid for update;
  if found then
    if cur.source = p_source and cur.event_at is not null and p_event_at is not null
       and cur.event_at > p_event_at then
      return jsonb_build_object('result', 'stale', 'user_id', uid);
    end if;
    if cur.source is distinct from p_source
       and (cur.expires_at is null or cur.expires_at > now())
       and public.tier_rank(cur.tier) > public.tier_rank(p_tier) then
      return jsonb_build_object('result', 'kept', 'user_id', uid, 'tier', cur.tier);
    end if;
  end if;

  insert into public.entitlements as e
    (user_id, tier, expires_at, period_start, period_end, source, event_at, updated_at, granted_at)
  values (uid, p_tier, p_expires_at, p_period_start, p_period_end, p_source, p_event_at, now(),
          coalesce(p_event_at, now()))
  on conflict (user_id) do update set
    tier = excluded.tier, expires_at = excluded.expires_at,
    period_start = excluded.period_start, period_end = excluded.period_end,
    source = excluded.source, event_at = excluded.event_at, updated_at = now(),
    -- Same purchase changing state keeps its date; a new purchase restarts it.
    granted_at = case when e.source is distinct from excluded.source
                      then excluded.granted_at else coalesce(e.granted_at, excluded.granted_at) end;

  return jsonb_build_object('result', 'granted', 'user_id', uid, 'tier', p_tier);
end $$;

-- End a purchase's access (refund, cancellation, failed renewal). Expires the
-- row instead of deleting it; see the note on entitlements above.
create or replace function public.expire_entitlement(p_source text, p_event_at timestamptz)
returns int language plpgsql security definer set search_path = '' as $$
declare n int; m int;
begin
  update public.entitlements
     set expires_at = least(coalesce(expires_at, now()), now()),
         event_at = coalesce(p_event_at, event_at), updated_at = now()
   where source = p_source
     and (event_at is null or p_event_at is null or event_at <= p_event_at);
  get diagnostics n = row_count;
  delete from public.pending_entitlements where source = p_source;
  get diagnostics m = row_count;
  return n + m;
end $$;

revoke all on function public.grant_entitlement(uuid, text, text, timestamptz, timestamptz, timestamptz, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.expire_entitlement(text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.grant_entitlement(uuid, text, text, timestamptz, timestamptz, timestamptz, text, timestamptz)
  to service_role;
grant execute on function public.expire_entitlement(text, timestamptz) to service_role;


-- --- hand a parked purchase to the account that confirms its email ---------

create or replace function public.claim_pending_entitlements()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.pending_entitlements%rowtype;
begin
  if new.email is null or new.email_confirmed_at is null then return new; end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null
     and old.email is not distinct from new.email then
    return new;
  end if;

  select * into p from public.pending_entitlements where email = lower(new.email);
  if not found then return new; end if;

  -- Never let a purchase hand-over break sign-up itself.
  begin
    perform public.grant_entitlement(new.id, null, p.tier, p.expires_at,
      p.period_start, p.period_end, p.source, p.event_at);
    delete from public.pending_entitlements where email = p.email;
  exception when others then
    raise warning 'claim_pending_entitlements(%): %', new.id, sqlerrm;
  end;
  return new;
end $$;

revoke all on function public.claim_pending_entitlements() from public, anon, authenticated;

drop trigger if exists on_auth_user_claim_purchases on auth.users;
create trigger on_auth_user_claim_purchases
  after insert or update of email_confirmed_at, email on auth.users
  for each row execute function public.claim_pending_entitlements();


-- --- avatar uploads -----------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152,
        array['image/png','image/jpeg','image/webp','image/gif','image/avif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket: files are served by URL without a SELECT policy. The policies
-- below only let each account manage files inside a folder named after its id.
drop policy if exists "avatars are public" on storage.objects;

drop policy if exists "read own avatar" on storage.objects;
create policy "read own avatar" on storage.objects
  for select to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "write own avatar" on storage.objects;
create policy "write own avatar" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "replace own avatar" on storage.objects;
create policy "replace own avatar" on storage.objects
  for update to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "delete own avatar" on storage.objects;
create policy "delete own avatar" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
