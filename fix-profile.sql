-- ===========================================================================
-- NULLRIFT — fix "new row violates row-level security policy for table profiles"
--
-- Two things are missing, both because your account was created BEFORE the
-- profiles table existed:
--
--   1. There is no profile row for you. The trigger only fires for NEW
--      sign-ups, so nothing was ever created for accounts that already existed.
--   2. There is no INSERT policy, so the site cannot create that row for you.
--
-- Paste this whole file into: Supabase → SQL Editor → New query → Run.
-- Expected: "Success. No rows returned."
-- Safe to run more than once.
-- ===========================================================================


-- 1. Let a signed-in person create their own profile row (and only their own).
--    The `with check` is what stops anyone writing a row for someone else.

drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert with check (auth.uid() = user_id);


-- 2. Give every existing account a profile row.
--    Username comes from what was typed at sign-up if it is still on the
--    account, otherwise from the email. Collisions get a number, same as the
--    trigger does.

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


-- 3. Check it worked. This one DOES return a row — you should see your
--    account listed with a username and a picture id like 'a1'.

select user_id, username, avatar_preset from public.profiles;
