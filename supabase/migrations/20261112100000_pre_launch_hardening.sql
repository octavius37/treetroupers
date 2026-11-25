-- Pre-launch hardening.
--
-- 1. handle_new_user / sync_total_points: pinned search_path, off the RPC API.
-- 2. Rate limits, counted in the database so every serverless instance shares them.
-- 3. Deleting a tree takes back the points it paid.
-- 4. Tree proof photos readable only through the endpoints, which apply the
--    privacy rules; plus member_tree_map() and orphaned_tree_photos().

-- 1. ----------------------------------------------------------------------------
-- Supabase security advisor: "function_search_path_mutable" on both, and
-- handle_new_user (SECURITY DEFINER) was executable by anon/authenticated at
-- /rest/v1/rpc/handle_new_user. Both bodies use fully qualified names, so an
-- empty search_path changes nothing. Triggers don't need EXECUTE to fire.
alter function public.handle_new_user() set search_path = '';
alter function public.sync_total_points() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_total_points() from public, anon, authenticated;

-- 2. ----------------------------------------------------------------------------
-- One row per counted request. hit_rate_limit() records a hit and says whether
-- the key is still under its limit for the window. Only the service role uses it
-- (server/utils/rateLimit.ts); old rows are pruned per key on each call and in
-- bulk by the daily cleanup job.
create table public.rate_limit_hits (
  key text not null,
  hit_at timestamptz not null default now()
);
create index rate_limit_hits_key_hit_at_idx on public.rate_limit_hits (key, hit_at);
alter table public.rate_limit_hits enable row level security;
-- No policies: nobody but the service role reads or writes it.
revoke all on public.rate_limit_hits from anon, authenticated;

create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  recent integer;
begin
  -- Serialise calls for the same key, so two requests at once can't both pass
  -- the last free slot.
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  delete from public.rate_limit_hits
  where key = p_key and hit_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into recent from public.rate_limit_hits where key = p_key;
  if recent >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;

-- 3. ----------------------------------------------------------------------------
-- Deleting a tree (only admins can delete an approved one) inserts a negative
-- event for every kind of points it paid: plant/donate/earn, the first-tree
-- bonus and a streak bonus it triggered. Like suggestions and communities, it
-- reverses rather than deletes, because sync_total_points only reacts to
-- inserts and the ledger keeps the history.
--
-- The first-tree index allowed one first_tree row of any sign per profile,
-- which would block the reversal. It now counts only positive rows; a profile
-- whose bonus was reversed still can't earn a second one, since the original
-- positive row remains.
drop index public.point_events_one_first_tree_per_profile;
create unique index point_events_one_first_tree_per_profile
  on public.point_events (profile_id)
  where action_type = 'first_tree' and points > 0;

create or replace function public.reclaim_points_for_deleted_tree()
returns trigger
language plpgsql
-- point_events has no insert policy.
security definer
set search_path = ''
as $$
begin
  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  select e.profile_id, e.action_type, -sum(e.points), old.id, 'tree'
  from public.point_events e
  where e.reference_id = old.id
    and e.reference_type = 'tree'
    -- Deleting a profile cascades to its point_events; skip anything left
    -- pointing at a profile that is gone.
    and exists (select 1 from public.profiles p where p.id = e.profile_id)
  group by e.profile_id, e.action_type
  having sum(e.points) > 0;
  return old;
end;
$$;

revoke execute on function public.reclaim_points_for_deleted_tree() from public, anon, authenticated;

create trigger on_tree_deleted
  after delete on public.trees
  for each row execute function public.reclaim_points_for_deleted_tree();

-- The approval trigger's ON CONFLICT has to name the new index predicate.
-- Otherwise unchanged from 20261016080000_review_tree_logs_before_awarding_points.sql.
create or replace function public.award_points_for_approved_tree()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.review_status <> 'approved' or new.planted_by is null then
    return new;
  end if;
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

  -- See the original migration for why trees approved in this transaction
  -- don't count.
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
    on conflict (profile_id) where action_type = 'first_tree' and points > 0 do nothing;
  end if;

  return new;
