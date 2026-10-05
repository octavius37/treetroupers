# Tree Troupe — Project Guidelines

## What This App Is

Tree Troupe is a community tree-planting platform. Users sign up, join local geographic communities ("troupes"), log the trees they plant with photos and GPS coordinates, post updates about trees, earn points for actions (planting, verifying, updating), and compete on leaderboards. Think **Strava meets iNaturalist for tree planting**.

The long-term vision includes:
- Nested geographic communities (neighbourhood → city → regional → national)
- An interactive map of all community-planted trees (Leaflet + OpenStreetMap — done)
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

## Package Manager — use yarn, not npm

**`yarn.lock` is the committed lockfile. Install and add dependencies with
`yarn`.** CI installs via `nci` (`@antfu/ni`), which detects `yarn.lock` and runs
`yarn install`, so the lockfile has to stay in yarn's format.

```bash
yarn install                 # not `npm install`
yarn add <pkg>               # not `npm install <pkg>`
yarn add -D <pkg>            # dev dependency
```

`npm run <script>` is fine — it's only *installing* that matters.

Running `npm install` **rewrites the whole of `yarn.lock`** into npm's own
formatting and resolution order. It still works, but it turned a 4-dependency
change into a 4215-line diff once, which buries the real change in review. If it
happens again, don't hand-edit the file — restore it and redo the install:

```bash
git checkout origin/main -- yarn.lock   # or HEAD, whichever is the good copy
yarn install                            # replays package.json additively
```

### The `cookie` override is inert under yarn

`package.json` carries an npm `overrides` block pinning `@supabase/ssr > cookie`
to `0.7.2`. **Yarn 1 does not read `overrides`** — its equivalent field is
`resolutions`, which this project does not have. Verified on a clean
`yarn install`: `@supabase/ssr` gets a nested `cookie@1.1.1`, not `0.7.2`.

So the pin only ever applied to npm installs, and the thing actually keeping the
named-export problem away on yarn is `vite.optimizeDeps.include: ['cookie']` in
`nuxt.config.ts`. Build, tests and the Vercel preview all pass this way.

Leave it alone unless you hit a `cookie` export error. If you do, the fix is a
`resolutions` entry mirroring the `overrides` one — but that changes the installed
version, so re-check auth and SSR afterwards.

## Key Conventions

- **Auth**: Supabase Auth for user-facing login/signup (`useSupabaseClient()`, `useSupabaseUser()`). The `@sidebase/nuxt-auth` module is a leftover from the sidebase template and is only used for demo purposes.
- **Styling**: Tailwind utility classes. Primary colour is `green-600`. Design is clean/white with rounded elements and green accents, matching the original Squarespace site aesthetic.
- **Dashboard routes** are protected by the `auth` middleware and use the `dashboard` layout (sidebar + mobile bottom nav).
- **Public routes** use the `default` layout (header + footer).
- **Database types**: Keep `app/types/database.types.ts` in sync with the Supabase schema. Each table must include a `Relationships: []` array to satisfy the postgrest-js type system.
- **Cookie override**: `package.json` has an npm `overrides` entry pinning `@supabase/ssr > cookie` to `0.7.2` to fix a named export incompatibility with cookie v1.x. Note this has **no effect under yarn**, which is how the project installs — see "Package Manager" above.

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
against remote). **Push when you merge a PR that adds a migration.** Vercel
deploys `main` automatically; the database is not updated with it. PR #14's
migration went unpushed for two weeks after merge. The merged code writes the
new columns on every tree insert, so against the production schema every
attempt to log a tree would fail for that whole time. See "Current remote state" below for what is pending.

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

**The reverse case also aborts a push.** If remote history holds a version with
no matching file in `supabase/migrations/` — a migration that was applied and its
file later deleted — `db:push` refuses to run anything:

```
Remote migration versions not found in local migrations directory.
```

Remove the history row (no SQL runs) and push again:

```bash
supabase migration repair --status reverted <version>
supabase db push --dry-run   # confirm only the migrations you expect are listed
```

The CLI also suggests `supabase db pull`. Don't run it here: it writes the remote
schema into a new migration file, which is not the problem being fixed.

If you need a repair again, note that `supabase migration repair` may fail
while provisioning its temporary login role (on 2026-10-01 it worked through the
linked project without the workaround below):

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

npm test           # Run the unit test suite once
npm run test:db    # Database integration tests (needs the local stack running)
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

Everything under `npm test` is a unit test. Nothing touches a database, a
network or a browser, so it needs no Docker, no `.env` and no secrets. Database
integration tests are separate — see "Database integration tests" below.

