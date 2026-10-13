-- Award 1 point for suggesting a planting spot.
--
-- Same pattern as on_tree_planted (20261005122551): a trigger rather than the
-- endpoint, so every insert path awards the same point and the suggestion and
-- its point commit together.

-- 'suggest_spot' wasn't among the action types anticipated in the baseline
-- schema. point_events_action_type_check is Postgres' default name for an
-- unnamed column-level check, which is how the baseline defined it.
alter table public.point_events drop constraint point_events_action_type_check;
alter table public.point_events add constraint point_events_action_type_check
  check (action_type in ('plant_tree', 'update_tree', 'verify_tree',
                          'join_community', 'first_tree', 'streak_bonus',
                          'suggest_spot', 'custom'));

create or replace function public.award_points_for_planting_suggestion()
returns trigger
language plpgsql
-- point_events has no insert policy, so a signed-in user's own insert into
-- planting_suggestions would otherwise fail here under RLS.
security definer
set search_path = public, extensions
as $$
begin
  if new.suggested_by is null then
    return new;
  end if;

  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  values (new.suggested_by, 'suggest_spot', 1, new.id, 'planting_suggestion');

  return new;
end;
$$;

-- Only ever meant to run as the trigger below; keep it off the RPC surface.
revoke execute on function public.award_points_for_planting_suggestion() from public, anon, authenticated;

create trigger on_planting_suggestion_created
  after insert on public.planting_suggestions
  for each row execute function public.award_points_for_planting_suggestion();
