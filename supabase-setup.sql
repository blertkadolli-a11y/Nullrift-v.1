-- ===========================================================================
-- NULLRIFT — one-time Supabase setup
--
-- Paste this whole file into: Supabase dashboard → SQL Editor → New query → Run
-- Expected result: "Success. No rows returned."  That IS success for this kind
-- of statement; it is not an error.
--
-- Safe to run more than once — every statement is if-not-exists / drop-if-exists.
-- ===========================================================================


-- --- profiles: username + which profile picture you picked -----------------

create table if not exists public.profiles (
  user_id       uuid primary key references auth.users on delete cascade,
  username      text unique not null,
  avatar_preset text default 'a1',
  avatar_url    text,
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;

-- You can read and change your own row, and nobody else's. This is what
-- actually enforces the boundary — the site never holds an admin key.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = user_id);

-- Needed because the site upserts: an account created before this table
-- existed has no row, and an update against a missing row silently does
-- nothing at all.
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert with check (auth.uid() = user_id);


-- --- create the profile row automatically at sign-up -----------------------
--
-- Email confirmation is on, so sign-up returns no session and the browser has
-- no permission to insert anything. The username and picture travel in the
-- account's metadata instead, and this trigger writes the row. `security
-- definer` is what lets it write past row-level security.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base      text := coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user');
  candidate text := base;
  n         int  := 0;
begin
  -- If the username is taken, add a number rather than raising. A unique
  -- violation inside this trigger would abort the whole sign-up and show the
  -- visitor an unreadable database error.
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;

  insert into public.profiles (user_id, username, avatar_preset)
  values (new.id, candidate,
          coalesce(new.raw_user_meta_data->>'avatar_preset', 'a1'))
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- --- backfill: give existing accounts a profile row ------------------------
--
-- The trigger above only fires for NEW sign-ups. Anyone who registered before
-- this file was run has no profile row, which is why their picture could not
-- be changed. This gives them one, resolving username collisions the same way
-- the trigger does.

do $$
declare
  u    record;
  base text;
  cand text;
  n    int;
begin
  for u in select id, email, raw_user_meta_data from auth.users loop
    if exists (select 1 from public.profiles where user_id = u.id) then
      continue;
    end if;

    base := coalesce(
      nullif(u.raw_user_meta_data->>'username', ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'user'
    );
    cand := base;
    n := 0;
    while exists (select 1 from public.profiles where username = cand) loop
      n := n + 1;
      cand := base || n::text;
    end loop;

    insert into public.profiles (user_id, username, avatar_preset)
    values (u.id, cand, coalesce(u.raw_user_meta_data->>'avatar_preset', 'a1'));
  end loop;
end $$;


-- --- entitlements: who has paid --------------------------------------------
--
-- Not used yet (REQUIRE_PAID is false in api/prompt.mjs). Created now so the
-- paywall is a one-line change later instead of another trip through here.

create table if not exists public.entitlements (
  user_id    uuid primary key references auth.users on delete cascade,
  tier       text not null,
  created_at timestamptz default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement" on public.entitlements
  for select using (auth.uid() = user_id);


-- --- avatar uploads ---------------------------------------------------------
--
-- These policies sit on the storage table, not on the bucket, so they can be
-- created before the bucket exists. Creating the bucket itself is the one step
-- that has to be done in the dashboard UI:
--   Storage → New bucket → name it exactly `avatars` → Public bucket ON

drop policy if exists "avatars are public" on storage.objects;
create policy "avatars are public" on storage.objects
  for select using (bucket_id = 'avatars');

-- You may only write inside a folder named after your own user id.
drop policy if exists "write own avatar" on storage.objects;
create policy "write own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "replace own avatar" on storage.objects;
create policy "replace own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
