-- Rewards members can see and claim, points for joining a community, and a
-- streak bonus.
--
-- Rewards unlock when a member's total points reach points_required. Points
-- are never spent, so claiming doesn't move anyone on the leaderboard. Badges
-- need no claim; other rewards (discounts, physical items) are claimed, and a
-- site admin fulfils the claim from /cms/rewards.

-- Claims go through POST /api/dashboard/rewards/:id/claim, which checks the
-- member has enough points. The baseline's own-insert policy let anyone insert
-- a claim for any reward directly, whatever their points.
drop policy "reward_redemptions: own insert" on public.reward_redemptions;

alter table public.reward_redemptions add column fulfilled_at timestamptz;

-- One open or fulfilled claim per member per reward; a cancelled one can be
-- claimed again.
create unique index reward_redemptions_one_claim
  on public.reward_redemptions (profile_id, reward_id)
  where status <> 'cancelled';

-- Joining a community: 10 points the first time, taken back on leaving, the
-- same way suggestions are. Each join and leave is a +10/-10 pair, so joining
-- and leaving in a loop nets nothing.
create or replace function public.award_points_for_joining_community()
returns trigger
language plpgsql
-- point_events has no insert policy.
security definer
set search_path = public, extensions
as $$
begin
  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  values (new.profile_id, 'join_community', 10, new.community_id, 'community');
  return new;
end;
$$;

create or replace function public.reclaim_points_for_leaving_community()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Deleting a profile cascades to its memberships. Its point_events go too,
  -- and a -10 for a profile that no longer exists would fail the foreign key
  -- and block the account deletion, so skip it.
  if not exists (select 1 from public.profiles p where p.id = old.profile_id) then
    return old;
  end if;

  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  values (old.profile_id, 'join_community', -10, old.community_id, 'community');
  return old;
end;
$$;

revoke execute on function public.award_points_for_joining_community() from public, anon, authenticated;
revoke execute on function public.reclaim_points_for_leaving_community() from public, anon, authenticated;

create trigger on_community_joined
  after insert on public.community_members
  for each row execute function public.award_points_for_joining_community();

create trigger on_community_left
  after delete on public.community_members
  for each row execute function public.reclaim_points_for_leaving_community();

-- The streak bonus: 25 points when a member has an approved log in each of 4
-- consecutive weeks, counted by when each log was made (created_at, which the
-- member can't set, unlike planted_at). It is checked whenever a log is
-- approved, against the week that log was made in, and paid at most once every
-- 4 weeks, so a long streak earns 25 every 4 weeks.
create or replace function public.award_streak_bonus()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  log_week date := date_trunc('week', new.created_at)::date;
begin
  if new.review_status <> 'approved' or new.planted_by is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.review_status = 'approved' then
    return new;
  end if;

  if (
    select count(distinct date_trunc('week', t.created_at))
    from public.trees t
    where t.planted_by = new.planted_by
      and t.review_status = 'approved'
      and t.created_at >= log_week - interval '3 weeks'
      and t.created_at < log_week + interval '1 week'
  ) < 4 then
    return new;
  end if;

  if exists (
    select 1 from public.point_events pe
    where pe.profile_id = new.planted_by
      and pe.action_type = 'streak_bonus'
      and pe.created_at > now() - interval '27 days'
  ) then
    return new;
  end if;

  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  values (new.planted_by, 'streak_bonus', 25, new.id, 'tree');
  return new;
end;
$$;

revoke execute on function public.award_streak_bonus() from public, anon, authenticated;

create trigger on_tree_approved_streak
  after insert or update of review_status on public.trees
  for each row execute function public.award_streak_bonus();
