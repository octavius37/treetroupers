# Tree Troupe — Project Guidelines

## What This App Is

Tree Troupe is a community tree-planting platform. Users sign up, join local geographic communities ("troupes"), log the trees they plant with photos and GPS coordinates, post updates about trees, earn points for actions (planting, verifying, updating), and compete on leaderboards. Think **Strava meets iNaturalist for tree planting**.

The long-term vision includes:
- Nested geographic communities (neighbourhood → city → regional → national)
- An interactive map of all community-planted trees (Mapbox — not yet integrated)
- Mobile apps via Capacitor wrapping the same Nuxt codebase
- AR overlay showing nearby planted trees on a phone camera
- A headless CMS (Payload) for non-developer content management

## Tech Stack

| Layer | Technology | Docs |
|-------|-----------|------|
| Framework | **Nuxt 4.1** (Vue 3.5, file-based routing, SSR) | https://nuxt.com/docs |
| Styling | **Tailwind CSS** via `@nuxtjs/tailwindcss` | https://tailwindcss.nuxt.dev |
| UI Components | **Naive UI** via `@bg-dev/nuxt-naiveui` | https://www.naiveui.com |
| Database + Auth | **Supabase** (Postgres, Auth, Storage, Realtime) via `@nuxtjs/supabase` | https://supabase.nuxtjs.org |
| CMS | **Payload CMS 3** with `@payloadcms/db-postgres` | https://payloadcms.com/docs |
| Type-safe API | **tRPC** via `trpc-nuxt` with superjson | https://trpc-nuxt.vercel.app |
| Auth (legacy) | `@sidebase/nuxt-auth` (NextAuth wrapper — demo only) | https://sidebase.io/nuxt-auth |
| Validation | **Zod 4** | https://zod.dev |

## Architecture

```
app/
  layouts/         default.vue (public), dashboard.vue (authenticated)
  pages/           File-based routing — public pages + /dashboard/* (protected)
  components/      AppHeader, AppFooter, Welcome/* (demo, can be removed)
  middleware/       auth.ts — redirects unauthenticated users to /login
  plugins/         trpcClient.ts — tRPC client setup
  types/           database.types.ts — Supabase table types

server/
  api/auth/        NextAuth catch-all handler (demo credentials + GitHub OAuth)
  api/trpc/        tRPC endpoint handler
  api/payload/     Payload CMS REST endpoints (pages CRUD)
  trpc/            Router, context, procedures
  payload/         Collections (Pages, Users)
  utils/           payload.ts — singleton Payload client getter
```

## Supabase Schema

The database has these core tables (types defined in `app/types/database.types.ts`):

- **profiles** — linked to `auth.users` via `auth_user_id`. Stores display_name, avatar_url, bio, total_points
- **communities** — name, slug, description, geojson_area (jsonb), self-referencing `parent_community_id`
- **community_members** — join table (profile_id, community_id, role)
- **tree_species** — common_name, scientific_name, avg_co2_kg_per_year
- **trees** — planted_by (profile), species_id, community_id, lat/lng, notes, verified flag, photo_url
- **tree_updates** — social feed posts: author_id, tree_id, content, photo_url
- **point_events** — ledger of earned points: profile_id, action_type, points, reference_id
- **rewards** / **reward_redemptions** — gamification rewards system

PostGIS is enabled for spatial queries. Triggers auto-create profiles on signup and auto-increment total_points on point_events insert.

## Key Conventions

- **Auth**: Supabase Auth for user-facing login/signup (`useSupabaseClient()`, `useSupabaseUser()`). The `@sidebase/nuxt-auth` module is a leftover from the sidebase template and is only used for demo purposes.
- **Styling**: Tailwind utility classes. Primary colour is `green-600`. Design is clean/white with rounded elements and green accents, matching the original Squarespace site aesthetic.
- **Dashboard routes** are protected by the `auth` middleware and use the `dashboard` layout (sidebar + mobile bottom nav).
- **Public routes** use the `default` layout (header + footer).
- **Database types**: Keep `app/types/database.types.ts` in sync with the Supabase schema. Each table must include a `Relationships: []` array to satisfy the postgrest-js type system.
- **Cookie override**: `package.json` has an npm `overrides` entry pinning `@supabase/ssr > cookie` to `0.7.2` to fix a named export incompatibility with cookie v1.x.

