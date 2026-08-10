-- Baseline schema: everything that existed before migration tracking started.
--
-- The original schema was created through the Supabase dashboard, so no
-- migration ever recorded it. This file reconstructs it from the live database
-- so `supabase db reset` can build the schema from scratch locally.
--
-- Columns added by later migrations (profiles.bio, profiles.role, trees.lat,
-- trees.lng) are deliberately NOT here — they arrive in their own migrations so
-- the history replays in the same order it originally happened.

-- Extensions ---------------------------------------------------------------
-- Hosted Supabase installs uuid-ossp and pgcrypto into the `extensions` schema
-- and PostGIS into `public`; mirror that so `extensions.uuid_generate_v4()` and
-- bare PostGIS calls resolve identically here.
create schema if not exists extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema public;

-- Tables -------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key default extensions.uuid_generate_v4(),
  auth_user_id  uuid not null unique references auth.users (id) on delete cascade,
  display_name  text,
  avatar_url    text,
  total_points  integer not null default 0,
  created_at    timestamptz not null default now()
);

create table public.communities (
  id                   uuid primary key default extensions.uuid_generate_v4(),
  name                 text not null,
  slug                 text not null unique,
  description          text,
  type                 text not null default 'city'
                         check (type in ('city', 'region', 'national', 'global', 'custom')),
  geojson_area         jsonb,
  boundary             geography,
  parent_community_id  uuid references public.communities (id) on delete set null,
  created_at           timestamptz not null default now()
);

