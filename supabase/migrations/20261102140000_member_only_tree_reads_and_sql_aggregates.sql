-- Review fixes for PR #23.
--
-- 1. Exact tree locations only for signed-in members.
--    "trees: public read" gave anyone with the public key every tree's exact
--    lat/lng and planted_by, so rounding locations on the public /map hid
--    nothing. Nothing public reads trees directly (the public pages go through
--    server endpoints that use the service role), so reads are now limited to
--    signed-in members, matching the privacy policy: members see exact
--    locations, visitors see the rounded /map.
drop policy "trees: public read" on public.trees;

create policy "trees: members read" on public.trees
  for select to authenticated using (true);

-- 2. Totals computed in the database.
--    The endpoints used to fetch every row and add up in JavaScript, which
--    PostgREST cuts off silently at max_rows (1000). Each function returns one
--    json value, so nothing is truncated. A "tree" is always counted by
--    quantity: a log of 50 donated trees is 50 trees everywhere.

-- Approved trees in the given communities (all communities when null): total
-- trees, trees this month (by planted_at), estimated CO₂ (planted trees with a
-- species only, as co2KgPerYear in shared/utils/co2.ts), and the top planters.
create or replace function public.tree_stats(p_community_ids uuid[] default null, p_top integer default 5)
returns json
language sql
stable
set search_path = public, extensions
as $$
  with scoped as (
    select t.planted_by, t.source, t.quantity, t.planted_at, s.avg_co2_kg_per_year
    from public.trees t
    left join public.tree_species s on s.id = t.species_id
    where t.review_status = 'approved'
      and (p_community_ids is null or t.community_id = any (p_community_ids))
  ),
  planters as (
    select p.id, p.display_name, p.avatar_url, sum(sc.quantity) as trees
    from scoped sc
    join public.profiles p on p.id = sc.planted_by
    group by p.id, p.display_name, p.avatar_url
    order by trees desc, p.display_name
    limit p_top
  )
  select json_build_object(
    'trees', (select coalesce(sum(quantity), 0) from scoped),
    'treesThisMonth', (
      select coalesce(sum(quantity), 0) from scoped
      where planted_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
    ),
    'co2KgPerYear', (
      select round(coalesce(sum(avg_co2_kg_per_year * quantity), 0))
      from scoped where source = 'planted'
    ),
    'topPlanters', coalesce((
      select json_agg(json_build_object(
        'id', id, 'name', coalesce(nullif(display_name, ''), 'A Tree Trouper'),
        'avatarUrl', avatar_url, 'trees', trees))
      from planters
    ), '[]'::json)
  );
$$;

-- Approved planted trees for the public map, located to 3 decimal places
-- (about 100 m), with no planter, photo or notes.
create or replace function public.public_tree_map()
returns json
language sql
stable
set search_path = public, extensions
as $$
  select coalesce(json_agg(json_build_object(
    'id', t.id,
    'species', coalesce(s.common_name, 'Tree'),
    'status', t.status,
    'plantedAt', t.planted_at,
    'lat', round(t.lat::numeric, 3),
    'lng', round(t.lng::numeric, 3)
  ) order by t.planted_at desc), '[]'::json)
  from public.trees t
  left join public.tree_species s on s.id = t.species_id
  where t.review_status = 'approved' and t.source = 'planted' and t.lat is not null and t.lng is not null;
$$;

-- Everyone's points for the leaderboard, optionally since a date (summed from
-- point_events) and for the members of some communities. All time, everyone in
-- scope is listed; since a date, only people who scored.
create or replace function public.leaderboard_points(p_since timestamptz default null, p_community_ids uuid[] default null)
returns json
language sql
stable
set search_path = public, extensions
as $$
  with scope as (
    select p.id, p.display_name, p.avatar_url, p.total_points
    from public.profiles p
    where p_community_ids is null
       or exists (select 1 from public.community_members m where m.profile_id = p.id and m.community_id = any (p_community_ids))
  ),
  scored as (
    select s.id, s.display_name, s.avatar_url,
      case when p_since is null then coalesce(s.total_points, 0)
           else coalesce((select sum(e.points) from public.point_events e where e.profile_id = s.id and e.created_at >= p_since), 0)
      end as points
    from scope s
  )
  select coalesce(json_agg(json_build_object(
    'id', id, 'name', coalesce(nullif(display_name, ''), 'A Tree Trouper'), 'avatarUrl', avatar_url, 'points', points
  ) order by points desc, display_name), '[]'::json)
  from scored
  where p_since is null or points > 0;
$$;

-- Only the service-role endpoints call these, so keep them off the public RPC
-- surface.
revoke execute on function public.tree_stats(uuid[], integer) from public, anon, authenticated;
revoke execute on function public.public_tree_map() from public, anon, authenticated;
revoke execute on function public.leaderboard_points(timestamptz, uuid[]) from public, anon, authenticated;

-- 3. Approving a community request in one transaction.
--    The endpoint created the community, added the requester as its admin and
--    marked the request approved in three requests; if a later one failed, the
--    request stayed pending and approving it again made a second community.
create or replace function public.approve_community_request(p_request_id uuid, p_slug text)
returns uuid
language plpgsql
set search_path = public, extensions
as $$
declare
  request public.community_requests;
  new_id uuid;
begin
  select * into request
  from public.community_requests
  where id = p_request_id and status = 'pending'
  for update;
  if not found then
    raise exception 'Community request % is not pending', p_request_id using errcode = 'P0002';
  end if;

  insert into public.communities (name, slug, description, type, parent_community_id)
  values (
    request.name,
    p_slug,
    coalesce(request.description, case when request.area is not null then 'Tree planting in ' || request.area || '.' end),
    'custom',
    request.parent_community_id
  )
  returning id into new_id;

  insert into public.community_members (community_id, profile_id, role)
  values (new_id, request.requested_by, 'admin')
  on conflict (profile_id, community_id) do update set role = 'admin';

  update public.community_requests
  set status = 'approved', community_id = new_id, reviewed_at = now()
  where id = p_request_id;

  return new_id;
end;
$$;

revoke execute on function public.approve_community_request(uuid, text) from public, anon, authenticated;
