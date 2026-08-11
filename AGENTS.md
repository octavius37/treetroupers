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
against remote) — **but read "Remote migration history" below first: the only
migrations it would send overwrite live page content.**

New tables need three things or the API returns "permission denied" / empty
results: table grants for `anon`/`authenticated`/`service_role`, `ENABLE ROW
LEVEL SECURITY`, and at least one policy per operation you intend to allow.
The baseline migration sets default privileges, so grants are usually automatic —
but **RLS with zero policies denies everything**, which is what went wrong with
`pages` (see "Known Schema Issues").

### Remote migration history (read before `db:push`)

The hosted project predates migration tracking, so its history never contained
the baseline. Because `db:push` pushes every local migration absent from remote
history, it would try to run `20260515180000_baseline_schema.sql` — whose
`create table public.profiles` fails against a database that already has that
table — and abort without applying anything.

**Already resolved:** the baseline is now recorded in remote history as applied,
with no SQL executed (the hosted schema already matched it). Nothing to re-run.

If you need the same repair again, note that `supabase migration repair` may fail
while provisioning its temporary login role:

```
unexpected login role status 400: permission denied to alter role
```

That is the CLI trying to `alter role cli_login_postgres` — not a problem with
the repair itself. Bypass the login role by connecting directly:

```bash
supabase migration repair --status applied <version> \
  --db-url "postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres"
```

The same `--db-url` flag works for `db push` and `migration list`. Get the
password from Dashboard → Settings → Database. Never commit it.

Check what remote actually has before pushing; do not assume repo and remote
agree:

```bash
supabase migration list --linked   # side-by-side local vs remote
```

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Run production server
npm run typecheck  # TypeScript check (vue-tsc via nuxi)
npm run lint       # oxlint + eslint
npm run lint:fix   # Auto-fix lint issues

npm test           # Run the whole test suite once
npm run test:watch # Re-run affected tests on change
npx vitest run --project server   # Server tests only (~0.4s)
npx vitest run --project app      # Nuxt-environment tests only

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

## Testing

Vitest, split into two projects because server and app code need different
environments. `npm test` runs both; CI runs it on every push and PR.

| Project | Environment | Tests | Speed |
|---------|-------------|-------|-------|
| `server` | `node` | `server/utils/`, `server/trpc/`, `server/api/` | ~0.4s |
| `app` | `nuxt` (via `@nuxt/test-utils`) | `app/utils/`, `app/composables/`, `app/middleware/`, `app/components/` | ~4s (one Nuxt build) |

Everything is a unit test. Nothing touches a database, a network or a browser,
so the suite needs no Docker, no `.env` and no secrets.

```
test/
  helpers/supabase-mock.ts   chainable Supabase query-builder double
  helpers/nitro.ts           fake H3Event + Nitro auto-import globals
  mocks/supabase-server.ts   stands in for the `#supabase/server` virtual module
  setup/                     per-project setup files
  server/…  app/…            the tests themselves
```

**Writing server tests.** Server code depends on two things that only exist
inside a Nitro build. `#supabase/server` is aliased in `vitest.config.ts` to
`test/mocks/supabase-server.ts` — import that file by *relative path* in tests so
it type-checks, and the code under test reaches the same module instance through
the alias. The auto-imported h3 helpers (`defineEventHandler`, `createError`,
`readBody`, `getRouterParam`) are installed as globals by `test/setup/server.ts`;
use `setRequestBody()` / `setRouterParams()` from `test/helpers/nitro.ts` to
drive them. Auto-imported project utilities (`requireAdmin`, `authUserId`) are
stubbed per test via `Object.assign(globalThis, …)`.

`createSupabaseMock({ table: { data, error, count } })` returns `{ client, calls }`.
It records each chain, so assert on **what was queried** — filters, `limit`,
whether the query ran at all — not only on the response. Several tests depend on
this: that a missing user never reaches the database, that a page read filters
`status = 'published'`, that a profile is never looked up with `undefined`.

**Writing app tests.** Use `mockNuxtImport` for auto-imports and `mountSuspended`
for components. Two traps:

- `mockNuxtImport` factories are hoisted above module-scope `const`s. If the
  factory *returns* the mock directly (`() => navigateTo`), wrap it in
  `vi.hoisted()`. Closing over a `ref` lazily (`() => () => user`) is fine.
- Composables that register a `watch` (`useUserRole`) leak it across tests when
  called at top level, and the watcher then races the next test. Run them inside
  an `effectScope()` and `stop()` it in `afterEach`. Anything cached in
  `useState` needs resetting in `beforeEach` too.

