-- Award points when a tree is planted. Until now nothing wrote to point_events,
-- so total_points never moved however many trees someone logged.
--
-- Done in a trigger rather than in POST /api/dashboard/trees so the tree and its
-- points commit together, and so every insert path — the endpoint, the
-- insert_tree RPC, a direct PostgREST insert — awards the same points.
--
-- Only `source = 'planted'` trees earn points. Donated and earned entries have no
-- location and a self-reported quantity, so there is nothing to verify them by.
--
-- No backfill: trees inserted before this migration keep zero points.

-- One first-tree bonus per profile, even if two inserts race.
create unique index point_events_one_first_tree_per_profile
  on public.point_events (profile_id)
  where action_type = 'first_tree';

create or replace function public.award_points_for_planted_tree()
returns trigger
language plpgsql
-- point_events has no insert policy, so a signed-in user's own insert into
-- trees would otherwise fail here under RLS.
security definer
set search_path = public, extensions
as $$
begin
  if new.source <> 'planted' or new.planted_by is null then
    return new;
  end if;

  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  values (new.planted_by, 'plant_tree', 20, new.id, 'tree');

  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  values (new.planted_by, 'first_tree', 50, new.id, 'tree')
  on conflict (profile_id) where action_type = 'first_tree' do nothing;

  return new;
end;
$$;

-- Only ever meant to run as the trigger below; keep it off the RPC surface.
revoke execute on function public.award_points_for_planted_tree() from public, anon, authenticated;

create trigger on_tree_planted
  after insert on public.trees
  for each row execute function public.award_points_for_planted_tree();