```
test/
  helpers/supabase-mock.ts   chainable Supabase query-builder double
  helpers/nitro.ts           fake H3Event + Nitro auto-import globals
  mocks/supabase-server.ts   stands in for the `#supabase/server` virtual module
  helpers/local-supabase.ts  real clients for the local stack + throwaway users
  setup/                     per-project setup files
  server/…  app/…            the unit tests
  db/                        database integration tests (`npm run test:db`)
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

### Database integration tests

`test/db/` runs server handlers against the **local** Supabase stack, so
triggers, constraints, generated columns and RLS are real rather than mocked.
They have their own config, `vitest.db.config.ts`, so `npm test` never needs
Docker.

```bash
npm run db:start   # if the stack isn't already up
npm run test:db
```

No `db:reset` is needed and your local data is left alone: each file creates its
own throwaway auth user (and any species it needs) in `beforeAll` and deletes them
in `afterAll`. Delete the user's trees **before** the user — `trees.planted_by`
is `on delete set null`, so deleting the user first leaves orphaned trees.
`deleteTestUser()` does this in the right order.

The handler still imports `serverSupabaseServiceRole` from the
`#supabase/server` mock; the test just points it at a real service-role client.
`authUserId` is stubbed as in the unit tests. The service role bypasses RLS, so
to test a policy, read or write with `anonClient()` (or a signed-in client).

`test/helpers/local-supabase.ts` hard-codes the stack's public demo keys and
**refuses to run against anything but `127.0.0.1`/`localhost`**. It ignores
`SUPABASE_URL` on purpose, since a `.env` may point that at the hosted project.

CI runs these in the `test-db` job, which boots a trimmed stack with
`supabase start` (migrations + seed from scratch) on every push and PR.

Coverage so far is planting a tree and the points it awards
(`plant-tree.test.ts`), which also exercises `handle_new_user` and
`sync_total_points`. Next candidates: the remaining RLS policies and the
`leaderboard` view — see "Known Schema Issues".

### Caveats

1. `npm run lint` is clean on `main`. `npm run typecheck` still reports two
   `TS2321` errors in `app/composables/useCmsPages.ts` that predate the suite.
   Don't read those as something the tests broke.
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

### Current remote state (2026-10-01)

Verified directly against the hosted project:

- **`20260908133532_add_donated_and_earned_tree_logging` was not yet applied** at
  the time of writing. It came in with PR #14 (merged 2026-09-17) and could not
  have been pushed while the remote-only history rows described below existed.
  Those rows have since been cleared and a dry run listed this as the only pending migration;
  the push itself was left for a human to run. Until it is applied, production
  `trees` lacks `source`, `quantity`, `donation_project` and `earned_activity`,
  and `server/api/dashboard/trees.post.ts` fails on every insert. Check with
  `supabase migration list --linked`, and delete this bullet once the version
  shows on both sides.

- `pages: public read` **is applied on remote**, recorded as history version
  `20260802000000` so it matches the repo file exactly. The corresponding
  Supabase advisory is cleared.
- The baseline `20260515180000` has been **marked applied on remote** (the
  `migration repair` equivalent — a history row, no SQL executed), so `db:push`
  no longer aborts on it.