**The authorization guard.** `test/server/api/authorization-guards.test.ts` reads
the source of every `server/api/**` handler and asserts the CMS ones `await
requireAdmin` before their first query, and the dashboard ones establish a user.
Every endpoint queries with `serverSupabaseServiceRole`, which bypasses RLS
entirely, so a handler that forgets its guard is an unauthenticated write path
rather than a 403. This covers endpoints added later that nobody wrote a test
for — leave it in place.

**Two caveats worth knowing.**

1. `npm run lint` and `npm run typecheck` were **already failing on `main`**
   before the suite existed (803 eslint errors repo-wide; two `TS2321` errors in
   `app/composables/useCmsPages.ts`). The suite adds none of these — it is at
   parity with that baseline. Don't read a red `lint`/`typecheck` as something
   the tests broke.
2. `test/` is outside the include list of every generated `.nuxt/tsconfig*.json`,
   so `nuxt typecheck` does not check the test files. To check them, point
   `vue-tsc` at a tsconfig that extends `./.nuxt/tsconfig.json` and includes
   `test/**/*.ts` alongside `app/**/*` and `server/**/*`.

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

3. **`leaderboard` is a `SECURITY DEFINER` view** (Supabase advisory, ERROR).
   Postgres 15+ makes views run as their owner unless created with
   `security_invoker = true`, so the view ignores the caller's RLS. Verified
   harmless today: it reads only `profiles`, `trees` and `tree_updates`, all of
   which already have `public read` policies. The risk is future drift — a column
   or join added later would bypass RLS silently. Fix with
   `alter view public.leaderboard set (security_invoker = true);` after checking
   the dashboard still renders.

4. **Four functions have a mutable `search_path`** (WARN): `handle_new_user`,
   `sync_total_points`, `insert_tree`, `trees_near_point`. Pin it
   (`set search_path = public, extensions`) when you next touch them. Of these
   only `handle_new_user` is `SECURITY DEFINER`, which makes it the one that
   matters: a mutable `search_path` on a definer-rights function is the classic
   privilege-escalation shape.

5. **`handle_new_user` is callable over the API** (WARN) — it is `SECURITY
   DEFINER` and `anon`/`authenticated` hold `EXECUTE`, so it is reachable at
   `/rest/v1/rpc/handle_new_user`. It is only ever meant to run as the
   `on_auth_user_created` trigger. It would fail without a trigger record, but it
   has no business being exposed: `revoke execute on function
   public.handle_new_user() from anon, authenticated;`

Also note `profiles` has no INSERT policy — rows are created solely by the
`on_auth_user_created` trigger, which is intentional.

### Current remote state (2026-08-02)

Verified directly against the hosted project:

- `pages: public read` **is applied on remote**, recorded as history version
  `20260802000000` so it matches the repo file exactly. The corresponding
  Supabase advisory is cleared.
- The baseline `20260515180000` has been **marked applied on remote** (the
  `migration repair` equivalent — a history row, no SQL executed), so `db:push`
  no longer aborts on it.
- The four `20260804*` page-content migrations from PR #6 are **committed but not
  applied to remote**, and are now the only thing a `db:push` would send. They
  are idempotent upserts keyed on `slug`, so they cannot error — but they
  **overwrite live page content**:

  | Slug | Remote now | After push |
  |------|-----------|------------|
  | `climate-change` | 2220 chars (updated 2026-08-01) | 5060 chars |
  | `what-can-i-do` | 4134 chars | 6369 chars |
  | `global-tree-planting-organizations` | does not exist | created |

  `climate-change` carries a more recent `updated_at` than the others. If that
  was a CMS edit made after PR #6 was written, pushing replaces it. Check that
  page in the CMS before pushing — an upsert gives no warning and keeps no copy.

## What's Not Done Yet

- Mapbox integration for the tree map page (currently a placeholder)
- Photo upload (Supabase Storage) — upload UI exists as placeholder
- Capacitor mobile wrapping
- AR tree overlay
- Directus or Payload CMS content fully wired to public info pages
- Contact form email backend
- **Database integration tests** — the unit suite mocks Supabase entirely, so
  nothing verifies RLS policies, the `handle_new_user` trigger,
  `sync_total_points`, or the `leaderboard` view. That is the same class of bug
  as everything under "Known Schema Issues", and it needs the local stack (and
  therefore Docker in CI). The natural next step.
- **End-to-end tests** — no browser coverage of login → plant a tree →
  leaderboard, or of the admin CMS gate.
- Tree species database seeding
