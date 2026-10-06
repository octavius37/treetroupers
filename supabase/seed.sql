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

-- The rest of the hosted project's species list, copied from production so local
-- development sees the same choices. The four above keep fixed ids because the
-- seeded trees below reference them; these get generated ids.
insert into public.tree_species (common_name, scientific_name, description, avg_co2_kg_per_year)
values
  ('African Baobab', 'Adansonia digitata',
   'Iconic long-lived African tree with a massive water-storing trunk.', 12.0),
  ('Almond', 'Prunus dulcis',
   'Early-flowering tree grown commercially for its edible seed.', 9.0),
  ('American Basswood', 'Tilia americana',
   'North American lime relative with fragrant summer flowers.', 19.0),
  ('American Beech', 'Fagus grandifolia',
   'Smooth-barked beech native to eastern North America.', 18.0),
  ('American Hornbeam', 'Carpinus caroliniana',
   'Small understorey tree, also called musclewood.', 10.5),
  ('American Sweetgum', 'Liquidambar styraciflua',
   'Star-shaped leaves that turn brilliant colours in autumn.', 23.5),
  ('American Sycamore', 'Platanus occidentalis',
   'Large fast-growing tree with distinctive mottled bark.', 26.0),
  ('Apple', 'Malus domestica',
   'Widely cultivated orchard tree grown for its edible fruit.', 8.0),
  ('Aspen', 'Populus tremula',
   'Suckering pioneer species with famously trembling leaves.', 16.0),
  ('Atlas Cedar', 'Cedrus atlantica',
   'North African cedar, popular ornamental with blue-green forms.', 16.0),
  ('Austrian Pine', 'Pinus nigra',
   'Hardy, wind-tolerant pine often planted as a windbreak.', 14.5),
  ('Avocado', 'Persea americana',
   'Evergreen tree grown for its nutrient-rich fruit.', 12.5),
  ('Big-leaf Mahogany', 'Swietenia macrophylla',
   'Tropical hardwood tree, heavily logged for its fine timber.', 19.0),
  ('Black Alder', 'Alnus glutinosa',
   'Wetland-tolerant native, fixes nitrogen via root nodules.', 14.0),
  ('Black Cherry', 'Prunus serotina',
   'North American cherry valued for its dark timber.', 15.5),
  ('Black Locust', 'Robinia pseudoacacia',
   'Fast-growing, nitrogen-fixing tree with fragrant flowers.', 20.0),
  ('Black Mulberry', 'Morus nigra',
   'Long-lived tree grown for its dark, edible berries.', 10.0),
  ('Black Poplar', 'Populus nigra',
   'Fast-growing riverside native, now rare in pure form.', 22.0),
  ('Black Walnut', 'Juglans nigra',
   'Large North American timber tree with allelopathic roots.', 24.0),
  ('Blackthorn', 'Prunus spinosa',
   'Thorny hedgerow shrub/tree; fruit used for sloe gin.', 6.5),
  ('Blue Gum Eucalyptus', 'Eucalyptus globulus',
   'Extremely fast-growing Australian native, widely planted for timber.', 28.0),
  ('Bur Oak', 'Quercus macrocarpa',
   'Drought- and cold-hardy oak with large fringed acorns.', 22.0),
  ('Cedar of Lebanon', 'Cedrus libani',
   'Iconic long-lived cedar with a wide, flat-topped crown.', 17.5),
  ('Coast Redwood', 'Sequoia sempervirens',
   'One of the world''s tallest trees, native to coastal California.', 30.0),
  ('Coconut Palm', 'Cocos nucifera',
   'Iconic tropical palm grown for its versatile fruit.', 13.5),
  ('Common Fig', 'Ficus carica',
   'Mediterranean tree grown for its sweet, edible fruit.', 6.5),
  ('Common Hawthorn', 'Crataegus monogyna',
   'Thorny hedgerow tree with white spring blossom.', 7.5),
  ('Common Hazel', 'Corylus avellana',
   'Multi-stemmed shrub/tree, coppiced for centuries; edible nuts.', 8.0),
  ('Common Hornbeam', 'Carpinus betulus',
   'Dense, slow-growing tree often used for hedging.', 17.2),
  ('Common Juniper', 'Juniperus communis',
   'Slow-growing shrub/tree with berry-like cones used to flavour gin.', 5.5),
  ('Common Lime', 'Tilia x europaea',
   'Widely planted hybrid lime, popular avenue tree.', 20.5),
  ('Common Persimmon', 'Diospyros virginiana',
   'Slow-growing tree producing sweet orange fruit after frost.', 9.5),
  ('Common Walnut', 'Juglans regia',
   'Grown for timber and edible nuts across temperate Europe.', 17.0),
  ('Common Yew', 'Taxus baccata',
   'Slow-growing, extremely long-lived evergreen conifer.', 9.0),
  ('Cork Oak', 'Quercus suber',
   'Evergreen Mediterranean oak harvested for cork bark.', 17.0),
  ('Crab Apple', 'Malus sylvestris',
   'Wild ancestor of the cultivated apple; spring blossom.', 8.5),
  ('Date Palm', 'Phoenix dactylifera',
   'Long-lived desert palm grown for its sweet edible fruit.', 11.0),
  ('Dawn Redwood', 'Metasequoia glyptostroboides',
   'Deciduous conifer once known only from fossils.', 20.0),
  ('Deodar Cedar', 'Cedrus deodara',
   'Graceful drooping cedar from the western Himalayas.', 16.5),
  ('Douglas Fir', 'Pseudotsuga menziesii',
   'Tall, fast-growing conifer valued for timber.', 24.0),
  ('Downy Birch', 'Betula pubescens',
   'Hardy birch of wetter, more northern sites than Silver Birch.', 11.0),
  ('Eastern Redbud', 'Cercis canadensis',
   'Small tree covered in pink-purple flowers in early spring.', 9.0),
  ('Eastern White Pine', 'Pinus strobus',
   'Tall, soft-needled pine native to eastern North America.', 17.0),
  ('English Elm', 'Ulmus procera',
   'Once-dominant hedgerow elm, devastated by Dutch elm disease.', 20.0),
  ('European Ash', 'Fraxinus excelsior',
   'Tall native tree; UK/EU populations under threat from ash dieback.', 16.5),
  ('European Larch', 'Larix decidua',
   'Deciduous conifer that sheds its needles each autumn.', 13.1),
  ('European Plum', 'Prunus domestica',
   'Orchard tree grown for its edible stone fruit.', 7.5),
  ('Field Maple', 'Acer campestre',
   'Small hedgerow maple, common in mixed European woodland.', 13.5),
  ('Flowering Dogwood', 'Cornus florida',
   'Small ornamental tree with showy white or pink bracts.', 7.5),
  ('Giant Sequoia', 'Sequoiadendron giganteum',
   'Massive long-lived conifer, among the largest living things.', 32.0),
  ('Goat Willow', 'Salix caprea',
   'Early-flowering willow important for spring pollinators.', 10.0),
  ('Golden Rain Tree', 'Koelreuteria paniculata',
   'Ornamental tree with yellow flowers and papery seed pods.', 9.0),
  ('Green Ash', 'Fraxinus pennsylvanica',
   'Widely planted North American ash, hit hard by emerald ash borer.', 16.0),
  ('Holm Oak', 'Quercus ilex',
   'Evergreen Mediterranean oak, tolerant of coastal exposure.', 18.5),
  ('Honey Locust', 'Gleditsia triacanthos',
   'Tough, adaptable tree often planted as a thornless cultivar.', 18.5),
  ('Horse Chestnut', 'Aesculus hippocastanum',
   'Broad canopy tree known for spring flower spikes and conkers.', 19.4),
  ('Indian Banyan', 'Ficus benghalensis',
   'Sprawling fig tree that grows aerial prop roots.', 15.0),
  ('Italian Alder', 'Alnus cordata',
   'Fast-growing ornamental alder, tolerant of dry sites.', 13.0),
  ('Jacaranda', 'Jacaranda mimosifolia',
   'Ornamental tree famous for its vivid purple spring flowers.', 11.0),
  ('Large-leaved Lime', 'Tilia platyphyllos',
   'Native lime with larger leaves than Small-leaved Lime.', 21.5),
  ('Lemon', 'Citrus limon',
   'Evergreen citrus tree grown for its acidic edible fruit.', 9.5),
  ('Leyland Cypress', 'x Cupressocyparis leylandii',
   'Extremely fast-growing hybrid conifer used for hedging.', 12.5),
  ('London Plane', 'Platanus x hispanica',
   'Pollution-tolerant hybrid, widely planted as a street tree.', 24.0),
  ('Monterey Pine', 'Pinus radiata',
   'Fast-growing pine widely used in commercial forestry.', 21.0),
  ('Narrow-leaved Ash', 'Fraxinus angustifolia',
   'Southern European ash, more drought-tolerant than F. excelsior.', 15.5),
  ('Neem', 'Azadirachta indica',
   'Fast-growing tropical tree valued for medicinal and pesticidal uses.', 13.0),
  ('Noble Fir', 'Abies procera',
   'Popular Christmas-tree species from the Pacific Northwest.', 15.5),
  ('Norway Maple', 'Acer platanoides',
   'Popular urban shade tree with vivid autumn colour.', 15.0),
  ('Norway Spruce', 'Picea abies',
   'Evergreen conifer, the traditional European Christmas tree.', 12.4),
  ('Olive', 'Olea europaea',
   'Slow-growing, drought-tolerant evergreen grown for its fruit and oil.', 8.5),
  ('Pear', 'Pyrus communis',
   'Orchard tree grown for its edible fruit, popular in Europe.', 8.5),
  ('Pin Oak', 'Quercus palustris',
   'Fast-growing American oak that tolerates wet clay soils.', 22.5),
  ('Red Maple', 'Acer rubrum',
   'Adaptable North American maple with brilliant red autumn foliage.', 18.0),
  ('Red Oak', 'Quercus rubra',
   'Fast-growing North American oak with vivid red autumn colour.', 25.0),
  ('River Red Gum', 'Eucalyptus camaldulensis',
   'Iconic Australian eucalypt of river floodplains.', 24.0),
  ('Rowan', 'Sorbus aucuparia',
   'Small hardy native tree with bright orange autumn berries.', 9.0),
  ('Scots Pine', 'Pinus sylvestris',
   'Evergreen conifer, thrives in poor sandy soils.', 10.2),
  ('Sessile Oak', 'Quercus petraea',
   'Hardy upland oak, more drought-tolerant than English Oak.', 21.3),
  ('Silver Fir', 'Abies alba',
   'European mountain fir with silvery needle undersides.', 14.0),
  ('Silver Maple', 'Acer saccharinum',
   'Very fast-growing North American maple with brittle wood.', 27.5),
  ('Sitka Spruce', 'Picea sitchensis',
   'Fast-growing commercial timber conifer from North America.', 16.0),
  ('Southern Magnolia', 'Magnolia grandiflora',
   'Evergreen magnolia with large fragrant white flowers.', 11.0),
  ('Sugar Maple', 'Acer saccharum',
   'Slow-growing maple prized for autumn colour and syrup.', 15.0),
  ('Sweet Chestnut', 'Castanea sativa',
   'Long-lived tree grown for timber and edible chestnuts.', 20.0),
  ('Sweet Orange', 'Citrus sinensis',
   'Evergreen citrus tree grown for its edible fruit.', 10.0),
  ('Sycamore Maple', 'Acer pseudoplatanus',
   'Fast-growing, wind-tolerant maple widely planted in parks.', 19.0),
  ('Teak', 'Tectona grandis',
   'Tropical hardwood prized for durable, water-resistant timber.', 17.5),
  ('Tulip Tree', 'Liriodendron tulipifera',
   'Fast-growing giant with tulip-shaped flowers and leaves.', 29.0),
  ('Turkey Oak', 'Quercus cerris',
   'Fast-growing introduced oak with mossy-cupped acorns.', 23.0),
  ('Weeping Willow', 'Salix babylonica',
   'Fast-growing waterside tree with distinctive drooping branches.', 11.6),
  ('Western Red Cedar', 'Thuja plicata',
   'Large, long-lived conifer valued for rot-resistant timber.', 17.0),
  ('White Oak', 'Quercus alba',
   'Long-lived, high-value North American timber oak.', 24.5),
  ('White Willow', 'Salix alba',
   'Large riverside willow, source of traditional cricket-bat willow.', 15.0),
  ('Whitebeam', 'Sorbus aria',
   'Small tree with silvery-backed leaves and red berries.', 9.5),
  ('Wild Cherry', 'Prunus avium',
   'Native cherry with showy spring blossom and edible fruit.', 14.0),
  ('Wych Elm', 'Ulmus glabra',
   'Native elm, more resistant to Dutch elm disease than others.', 19.5);

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
-- so no manual total is set anywhere. plant_tree and first_tree events are not
-- listed: the on_tree_planted trigger already wrote them when the trees above
-- were inserted.

insert into public.point_events (profile_id, action_type, points, reference_id, reference_type)
values
  ('00000000-0000-4000-b000-000000000002', 'update_tree', 5, null, 'tree_update'),
  ('00000000-0000-4000-b000-000000000002', 'join_community', 10,
   '00000000-0000-4000-c000-000000000003', 'community'),
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