end;
$$;

revoke execute on function public.award_points_for_approved_tree() from public, anon, authenticated;

-- 4. ----------------------------------------------------------------------------
-- "trees: members read" let any signed-in member read every row's photo_urls
-- over the REST API, including donation and earning proofs (receipts and
-- screenshots), which the privacy policy says only the planter and admins see.
-- Members keep every other column; photos come from the endpoints, which apply
-- the rules (the planter always, others only on approved planted trees).
-- Members still can't write trees at all (no insert/update policies since
-- 20261102125441), so only select needs narrowing.
--
-- Column grants don't extend to new columns: a column added to trees later
-- needs adding here too, or members can't read it.
revoke select on public.trees from anon, authenticated;
grant select (
  id, planted_by, species_id, community_id, status, notes, planted_at, created_at,
  source, quantity, donation_project, earned_activity, location, lat, lng,
  review_status, reviewed_by, reviewed_at, review_note
) on public.trees to anon, authenticated;
-- (anon has no read policy, so it still sees no rows; the grant just keeps that
-- an empty result rather than a permission error.)

-- trees_near_point returns whole rows, photo_urls included, and nothing in the
-- app calls it. Keep it for the service role only.
revoke execute on function public.trees_near_point(double precision, double precision, double precision) from public, anon, authenticated;

-- Every tree on the member map (pending and approved, not rejected), with the
-- photo only where the viewer may see it. One json value, so PostgREST's
-- max_rows can't cut the map short.
create or replace function public.member_tree_map(p_viewer uuid)
returns json
language sql
stable
set search_path = ''
as $$
  select coalesce(json_agg(json_build_object(
    'id', t.id,
    'source', t.source,
    'quantity', t.quantity,
    'status', t.status,
    'reviewStatus', t.review_status,
    'plantedAt', t.planted_at,
    'lat', t.lat,
    'lng', t.lng,
    'species', s.common_name,
    'plantedById', t.planted_by,
    'plantedBy', coalesce(nullif(p.display_name, ''), 'A Tree Trouper'),
    'photoUrl', case
      when t.planted_by = p_viewer or (t.review_status = 'approved' and t.source = 'planted')
        then t.photo_urls[1]
    end
  ) order by t.planted_at desc), '[]'::json)
  from public.trees t
  left join public.tree_species s on s.id = t.species_id
  left join public.profiles p on p.id = t.planted_by
  where t.review_status <> 'rejected';
$$;

revoke execute on function public.member_tree_map(uuid) from public, anon, authenticated;

-- Files in tree-photos that nothing references (a photo removed from a form, an
-- abandoned log, a deleted tree), older than the given age so forms still being
-- filled in keep theirs. The daily cleanup job deletes them through the Storage
-- API. SECURITY DEFINER to read storage.objects.
create or replace function public.orphaned_tree_photos(p_older_than_hours integer default 24, p_limit integer default 1000)
returns setof text
-- plpgsql, so creating it doesn't need storage.objects to exist yet (CI's
-- database runs without the Storage service).
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  with used as (
    select substring(u from '/tree-photos/(.+)$') as name from public.trees, unnest(photo_urls) u
    union
    select substring(u from '/tree-photos/(.+)$') from public.tree_updates, unnest(photo_urls) u
    union
    select substring(photo_url from '/tree-photos/(.+)$') from public.feed_posts where photo_url is not null
  )
  select o.name
  from storage.objects o
  where o.bucket_id = 'tree-photos'
    and o.created_at < now() - make_interval(hours => p_older_than_hours)
    and not exists (select 1 from used where used.name = o.name)
  order by o.created_at
  limit p_limit;
end;
$$;

revoke execute on function public.orphaned_tree_photos(integer, integer) from public, anon, authenticated;
