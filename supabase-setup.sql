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
-- Read by api/prompt.mjs once REQUIRE_PAID is true. Rows are written with the
-- service role (by hand, or by a payment webhook) — never from the browser.

create table if not exists public.entitlements (
  user_id    uuid primary key references auth.users on delete cascade,
  tier       text not null,
  created_at timestamptz default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);


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
