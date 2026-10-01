-- Places members think a new tree could be planted. Shown on the
-- /dashboard/suggest map so the community can find spots to plant.
--
-- Writes go through server/api/dashboard/planting-suggestions* with the
-- service role behind authUserId(), so there are no insert/delete policies —
-- only a read policy for the map. Reads are limited to logged-in members:
-- notes are member-written and the only reader is the auth-protected
-- dashboard page, so there is no reason to expose them to the anon key.
create table public.planting_suggestions (
  id            uuid primary key default extensions.uuid_generate_v4(),
  suggested_by  uuid references public.profiles (id) on delete cascade,
  location      geography not null,
  lat           float8 generated always as (ST_Y(location::geometry)) stored,
  lng           float8 generated always as (ST_X(location::geometry)) stored,
  notes         text check (char_length(notes) <= 500),
  created_at    timestamptz not null default now()
);

create index planting_suggestions_location_idx on public.planting_suggestions using gist (location);
create index planting_suggestions_suggested_by_idx on public.planting_suggestions using btree (suggested_by);

alter table public.planting_suggestions enable row level security;

create policy "planting_suggestions: member read" on public.planting_suggestions
  for select to authenticated using (true);