- **The `pages` table is empty and reserved for future CMS content.** The six
  public pages it used to serve are now hand-written route files (see "Public
  pages are code" below). The table, its columns and its RLS policy are all
  intact; only the rows are gone. They were backed up first to
  `docs/superpowers/plans/2026-08-25-pages-backup.sql`, verified byte-identical
  by md5 — that file is the restore path.
- **The four `20260804*` page-content versions were removed from remote
  history** on 2026-10-01 (`migration repair --status reverted`; history rows
  only, no SQL executed). Their files had been deleted when the pages moved into
  code. An earlier version of this section called that drift harmless and said
  `db:push` would skip them. That was wrong: a remote version with no local file
  makes `db:push` abort before applying anything, so the PR #14 migration above
  could not have been pushed until they were removed. Remote history and the repo now agree apart
  from that one pending migration.

  The four migrations had been applied on 2026-08-11, and md5 comparison
  confirmed the live rows matched their content before the rows were deleted;
  the backup file above holds that content.
- **Six further page-content migrations (`20260811*`, `20260812*`) were removed
  on merge.** They arrived from the contributor's branch and were **never
  applied to remote** — remote history has no record of them — so removing the
  files creates no drift at all. Their content was ported into the code pages
  first and verified to render identically: the climate-change section reorder,
  the mission-into-home merge, the new
  `planting-trees-doing-everyday-tasks` page, the image-slot conversion and the
  real team members are all live in `app/pages/`. Recover the original SQL from
  git history if ever needed.

### Public pages are code

The public marketing pages live in `app/pages/*.vue` and no longer touch the
database:

`index.vue` (`home`), `who-we-are.vue`, `climate-change.vue`, `what-can-i-do.vue`,
`global-tree-planting-organizations.vue`,
`planting-trees-doing-everyday-tasks.vue`, `a-short-guide-to-tree-planting.vue`.

There is no `mission.vue`: that page's content was merged into the homepage's
"Our Mission" section, matching the contributor migration that did the same in
the CMS.

Placeholder images use `<ImageSlot alt="…" class="…" />`, which renders a neutral
inline-SVG until a real `src` is supplied. Drop in artwork by passing `src`; the
`class` passes through to the `<img>`.

**Lists need explicit `list-disc` / `list-decimal`.** CMS page HTML got its list
markers and margins from the `.tt-page-content` stylesheet in `[slug].vue`, which
does not apply to code pages. When porting CMS markup, add `list-disc`/
`list-decimal`, `my-4` and `pl-6` or the list silently renders unnumbered and
flush-left.

Edit them like any other component. Two consequences worth knowing:

- **Nav links for these pages are static**, in `AppHeader.staticLinks`. Adding a
  code page means adding its link there. `useNavPages()` / `/api/public/nav`
  still work and still drive nav entries for CMS-authored pages.
- **The two former "smart blocks" are components**: `StatsCounter.vue` and
  `CommunitiesCarousel.vue`, backed by `/api/public/stats` and
  `/api/public/communities`. `resolveSmartBlocks()` is still used by the
  `[slug].vue` catch-all, so `data-block` markers keep working in CMS pages.

The CMS (`/cms/*`, the GrapesJS `PageBuilder`, the pages CRUD endpoints and the
`[slug].vue` catch-all) is fully intact and is the intended home for vlog/blog
content. Static routes outrank the catch-all in Nuxt, so a CMS page whose slug
collides with a code route will not render — pick a different slug.

A CMS-backed "Tree planting tips" blog (`/tree-planting-tips`, listing
published child pages of a seeded collection page via
`GET /api/public/pages/:slug/posts`) was built and then dropped before it ever
had any posts — `/a-short-guide-to-tree-planting` (a hand-maintained code page,
see "Public pages are code" above) is the tips content for now.

## What's Not Done Yet

- Photo upload (Supabase Storage) for trees — the plant form still shows
  "Photo upload coming soon". (The CMS has its own image upload,
  `server/api/cms/upload.post.ts`.)
- Capacitor mobile wrapping
- AR tree overlay
- **More database integration tests** — the setup exists and covers planting a
  tree and its points (see "Database integration tests"). Still unverified: most
  RLS policies, the `leaderboard` view, planting-suggestion visibility.
- **End-to-end tests** — no browser coverage of login → plant a tree →
  leaderboard, or of the admin CMS gate.
- Points for anything other than planting. `update_tree`, `verify_tree`,
  `join_community` and `streak_bonus` exist as `point_events` action types (and
  in the seed), but nothing awards them yet. Deleting a tree doesn't take its
  points back either.

Done since this list was last updated: the interactive tree map
(`TreeMap.client.vue`, Leaflet + OpenStreetMap rather than Mapbox) and the
"Suggest a Planting Spot" map; the contact form's email backend
(`server/api/contact.post.ts`, via Resend — needs `RESEND_API_KEY`); species
seeding (all 100 hosted species are now in `seed.sql`); points for planting (see
"Points" below).

### Points

Planting a tree awards points through the `on_tree_planted` trigger on `trees`
(`20261005122551_award_points_for_planted_trees.sql`), not in application code,
so every insert path scores the same:

- 20 points (`plant_tree`) for each tree with `source = 'planted'`.
- A one-off 50-point `first_tree` bonus, enforced by a partial unique index so a
  profile can never get it twice.
- Donated and earned entries earn nothing: they have no location and a
  self-reported `quantity`, so there is nothing to verify.

Trees logged before the migration were not backfilled. The trigger function is
`SECURITY DEFINER` because `point_events` has no insert policy; the
`test/db/plant-tree.test.ts` direct-insert test fails if that is ever removed.
Since the trigger writes `plant_tree`/`first_tree` events itself, `seed.sql` must
not list them.

`tree_species` in `seed.sql` mirrors the hosted table. The hosted table also
holds a duplicate "English Oak" row (`Quercus Rubor`, no description), which was
left out of the seed; no trees reference it.