create table public.community_members (
  id            uuid primary key default extensions.uuid_generate_v4(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  community_id  uuid not null references public.communities (id) on delete cascade,
  role          text not null default 'member'
                  check (role in ('member', 'moderator', 'admin')),
  plan_id       text,
  joined_at     timestamptz not null default now(),
  unique (profile_id, community_id)
);

create table public.tree_species (
  id                   uuid primary key default extensions.uuid_generate_v4(),
  common_name          text not null,
  scientific_name      text not null unique,
  description          text,
  image_url            text,
  -- Created as integer originally; widened to numeric in a later migration.
  avg_co2_kg_per_year  integer default 0
);

create table public.trees (
  id            uuid primary key default extensions.uuid_generate_v4(),
  planted_by    uuid references public.profiles (id) on delete set null,
  species_id    uuid references public.tree_species (id) on delete set null,
  community_id  uuid references public.communities (id) on delete set null,
  location      geography not null,
  status        text not null default 'planted'
                  check (status in ('planted', 'growing', 'mature', 'removed')),
  notes         text,
  photo_urls    text[] not null default '{}'::text[],
  planted_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create table public.tree_updates (
  id          uuid primary key default extensions.uuid_generate_v4(),
  tree_id     uuid not null references public.trees (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  content     text,
  photo_urls  text[] not null default '{}'::text[],
  created_at  timestamptz not null default now()
);

create table public.point_events (
  id              uuid primary key default extensions.uuid_generate_v4(),
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  action_type     text not null
                    check (action_type in ('plant_tree', 'update_tree', 'verify_tree',
                                           'join_community', 'first_tree', 'streak_bonus',
                                           'custom')),
  points          integer not null,
  reference_id    uuid,
  reference_type  text,
  created_at      timestamptz not null default now()
);

create table public.rewards (
  id               uuid primary key default extensions.uuid_generate_v4(),
  title            text not null,
  description      text,
  points_required  integer not null,
  type             text not null default 'badge'
                     check (type in ('badge', 'discount', 'physical', 'custom')),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.reward_redemptions (
  id           uuid primary key default extensions.uuid_generate_v4(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  reward_id    uuid not null references public.rewards (id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'fulfilled', 'cancelled')),
  redeemed_at  timestamptz not null default now()
);

-- Indexes -----------------------------------------------------------------

create index communities_boundary_idx on public.communities using gist (boundary);
create index communities_parent_idx on public.communities using btree (parent_community_id);
create index communities_slug_idx on public.communities using btree (slug);

create index community_members_community_idx on public.community_members using btree (community_id);
create index community_members_profile_idx on public.community_members using btree (profile_id);

create index point_events_created_idx on public.point_events using btree (created_at desc);
create index point_events_profile_idx on public.point_events using btree (profile_id);

create index reward_redemptions_profile_idx on public.reward_redemptions using btree (profile_id);

create index tree_updates_author_idx on public.tree_updates using btree (author_id);
create index tree_updates_tree_idx on public.tree_updates using btree (tree_id);

create index trees_community_idx on public.trees using btree (community_id);
create index trees_location_idx on public.trees using gist (location);
create index trees_planted_by_idx on public.trees using btree (planted_by);
create index trees_species_idx on public.trees using btree (species_id);

-- Functions and triggers ---------------------------------------------------

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (auth_user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.total_points in step with the point_events ledger.
create or replace function public.sync_total_points()
returns trigger
language plpgsql
as $$
begin
  update public.profiles
  set total_points = total_points + new.points
  where id = new.profile_id;
  return new;
end;
$$;

create trigger on_point_event_inserted
  after insert on public.point_events
  for each row execute function public.sync_total_points();

-- Insert a tree from lat/lng, building the geography point server-side.
create or replace function public.insert_tree(
  p_planted_by uuid,
  p_species_id uuid,
  p_community_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_status text default 'planted',
  p_notes text default null,
  p_photo_urls text[] default '{}'::text[]
)
returns public.trees
language plpgsql
as $$
declare
  new_tree public.trees;
begin
  insert into public.trees
    (planted_by, species_id, community_id, location, status, notes, photo_urls)
  values
    (p_planted_by, p_species_id, p_community_id,
     ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
     p_status, p_notes, p_photo_urls)
  returning * into new_tree;
  return new_tree;
end;
$$;

-- Trees within p_metres of a point, for the map/AR features.
create or replace function public.trees_near_point(
  p_lat double precision,
  p_lng double precision,
  p_metres double precision default 500
)
returns setof public.trees
language sql
stable
as $$
  select * from public.trees
  where ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_metres
  );
$$;

-- Views --------------------------------------------------------------------

-- Ranked leaderboard with per-profile tree and update counts.
create or replace view public.leaderboard as
  select
    p.id,
    p.display_name,
    p.avatar_url,
    p.total_points,
    count(distinct t.id) as trees_planted,
    count(distinct tu.id) as updates_posted,
    rank() over (order by p.total_points desc) as rank
  from public.profiles p
    left join public.trees t on t.planted_by = p.id
    left join public.tree_updates tu on tu.author_id = p.id
  group by p.id, p.display_name, p.avatar_url, p.total_points;

-- Privileges ---------------------------------------------------------------
-- Hosted Supabase grants the API roles full table privileges and relies on RLS
-- to decide which rows each role may actually touch. Without these grants every
-- PostgREST request fails with "permission denied for table ..." before RLS is
-- ever consulted, so they must be part of the baseline.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;

-- Granted per-function rather than via ALL ROUTINES IN SCHEMA: PostGIS installs
-- ~1000 functions into `public` that this role does not own, and blanket-granting
-- over them emits a wall of "no privileges were granted" warnings.
grant execute on function public.insert_tree(uuid, uuid, uuid, double precision, double precision, text, text, text[])
  to anon, authenticated, service_role;
grant execute on function public.trees_near_point(double precision, double precision, double precision)
  to anon, authenticated, service_role;

-- Same treatment for anything future migrations create.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- Row Level Security -------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.tree_species enable row level security;
alter table public.trees enable row level security;
alter table public.tree_updates enable row level security;
alter table public.point_events enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

create policy "profiles: public read" on public.profiles
  for select using (true);

-- Superseded twice by later migrations (role guard added, then corrected).
create policy "profiles: own update" on public.profiles
  for update using (auth.uid() = auth_user_id);

create policy "communities: public read" on public.communities
  for select using (true);

create policy "community_members: public read" on public.community_members
  for select using (true);

create policy "community_members: own insert" on public.community_members
  for insert with check (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = community_members.profile_id)
  );

create policy "community_members: own delete" on public.community_members
  for delete using (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = community_members.profile_id)
  );

create policy "tree_species: public read" on public.tree_species
  for select using (true);

create policy "trees: public read" on public.trees
  for select using (true);

create policy "trees: authenticated insert" on public.trees
  for insert with check (auth.role() = 'authenticated');

create policy "trees: own update" on public.trees
  for update using (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = trees.planted_by)
  );

create policy "tree_updates: public read" on public.tree_updates
  for select using (true);

create policy "tree_updates: authenticated insert" on public.tree_updates
  for insert with check (auth.role() = 'authenticated');

create policy "tree_updates: own delete" on public.tree_updates
  for delete using (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = tree_updates.author_id)
  );

create policy "point_events: own read" on public.point_events
  for select using (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = point_events.profile_id)
  );

create policy "rewards: public read" on public.rewards
  for select using (active = true);

create policy "reward_redemptions: own read" on public.reward_redemptions
  for select using (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = reward_redemptions.profile_id)
  );

create policy "reward_redemptions: own insert" on public.reward_redemptions
  for insert with check (
    auth.uid() = (select p.auth_user_id from public.profiles p where p.id = reward_redemptions.profile_id)
  );
