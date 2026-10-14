-- Move PostGIS from `public` into the `extensions` schema.
--
-- PostGIS creates its `spatial_ref_sys` table in whichever schema the extension
-- lives in. In `public` the REST API exposes it with RLS disabled, and `anon`
-- and `authenticated` hold every privilege on it, so anyone with the public key
-- could edit or delete the coordinate-system definitions that geography queries
-- rely on. Supabase's security advisor reports this as `rls_disabled_in_public`.
-- The table is owned by `supabase_admin`, so `postgres` can neither enable RLS
-- on it nor revoke those grants. `extensions` is not exposed by the API.
--
-- PostGIS has not been relocatable with `alter extension ... set schema` since
-- 2.3, so it is dropped and recreated, as Supabase's PostGIS guide describes.
-- Dropping it would delete every geography column, so their values are copied
-- into text columns first (hex EWKB, which converts back exactly) and restored
-- afterwards. The CLI applies a migration file as one transaction, so a failure
-- part-way leaves the database as it was.
--
-- The restored columns keep the types the hosted project has, which are
-- stricter than the baseline migration recorded for trees and communities.

-- 1. Copy the geography values somewhere that does not depend on PostGIS.
alter table public.trees add column location_backup text;
update public.trees set location_backup = location::text;

alter table public.planting_suggestions add column location_backup text;
update public.planting_suggestions set location_backup = location::text;

alter table public.communities add column boundary_backup text;
update public.communities set boundary_backup = boundary::text;

-- 2. Drop everything that uses a PostGIS type or function. The spatial indexes
--    and the `trees_location_required_when_planted` check go with the columns.
alter table public.trees
  drop column lat,
  drop column lng,
  drop column location;

alter table public.planting_suggestions
  drop column lat,
  drop column lng,
  drop column location;

alter table public.communities drop column boundary;

-- 3. No `cascade`: if anything else still depends on PostGIS this fails and the
--    whole migration rolls back, rather than silently dropping it.
drop extension postgis;
create extension postgis with schema extensions;

-- 4. Restore the columns, their values, indexes and constraints.
alter table public.trees add column location extensions.geography(Point, 4326);
update public.trees set location = location_backup::extensions.geography;
alter table public.trees
  drop column location_backup,
  add column lat float8 generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng float8 generated always as (extensions.st_x(location::extensions.geometry)) stored,
  add constraint trees_location_required_when_planted
    check (source <> 'planted' or location is not null);
create index trees_location_idx on public.trees using gist (location);

alter table public.planting_suggestions add column location extensions.geography;
update public.planting_suggestions set location = location_backup::extensions.geography;
alter table public.planting_suggestions
  alter column location set not null,
  drop column location_backup,
  add column lat float8 generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng float8 generated always as (extensions.st_x(location::extensions.geometry)) stored;
create index planting_suggestions_location_idx on public.planting_suggestions using gist (location);

alter table public.communities add column boundary extensions.geography(Polygon, 4326);
update public.communities set boundary = boundary_backup::extensions.geography;
alter table public.communities drop column boundary_backup;
create index communities_boundary_idx on public.communities using gist (boundary);

-- 5. These two call PostGIS without a schema prefix and used whatever
--    search_path the caller had. Pin it so they find PostGIS in `extensions`.
alter function public.insert_tree(uuid, uuid, uuid, double precision, double precision, text, text, text[])
  set search_path = public, extensions;
alter function public.trees_near_point(double precision, double precision, double precision)
  set search_path = public, extensions;
