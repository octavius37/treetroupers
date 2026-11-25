-- Achievement badges, more points badges, and partner discounts paused.
--
-- 1. A badge can now also need an achievement: `criteria` names what is
--    counted and `criteria_count` how many are needed. Both null means the
--    badge unlocks on points alone, as before. The badge unlocks when the
--    member has the points AND the achievement. Progress is counted live by
--    badge_progress(), not stored, so deleting a tree or a suggestion, or
--    leaving a like, moves it back, the same way it moves points back.
--    BADGE_CRITERIA in server/utils/badges.ts mirrors the list below.
-- 2. Five more points badges (Young Tree to Ancient Forest) and nine
--    achievement badges.
-- 3. There are no partner discounts yet, so discount rewards are switched off
--    (kept, not deleted, to bring back later from /cms/rewards).

-- 1. ---------------------------------------------------------------------------
alter table public.rewards
  add column criteria text
    check (criteria in (
      'planted_trees', 'trees', 'donated_trees', 'earned_trees', 'streaks',
      'suggestions', 'species', 'communities_founded', 'likes_given'
    )),
  add column criteria_count integer check (criteria_count > 0),
  add constraint rewards_criteria_complete
    check ((criteria is null) = (criteria_count is null)),
  add constraint rewards_criteria_badges_only
    check (criteria is null or type = 'badge');

-- What a member has done, for each criteria key. One json value, counted in
-- SQL so nothing is cut off at PostgREST's max_rows.
create or replace function public.badge_progress(p_profile_id uuid)
returns json
language sql
stable
set search_path = ''
as $$
  select json_build_object(
    -- Approved planted trees (one tree per log).
    'planted_trees', (
      select count(*) from public.trees
      where planted_by = p_profile_id and review_status = 'approved' and source = 'planted'
    ),
    -- Approved trees of every kind, by quantity.
    'trees', (
      select coalesce(sum(quantity), 0) from public.trees
      where planted_by = p_profile_id and review_status = 'approved'
    ),
    'donated_trees', (
      select count(*) from public.trees
      where planted_by = p_profile_id and review_status = 'approved' and source = 'donated'
    ),
    'earned_trees', (
      select count(*) from public.trees
      where planted_by = p_profile_id and review_status = 'approved' and source = 'earned'
    ),
    -- Streak bonuses kept: a reversed bonus (deleted tree) cancels out.
    'streaks', (
      select greatest(coalesce(sum(sign(points)), 0), 0) from public.point_events
      where profile_id = p_profile_id and action_type = 'streak_bonus'
    ),
    -- Spots currently suggested; deleting one takes it back.
    'suggestions', (
      select count(*) from public.planting_suggestions where suggested_by = p_profile_id
    ),
    -- Different species among approved planted trees.
    'species', (
      select count(distinct species_id) from public.trees
      where planted_by = p_profile_id and review_status = 'approved' and source = 'planted' and species_id is not null
    ),
    -- Community requests approved, so communities created.
    'communities_founded', (
      select count(*) from public.community_requests
      where requested_by = p_profile_id and status = 'approved'
    ),
    -- Likes and congratulations given.
    'likes_given', (
      select count(*) from public.post_likes where profile_id = p_profile_id
    )
  );
$$;

-- Only the service-role endpoints call it.
revoke execute on function public.badge_progress(uuid) from public, anon, authenticated;

-- 2. ---------------------------------------------------------------------------
-- Added only where no badge of that title exists yet, so a badge an admin has
-- already created by hand isn't duplicated.
insert into public.rewards (title, description, points_required, type, criteria, criteria_count)
select v.title, v.description, v.points_required, 'badge', v.criteria, v.criteria_count
from (values
  ('Young Tree', 'Awarded at 250 points.', 250, null, null),
  ('Grove', 'Awarded at 500 points.', 500, null, null),
  ('Woodland', 'Awarded at 1,000 points.', 1000, null, null),
  ('Forest', 'Awarded at 2,500 points.', 2500, null, null),
  ('Ancient Forest', 'Awarded at 5,000 points.', 5000, null, null),
  ('First Roots', 'Your first approved planted tree.', 0, 'planted_trees', 1),
  ('Ten Trees', '10 approved trees, planted, donated or earned.', 0, 'trees', 10),
  ('Hundred Trees', '100 approved trees, planted, donated or earned.', 0, 'trees', 100),
  ('Generous Donor', 'Your first approved donation.', 0, 'donated_trees', 1),
  ('Everyday Earner', 'Your first approved earned tree.', 0, 'earned_trees', 1),
  ('Four-Week Streak', 'A tree log approved in each of 4 weeks in a row.', 0, 'streaks', 1),
  ('Spot Scout', '5 planting spots suggested.', 0, 'suggestions', 5),
  ('Species Collector', '5 different species planted.', 0, 'species', 5),
  ('Troupe Founder', 'Started a new community.', 0, 'communities_founded', 1),
  ('Cheerleader', '25 likes and congratulations given.', 0, 'likes_given', 25)
) as v(title, description, points_required, criteria, criteria_count)
where not exists (
  select 1 from public.rewards r where r.type = 'badge' and lower(r.title) = lower(v.title)
);

-- 3. ---------------------------------------------------------------------------
update public.rewards set active = false where type = 'discount' and active;
