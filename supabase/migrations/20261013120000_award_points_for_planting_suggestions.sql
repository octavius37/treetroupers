-- Award 1 point for suggesting a planting spot, and take it back if the
-- suggestion is deleted.
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

-- Members can remove their own suggestions, so without this, suggesting and
-- removing a spot over and over would add points with nothing left on the map.
-- The point is reversed with a -1 entry rather than deleted, because
-- sync_total_points only reacts to inserts.
create or replace function public.reclaim_points_for_planting_suggestion()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
  select pe.profile_id, 'suggest_spot', -pe.points, pe.reference_id, pe.reference_type
  from public.point_events pe
  where pe.reference_type = 'planting_suggestion'
    and pe.reference_id = old.id
    and pe.points > 0
    -- Deleting a profile cascades to its point_events and its suggestions.
    -- Today the point_events cascade runs first, leaving nothing to reverse,
    -- but that follows the order the foreign keys were created in. If it ever
    -- flips, a reversal for the deleted profile would fail the point_events
    -- foreign key and block the account deletion.
    and exists (select 1 from public.profiles p where p.id = pe.profile_id);

  return old;
end;
$$;

-- Only ever meant to run as the triggers below; keep them off the RPC surface.
revoke execute on function public.award_points_for_planting_suggestion() from public, anon, authenticated;
revoke execute on function public.reclaim_points_for_planting_suggestion() from public, anon, authenticated;

create trigger on_planting_suggestion_created
  after insert on public.planting_suggestions
  for each row execute function public.award_points_for_planting_suggestion();

create trigger on_planting_suggestion_deleted
  after delete on public.planting_suggestions
  for each row execute function public.reclaim_points_for_planting_suggestion();
