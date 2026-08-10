-- The previous "profiles: own update" policy had a broken correlation in its
-- WITH CHECK: the unqualified `id` inside the subquery bound to the subquery's
-- own table (profiles_1.id = profiles_1.id), making it uncorrelated. With >1
-- profile that subquery returns multiple rows and every self-update errors.
-- Recreate the policy with an explicit alias so the subquery correlates to the
-- outer row being updated, pinning `role` to its committed value.
drop policy if exists "profiles: own update" on public.profiles;

create policy "profiles: own update" on public.profiles
  for update
  using (auth.uid() = auth_user_id)
  with check (
    auth.uid() = auth_user_id
    and role = (select p2.role from public.profiles p2 where p2.id = profiles.id)
  );
