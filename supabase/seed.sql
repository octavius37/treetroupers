-- Local/CI seed data. Runs automatically after migrations on `supabase db reset`.
-- Never runs against remote — `supabase db push` only applies migrations.
--
-- Gives the app enough content to actually render: two logins, a community
-- hierarchy, species, trees with real coordinates, feed posts, points and CMS
-- pages. Deterministic UUIDs so tests can reference rows by literal id.

-- Note: the role migration's bootstrap-admin UPDATE cannot match anything here —
-- migrations run before this seed, when no auth users exist. Ada's admin role is
-- granted by the explicit UPDATE in the "Profiles" section below.

-- Auth users ---------------------------------------------------------------
-- Two accounts, both password `password123`:
--   admin@example.com  → role 'admin', can reach /cms
--   member@example.com → role 'user'
--
-- The `on_auth_user_created` trigger creates each profiles row automatically,
-- so we update those rows below rather than inserting them.
--
-- An `auth.identities` row per user is required: GoTrue's password grant looks
-- the user up through the identities table, so a users-only insert produces
-- "Invalid login credentials" even with a correct password hash.
--
-- The empty-string token columns are also required, not cosmetic. GoTrue scans
-- confirmation_token / recovery_token / email_change / email_change_token_* into
-- non-nullable Go strings, and those columns have no DEFAULT — so leaving them
-- NULL makes every login fail with a 500 "Database error querying schema"
-- ("converting NULL to string is unsupported"). Seed them as ''.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current
)
values
  (
    '00000000-0000-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'admin@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Ada Admin"}'::jsonb,
    '', '', '', '', ''
  ),
  (
    '00000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'member@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Milo Member"}'::jsonb,
    '', '', '', '', ''
  );

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
select
  extensions.uuid_generate_v4(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email in ('admin@example.com', 'member@example.com');

-- Profiles -----------------------------------------------------------------
-- Rows already exist via trigger; fill in the display fields and pin ids.

update public.profiles
set id = '00000000-0000-4000-b000-000000000001',
    display_name = 'Ada Admin',
    bio = 'Maintains the Tree Troupers platform.',
    role = 'admin'
where auth_user_id = '00000000-0000-4000-a000-000000000001';

update public.profiles
set id = '00000000-0000-4000-b000-000000000002',
    display_name = 'Milo Member',
    bio = 'Planted my first oak in 2024.'
where auth_user_id = '00000000-0000-4000-a000-000000000002';

-- Communities --------------------------------------------------------------
-- Nested hierarchy: Netherlands → Utrecht → Lombok, exercising the
-- self-referencing parent_community_id.

insert into public.communities (id, name, slug, description, type, parent_community_id)
values
  ('00000000-0000-4000-c000-000000000001', 'Netherlands', 'netherlands',
   'All Dutch troupes.', 'national', null),
  ('00000000-0000-4000-c000-000000000002', 'Utrecht', 'utrecht',
   'Tree planting across the city of Utrecht.', 'city',
   '00000000-0000-4000-c000-000000000001'),
  ('00000000-0000-4000-c000-000000000003', 'Lombok', 'lombok',
   'The Lombok neighbourhood troupe.', 'custom',
   '00000000-0000-4000-c000-000000000002');

insert into public.community_members (profile_id, community_id, role)
values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-c000-000000000002', 'admin'),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-c000-000000000002', 'member'),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-c000-000000000003', 'member');

-- Tree species -------------------------------------------------------------

insert into public.tree_species (id, common_name, scientific_name, description, avg_co2_kg_per_year)
values
  ('00000000-0000-4000-d000-000000000001', 'English Oak', 'Quercus robur',
   'Long-lived native oak; excellent for biodiversity.', 22.5),
  ('00000000-0000-4000-d000-000000000002', 'Silver Birch', 'Betula pendula',
   'Fast-growing pioneer species with distinctive white bark.', 12.0),
  ('00000000-0000-4000-d000-000000000003', 'Small-leaved Lime', 'Tilia cordata',
   'Common Dutch street tree; fragrant summer flowers.', 18.2),
  ('00000000-0000-4000-d000-000000000004', 'Common Beech', 'Fagus sylvatica',
   'Dense canopy, prefers well-drained soil.', 20.1);

-- Trees --------------------------------------------------------------------
-- Real Utrecht coordinates. `location` is built via ST_MakePoint(lng, lat) —
-- note the argument order — and lat/lng generated columns follow from it.

