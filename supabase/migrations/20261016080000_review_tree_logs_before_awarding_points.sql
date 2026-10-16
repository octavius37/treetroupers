-- Every tree log (planted, donated or earned) now needs a photo as proof, and an
-- admin approves or rejects it after looking at the photo. Points are paid on
-- approval, not on insert:
--
--   planted   20 (`plant_tree`), plus a one-off 50 (`first_tree`) for a
--             profile's first approved planted tree
--   donated    5 per tree (`donate_tree`), times the log's quantity
--   earned     2 per tree (`earn_tree`), times the log's quantity
--
-- There is no cap on quantity: the reviewer checks it against the photo.
--
-- Replaces the on_tree_planted trigger from
-- 20261005122551_award_points_for_planted_trees.sql, which paid planted trees
-- on insert and donated/earned trees nothing.

-- Review state, separate from `status`, which tracks the tree's life
-- (planted/growing/mature/removed). Existing rows are approved: they were
-- accepted under the old rules, and planted ones have already been paid. The
-- column is added with that default so the backfill needs no update (and fires
-- no trigger), then the default switches to 'pending' for new logs.
alter table public.trees
  add column review_status text not null default 'approved'
    check (review_status in ('pending', 'approved', 'rejected')),
  add column reviewed_by uuid references public.profiles (id) on delete set null,
  add column reviewed_at timestamptz;

alter table public.trees alter column review_status set default 'pending';

-- A log waiting for review must carry its proof. Approved and rejected rows are
-- exempt so that trees logged before photos were required stay valid.
alter table public.trees
  add constraint trees_photo_required_for_review
    check (review_status <> 'pending' or cardinality(photo_urls) > 0);

create index trees_pending_review_idx on public.trees (created_at)
  where review_status = 'pending';

alter table public.point_events drop constraint point_events_action_type_check;
alter table public.point_events add constraint point_events_action_type_check
  check (action_type in ('plant_tree', 'update_tree', 'verify_tree',
                          'join_community', 'first_tree', 'streak_bonus',
                          'suggest_spot', 'donate_tree', 'earn_tree', 'custom'));

-- Only admins review, and they do it through the service role
-- (PATCH /api/cms/trees/:id/review, behind requireAdmin). "trees: own insert"
-- and "trees: own update" would otherwise let a member approve their own log,
-- so for the API roles this forces new logs to pending and refuses any change to
-- the review columns. The service role and migrations/seed are not affected.
create or replace function public.guard_tree_review()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if tg_op = 'UPDATE' and old.review_status = 'approved' and new.review_status <> 'approved' then
    -- Its points have been paid, and nothing takes them back.
    raise exception 'An approved tree log cannot be un-approved'
      using errcode = 'check_violation';
  end if;

  if current_user not in ('anon', 'authenticated') then
    if tg_op = 'UPDATE' and new.review_status is distinct from old.review_status then
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.review_status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
  elsif new.review_status is distinct from old.review_status
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at then
    raise exception 'Only an admin can review a tree log'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger guard_tree_review
  before insert or update on public.trees
  for each row execute function public.guard_tree_review();

drop trigger on_tree_planted on public.trees;
drop function public.award_points_for_planted_tree();

create or replace function public.award_points_for_approved_tree()
returns trigger
language plpgsql
-- point_events has no insert policy.
security definer
set search_path = public, extensions
as $$
begin
  if new.review_status <> 'approved' or new.planted_by is null then
    return new;
  end if;
  -- Pay once, on the transition to approved (or an insert that is already
  -- approved, as in seed.sql). guard_tree_review stops it being un-approved and
  -- approved again.
  if tg_op = 'UPDATE' and old.review_status = 'approved' then
    return new;
  end if;

  if new.source = 'donated' then
    insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
    values (new.planted_by, 'donate_tree', 5 * new.quantity, new.id, 'tree');
    return new;
  end if;

  if new.source = 'earned' then
    insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
    values (new.planted_by, 'earn_tree', 2 * new.quantity, new.id, 'tree');
    return new;
  end if;

  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  values (new.planted_by, 'plant_tree', 20, new.id, 'tree');

  -- The bonus is for a profile's first approved planted tree, so anyone with a
  -- planted tree approved in an earlier transaction gets none. Trees from before
  -- this migration are approved with no reviewed_at, and count from created_at,
  -- so people who planted before points existed don't get it either.
  --
  -- Trees approved in the current transaction are not counted (guard_tree_review
  -- sets reviewed_at to now(), the transaction start, and created_at defaults
  -- to it). Row triggers fire after
  -- the whole statement, so in a multi-row insert or approval each row would
  -- otherwise see the others and nobody would get the bonus; the unique index
  -- point_events_one_first_tree_per_profile keeps it to one.
  if not exists (
    select 1 from public.trees t
    where t.planted_by = new.planted_by
      and t.id <> new.id
      and t.source = 'planted'
      and t.review_status = 'approved'
      and coalesce(t.reviewed_at, t.created_at) < now()
  ) then
    insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
    values (new.planted_by, 'first_tree', 50, new.id, 'tree')
    on conflict (profile_id) where action_type = 'first_tree' do nothing;
  end if;

  return new;
end;
$$;

-- Both are only ever meant to run as triggers; keep them off the RPC surface.
revoke execute on function public.guard_tree_review() from public, anon, authenticated;
revoke execute on function public.award_points_for_approved_tree() from public, anon, authenticated;

create trigger on_tree_approved
  after insert or update of review_status on public.trees
  for each row execute function public.award_points_for_approved_tree();

-- Count only approved trees, so the leaderboard's tree column agrees with its
-- points. Same columns and order as before; only the join condition changes.
create or replace view public.leaderboard
with (security_invoker = true) as
  select
    p.id,
    p.display_name,
    p.avatar_url,
    p.total_points,
    count(distinct t.id) as trees_planted,
    count(distinct tu.id) as updates_posted,
    rank() over (order by p.total_points desc) as rank
  from public.profiles p
    left join public.trees t on t.planted_by = p.id and t.review_status = 'approved'
    left join public.tree_updates tu on tu.author_id = p.id
  group by p.id, p.display_name, p.avatar_url, p.total_points;
