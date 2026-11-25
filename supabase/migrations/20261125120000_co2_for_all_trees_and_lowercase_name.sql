-- 1. CO₂ for every approved tree, not only planted ones with a species.
--    Donated and earned logs may now say what kind of tree was planted
--    (trees.species_id was always nullable for them; the endpoint used to drop
--    it). A tree with no known species counts as an average mature tree,
--    22 kg a year, the same DEFAULT_CO2_KG_PER_YEAR as shared/utils/co2.ts.
-- 2. The fallback name for a member without a display name is "A tree
--    trouper", matching the site's lowercase "tree troupe". It appears in
--    tree_stats, leaderboard_points and member_tree_map, so all three are
--    replaced; only the CO₂ sum and that string change.

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
      select round(coalesce(sum(coalesce(avg_co2_kg_per_year, 22) * quantity), 0))
      from scoped
    ),
    'topPlanters', coalesce((
      select json_agg(json_build_object(
        'id', id, 'name', coalesce(nullif(display_name, ''), 'A tree trouper'),
        'avatarUrl', avatar_url, 'trees', trees))
      from planters
    ), '[]'::json)
  );
$$;

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
    'id', id, 'name', coalesce(nullif(display_name, ''), 'A tree trouper'), 'avatarUrl', avatar_url, 'points', points
  ) order by points desc, display_name), '[]'::json)
  from scored
  where p_since is null or points > 0;
$$;

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
    'plantedBy', coalesce(nullif(p.display_name, ''), 'A tree trouper'),
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

-- create or replace keeps existing grants, but restate them so this file
-- stands alone: only the service-role endpoints call these.
revoke execute on function public.tree_stats(uuid[], integer) from public, anon, authenticated;
revoke execute on function public.leaderboard_points(timestamptz, uuid[]) from public, anon, authenticated;
revoke execute on function public.member_tree_map(uuid) from public, anon, authenticated;
