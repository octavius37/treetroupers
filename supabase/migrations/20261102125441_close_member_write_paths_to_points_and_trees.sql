-- Two REST API write paths that went round the checks in the server endpoints.

-- 1. "profiles: own update" pinned `role` but left `total_points` writable, so a
--    signed-in member could set their own points with one PATCH to
--    /rest/v1/profiles. That has always skewed the leaderboard; since
--    20261016120000_rewards_join_and_streak_points.sql it also unlocks every
--    reward, because /api/dashboard/rewards/:id/claim checks total_points.
--
--    Pin total_points the same way as role. The ledger still moves it:
--    sync_total_points only runs from the security definer point triggers, as
--    their owner, which this policy doesn't apply to.
drop policy "profiles: own update" on public.profiles;

create policy "profiles: own update" on public.profiles
  for update
  using (auth.uid() = auth_user_id)
  with check (
    auth.uid() = auth_user_id
    and role = (select p2.role from public.profiles p2 where p2.id = profiles.id)
    and total_points = (select p2.total_points from public.profiles p2 where p2.id = profiles.id)
  );

-- 2. "trees: own insert" and "trees: own update" let a member write any column
--    of their own logs directly. guard_tree_review covers only the review
--    columns, so a member could still raise `quantity` or swap `photo_urls`
--    after a log was approved, attach a photo that isn't their own upload, or
--    set `created_at` to fake the streak bonus.
--
--    The app writes trees only through /api/dashboard/trees*, which use the
--    service role and check each field, so the API roles need no write access.
--    Dropping both policies, rather than guarding columns one by one, means a
--    column added later is covered too. The insert_tree RPC is security invoker,
--    so it is closed to members as well; nothing calls it.
drop policy "trees: own insert" on public.trees;
drop policy "trees: own update" on public.trees;
