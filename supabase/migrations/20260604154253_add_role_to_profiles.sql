-- 1. Role enum
create type public.user_role as enum ('admin', 'user');

-- 2. Column with safe default
alter table public.profiles
  add column role public.user_role not null default 'user';

-- 3. Seed bootstrap admin by email
--    Kept verbatim from the original migration so replay matches production.
--    On a fresh local database this matches zero rows (migrations run before
--    seed.sql, so no auth users exist yet) — supabase/seed.sql promotes its own
--    admin explicitly instead.
update public.profiles p
set role = 'admin'
from auth.users u
where p.auth_user_id = u.id
  and u.email = 'p.bollerman@eceoffshore.com';

-- 4. Prevent self-promotion: replace the own-update policy with one that
--    forbids changing the role column. Service role bypasses RLS, so admin
--    endpoints are unaffected.
drop policy if exists "profiles: own update" on public.profiles;

create policy "profiles: own update" on public.profiles
  for update
  using (auth.uid() = auth_user_id)
  with check (
    auth.uid() = auth_user_id
    and role = (select role from public.profiles where id = profiles.id)
  );