insert into public.trees (id, planted_by, species_id, community_id, location, status, notes, planted_at)
values
  ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-b000-000000000002',
   '00000000-0000-4000-d000-000000000001', '00000000-0000-4000-c000-000000000003',
   ST_SetSRID(ST_MakePoint(5.1080, 52.0930), 4326)::geography,
   'growing', 'Planted beside the canal path.', now() - interval '400 days'),
  ('00000000-0000-4000-e000-000000000002', '00000000-0000-4000-b000-000000000002',
   '00000000-0000-4000-d000-000000000002', '00000000-0000-4000-c000-000000000003',
   ST_SetSRID(ST_MakePoint(5.1105, 52.0948), 4326)::geography,
   'planted', 'Community planting day.', now() - interval '30 days'),
  ('00000000-0000-4000-e000-000000000003', '00000000-0000-4000-b000-000000000001',
   '00000000-0000-4000-d000-000000000003', '00000000-0000-4000-c000-000000000002',
   ST_SetSRID(ST_MakePoint(5.1214, 52.0907), 4326)::geography,
   'mature', 'Established lime near the station.', now() - interval '1200 days'),
  ('00000000-0000-4000-e000-000000000004', '00000000-0000-4000-b000-000000000001',
   '00000000-0000-4000-d000-000000000004', '00000000-0000-4000-c000-000000000002',
   ST_SetSRID(ST_MakePoint(5.1290, 52.0855), 4326)::geography,
   'growing', 'Park edge, partial shade.', now() - interval '200 days');

insert into public.tree_updates (tree_id, author_id, content, created_at)
values
  ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-b000-000000000002',
   'First leaves of the season are out.', now() - interval '20 days'),
  ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-b000-000000000001',
   'Verified — looking healthy.', now() - interval '18 days'),
  ('00000000-0000-4000-e000-000000000002', '00000000-0000-4000-b000-000000000002',
   'Added a support stake after the storm.', now() - interval '5 days');

-- Point events -------------------------------------------------------------
-- The on_point_event_inserted trigger rolls these into profiles.total_points,
-- so no manual total is set anywhere.

insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
values
  ('00000000-0000-4000-b000-000000000002', 'first_tree', 50,
   '00000000-0000-4000-e000-000000000001', 'tree'),
  ('00000000-0000-4000-b000-000000000002', 'plant_tree', 20,
   '00000000-0000-4000-e000-000000000001', 'tree'),
  ('00000000-0000-4000-b000-000000000002', 'plant_tree', 20,
   '00000000-0000-4000-e000-000000000002', 'tree'),
  ('00000000-0000-4000-b000-000000000002', 'update_tree', 5, null, 'tree_update'),
  ('00000000-0000-4000-b000-000000000002', 'join_community', 10,
   '00000000-0000-4000-c000-000000000003', 'community'),
  ('00000000-0000-4000-b000-000000000001', 'plant_tree', 20,
   '00000000-0000-4000-e000-000000000003', 'tree'),
  ('00000000-0000-4000-b000-000000000001', 'verify_tree', 15, null, 'tree');

-- Rewards ------------------------------------------------------------------

insert into public.rewards (id, title, description, points_required, type, active)
values
  ('00000000-0000-4000-f000-000000000001', 'Seedling Badge',
   'Awarded for planting your first tree.', 50, 'badge', true),
  ('00000000-0000-4000-f000-000000000002', 'Sapling Badge',
   'Awarded at 100 points.', 100, 'badge', true),
  ('00000000-0000-4000-f000-000000000003', 'Local Nursery Discount',
   '10% off at participating nurseries.', 250, 'discount', true),
  ('00000000-0000-4000-f000-000000000004', 'Retired Reward',
   'Inactive — should not appear in public listings.', 500, 'custom', false);

insert into public.reward_redemptions (profile_id, reward_id, status)
values
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-f000-000000000001', 'fulfilled');

-- CMS pages ----------------------------------------------------------------
-- Nav hierarchy + a draft, so the nav query and status filter both have
-- something to exercise.

insert into public.pages (id, title, slug, content, status, nav_order, show_in_nav, parent_id)
values
  ('00000000-0000-4000-0a00-000000000001', 'About', 'about',
   '<h1>About Tree Troupers</h1><p>We help neighbours plant and track trees together.</p>',
   'published', 1, true, null),
  ('00000000-0000-4000-0a00-000000000002', 'Our Mission', 'our-mission',
   '<h1>Our Mission</h1><p>A million community-planted trees.</p>',
   'published', 1, true, '00000000-0000-4000-0a00-000000000001'),
  ('00000000-0000-4000-0a00-000000000003', 'Get Involved', 'get-involved',
   '<h1>Get Involved</h1><p>Join a troupe near you.</p>',
   'published', 2, true, null),
  ('00000000-0000-4000-0a00-000000000004', 'Press Kit', 'press-kit',
   '<h1>Press Kit</h1><p>Draft — not yet public.</p>',
   'draft', 3, false, null);