## Local Database (read this before touching the schema)

**Always develop against the local Supabase stack. Never point local work, tests,
or migrations at the hosted project.**

The full Supabase stack (Postgres 17 + PostGIS, Auth, PostgREST, Storage, Studio)
runs locally in Docker. `supabase/migrations/` is the single source of truth for
the schema, and `supabase/seed.sql` fills it with demo content.

First-time setup:

```bash
cp .env.local.example .env   # local demo keys — not secrets
npm install
npm run db:start             # boots the stack (first run pulls images, ~2-5 min)
npm run db:reset             # applies all migrations, then seed.sql
npm run dev
```

Or with Docker only: `docker compose up` does all of the above.

Seeded logins (both `password123`):

| Email | Role | Notes |
|-------|------|-------|
| `admin@example.com` | `admin` | Can reach `/cms` |
| `member@example.com` | `user` | Regular user |

Local URLs: app `http://localhost:3000`, Studio `http://127.0.0.1:54423`,
captured email `http://127.0.0.1:54424`, API `http://127.0.0.1:54421`.

### Changing the schema

Never edit an applied migration and never change the schema through the Supabase
dashboard or MCP `apply_migration` — both put the repo out of sync with the
database, which is how the schema became untracked in the first place.

```bash
npm run db:new my_change    # creates supabase/migrations/<timestamp>_my_change.sql
# write the SQL, then:
npm run db:reset            # replay everything from scratch — proves it works on an empty DB
npm run db:types            # regenerate app/types/database.types.ts
```

Deploy with `npm run db:push` (applies only migrations; `seed.sql` never runs
against remote).

New tables need three things or the API returns "permission denied" / empty
results: table grants for `anon`/`authenticated`/`service_role`, `ENABLE ROW
LEVEL SECURITY`, and at least one policy per operation you intend to allow.
The baseline migration sets default privileges, so grants are usually automatic —
but **RLS with zero policies denies everything**, which is the current state of
`pages` (see "Known Schema Issues").

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Run production server
npm run typecheck  # TypeScript check (vue-tsc via nuxi)
npm run lint       # oxlint + eslint
npm run lint:fix   # Auto-fix lint issues

npm run db:start   # Start local Supabase
npm run db:stop    # Stop local Supabase
npm run db:status  # Show local URLs and keys
npm run db:reset   # Recreate DB from migrations + seed
npm run db:migrate # Apply pending migrations
npm run db:new     # Scaffold a new migration
npm run db:diff    # Diff local DB against migrations
npm run db:types   # Regenerate database.types.ts from local DB
npm run db:push    # Push migrations to the hosted project
```

## Known Schema Issues

Found while extracting the schema into migrations.

1. **`pages` deny-all RLS — fixed** in
   `20260802000000_add_pages_public_read_policy.sql`. The table was created with
   RLS enabled and no policies, denying all access to `anon`/`authenticated`;
   public pages worked only because every endpoint touching `pages` uses
   `serverSupabaseServiceRole`, which bypasses RLS. A `select` policy scoped to
   `status = 'published'` now makes the intent explicit. Drafts stay hidden and
   there is still no insert/update/delete policy — admin writes go through the
   service role behind `requireAdmin()`.

2. **`spatial_ref_sys` has RLS disabled — accepted risk, not fixable.** It is a
   PostGIS table owned by `supabase_admin`, so `ALTER TABLE ... ENABLE ROW LEVEL
   SECURITY` fails with insufficient privileges; the Supabase advisory cannot be
   cleared from a migration. It holds only EPSG coordinate-system reference
   definitions — public, read-only lookup data with no application rows — so
   exposure is harmless. If you ever want it out of the API surface, remove
   `public` from the exposed schemas rather than trying to enable RLS.

Also note `profiles` has no INSERT policy — rows are created solely by the
`on_auth_user_created` trigger, which is intentional.

## What's Not Done Yet

- Mapbox integration for the tree map page (currently a placeholder)
- Photo upload (Supabase Storage) — upload UI exists as placeholder
- Capacitor mobile wrapping
- AR tree overlay
- Directus or Payload CMS content fully wired to public info pages
- Contact form email backend
- Test suite (CI placeholder exists but no tests)
- Tree species database seeding
