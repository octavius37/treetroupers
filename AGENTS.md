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
| Validation | **Zod 4** | https://zod.dev |

## Architecture

```
app/
  layouts/         default.vue (public), dashboard.vue (authenticated)
  pages/           File-based routing — public pages + /dashboard/* (protected)
  components/      AppHeader, AppFooter, FeedPostCard, NavIcon, UserAvatar, …
  middleware/       auth.ts — redirects unauthenticated users to /login
  plugins/         password-recovery.client.ts — sends reset-link sign-ins to /reset-password
  error.vue        branded 404 / error page
  types/           database.types.ts — Supabase table types

server/
  api/dashboard/   signed-in member endpoints (authUserId)
  api/cms/         admin endpoints (requireAdmin)
  api/public/      unauthenticated endpoints
  api/payload/     Payload CMS REST endpoints (pages CRUD)
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
- **tree_updates** — per-tree updates: author_id, tree_id, content, photo_url. No longer shown in the feed (see "Community feed")
- **feed_posts** / **post_likes** — the community feed: admin announcements, automatic posts for approved tree logs, and likes
- **point_events** — ledger of earned points: profile_id, action_type, points, reference_id
- **rewards** / **reward_redemptions** — gamification rewards system

PostGIS is enabled for spatial queries, installed in the `extensions` schema (not `public`; see "Known Schema Issues"). Triggers auto-create profiles on signup and auto-increment total_points on point_events insert.

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

- **Auth**: Supabase Auth for login, signup and password reset (`useSupabaseClient()`, `useSupabaseUser()`). The sidebase template's `@sidebase/nuxt-auth` demo login (which accepted `jsmith`/`hunter2`), tRPC and the `Welcome/*` demo components have been removed.
- **Password reset**: `/forgot-password` sends Supabase's reset email with `redirectTo: <origin>/reset-password`, where the user chooses a new password. That URL must be in the hosted project's **Auth → URL Configuration → Redirect URLs** (locally, `supabase/config.toml` allows `localhost:3000/**`). If it isn't, Supabase lands the link on the Site URL instead; `plugins/password-recovery.client.ts` catches the `PASSWORD_RECOVERY` event there and forwards to `/reset-password`. With Supabase's default (PKCE) email template the link only works in the browser that requested it; the page explains this when it fails.
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

Two problems you may hit along the way:

- **`db:types` fails with `password authentication failed for user "postgres"`**
  if `.env` sets `SUPABASE_DB_PASSWORD` to the hosted password: the CLI uses it
  for `--local` too. The shell redirect has already overwritten
  `database.types.ts` with the error by then, so restore it with `git checkout`
  and run `SUPABASE_DB_PASSWORD=postgres npm run db:types`.
- **Auth returns 502 after `db:reset`** (`AuthRetryableFetchError` in
  `test:db`). The reset restarts the auth container on a new IP and Kong keeps
  routing to the old one. `docker restart supabase_kong_tree-troupers` fixes it.

New tables need three things or the API returns "permission denied" / empty
results: table grants for `anon`/`authenticated`/`service_role`, `ENABLE ROW
LEVEL SECURITY`, and at least one policy per operation you intend to allow.
The baseline migration sets default privileges, so grants are usually automatic —
but **RLS with zero policies denies everything**, which is what went wrong with
`pages` (see "Known Schema Issues").

### Deploying migrations

Migrations reach the hosted project through the **Run Supabase migrations**
GitHub Action (`.github/workflows/run-migrations.yaml`). It runs `supabase db
push` on every push to `main` that touches `supabase/migrations/`, so merging a
PR that adds a migration applies it alongside the Vercel deploy of the same
commit. It can also be started by hand from the Actions tab. Only migrations
are applied; `seed.sql` never runs against remote.

It needs three repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|-------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from https://supabase.com/dashboard/account/tokens |
| `SUPABASE_DB_PASSWORD` | Database password — Dashboard → Settings → Database |
| `SUPABASE_PROJECT_REF` | `lsjoxlmpciuzgxtqtjmf`, the subdomain of the project URL |

If one is missing the job fails straight away and names it. **Check the run
passed after merging a migration.** A failed push leaves the new code running
against the old schema. Before this workflow existed, PR #14's migration went
unpushed for two weeks after merge; the merged code writes the new columns on
every tree insert, so every attempt to log a tree failed for that whole time.

`npm run db:push` from your own machine does the same thing and still works,
for example to rerun a failed push after fixing its cause.

A push applies nothing and fails in two cases:

- **Remote has a version with no local file.** See "Remote migration history"
  below.
- **Migrations merged out of timestamp order.** If `main` gained a migration
  newer than yours while your PR was open, the push fails with `Found local
  migration files to be inserted before the last migration on remote
  database.` Prevent it by renaming your file to a fresh timestamp before
  merging (safe, since it has not been applied anywhere). After the fact, check
  your migration does not depend on running first, then push it by hand with
  `supabase db push --include-all`.

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
npm run db:push    # Push migrations to the hosted project (CI does this on merge)
```

## Testing

Vitest, split into two projects because server and app code need different
environments. `npm test` runs both; CI runs it on every push and PR.

| Project | Environment | Tests | Speed |
|---------|-------------|-------|-------|
| `server` | `node` | `server/utils/`, `server/api/` | ~0.4s |
| `app` | `nuxt` (via `@nuxt/test-utils`) | `app/utils/`, `app/composables/`, `app/middleware/`, `app/components/`, `app/pages/` | ~4s (one Nuxt build) |

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
`readBody`, `readMultipartFormData`, `getRouterParam`, `getQuery`) are installed as globals
by `test/setup/server.ts`; use `setRequestBody()` / `setMultipartFormData()` /
`setRouterParams()` / `setQuery()` from `test/helpers/nitro.ts` to drive them. Auto-imported project utilities (`requireAdmin`, `authUserId`) are
stubbed per test via `Object.assign(globalThis, …)`.

`createSupabaseMock({ table: { data, error, count } })` returns `{ client, calls }`.
It records each chain, so assert on **what was queried** — filters, `limit`,
whether the query ran at all — not only on the response. Several tests depend on
this: that a missing user never reaches the database, that a page read filters
`status = 'published'`, that a profile is never looked up with `undefined`.

**Writing app tests.** Use `mockNuxtImport` for auto-imports and `mountSuspended`
for components. Three traps:

- `mockNuxtImport` factories are hoisted above module-scope `const`s. If the
  factory *returns* the mock directly (`() => navigateTo`), wrap it in
  `vi.hoisted()`. Closing over a `ref` lazily (`() => () => user`) is fine.
- Composables that register a `watch` (`useUserRole`) leak it across tests when
  called at top level, and the watcher then races the next test. Run them inside
  an `effectScope()` and `stop()` it in `afterEach`. Anything cached in
  `useState` needs resetting in `beforeEach` too.
- `registerEndpoint` does not pass `FormData` bodies through: the handler
  receives the string `"[object Object]"`. To check what a component uploads,
  stub `$fetch` with `vi.stubGlobal` and read the `FormData` it is called with
  (see `PhotoUpload.test.ts`).

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

Coverage so far is logging a tree, its review and the points approval pays
(`plant-tree.test.ts`), which also exercises `handle_new_user`,
`sync_total_points` and members being unable to approve their own logs, the
community feed — activity posts, community scoping, likes and RLS
(`feed.test.ts`), suggesting a spot, including the point being taken back when
the suggestion is deleted (`suggest-spot.test.ts`), and that PostGIS's
`spatial_ref_sys` stays out of the REST API (`api-exposure.test.ts`). Next
candidates: the remaining RLS policies — see "Known Schema Issues".

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

2. **`spatial_ref_sys` exposed with RLS disabled — fixed** in
   `20261014092701_move_postgis_to_extensions_schema.sql` (Supabase advisory
   `rls_disabled_in_public`, ERROR, which also arrived as a "Table publicly
   accessible" email). An earlier version of this section called it harmless,
   read-only lookup data. It was not read-only: `anon` and `authenticated` held
   every privilege on it, so anyone with the public key could delete the
   coordinate-system rows that geography queries depend on. The table is owned
   by `supabase_admin`, and `postgres` has no grant option on it, so neither
   `enable row level security` nor `revoke` works from a migration.

   The migration moves PostGIS into the `extensions` schema, which the API does
   not expose. PostGIS can't be relocated in place, so it drops and recreates the
   extension, copying the geography columns to text and back so no value
   changes. **PostGIS now lives in `extensions`**: in new migrations write
   `extensions.geography` / `extensions.st_*`, or pin
   `set search_path = public, extensions` on functions that call it unqualified.
   `seed.sql` and API requests still work unqualified, because the `postgres`
   role and PostgREST (`extra_search_path`) both include `extensions`.
   `test/db/api-exposure.test.ts` fails if the table is reachable again.

3. **`leaderboard` `SECURITY DEFINER` view — fixed** in
   `20261014092702_make_leaderboard_security_invoker.sql`, which sets
   `security_invoker = true` so the view applies the caller's RLS. The rows it
   returns didn't change: it reads only `profiles`, `trees` and `tree_updates`,
   all of which have `public read` policies. The anon read in
   `plant-tree.test.ts` covers it.

4. **Two functions still have a mutable `search_path`** (WARN):
   `handle_new_user` and `sync_total_points`. (`insert_tree` and
   `trees_near_point` were pinned by the PostGIS move.) Pin it
   (`set search_path = public, extensions`) when you next touch them.
   `handle_new_user` is the one that matters, because it is `SECURITY DEFINER`:
   a mutable `search_path` on a definer-rights function is the classic
   privilege-escalation shape.

5. **`handle_new_user` is callable over the API** (WARN) — it is `SECURITY
   DEFINER` and `anon`/`authenticated` hold `EXECUTE`, so it is reachable at
   `/rest/v1/rpc/handle_new_user`. It is only ever meant to run as the
   `on_auth_user_created` trigger. It would fail without a trigger record, but it
   has no business being exposed: `revoke execute on function
   public.handle_new_user() from anon, authenticated;`

Also note `profiles` has no INSERT policy — rows are created solely by the
`on_auth_user_created` trigger, which is intentional.

### Current remote state (2026-10-13)

Verified directly against the hosted project:

- **Remote is up to date.** All 14 migrations in `supabase/migrations/` (through
  `20261005122551_award_points_for_planted_trees`) show on both sides of
  `supabase migration list --linked`, and `db push --dry-run` reports nothing to
  apply. The live schema was checked as well as the history: the donate/earn
  columns on `trees`, the `planting_suggestions` table and its `member read`
  policy, the `on_tree_planted` trigger and `trees: own insert` all exist, and
  the REST API returns the new columns, so its schema cache is current.
  Donating a tree works in production.

  `20261013120000_award_points_for_planting_suggestions` (PR #19) was added
  after that check. The **Run Supabase migrations** workflow applies it when
  the PR merges; check that run passed before assuming suggestion points work
  in production. As of 2026-10-14 it is in remote history.

  The two security-advisor fixes (`20261014092701_move_postgis_to_extensions_schema`,
  `20261014092702_make_leaderboard_security_invoker`) came next. `db push
  --dry-run` listed exactly those two as pending. After they apply, the security
  advisor should show no errors. Check that `trees.lat`/`lng` still have values
  for the planted trees on remote.

  `20261016080000_review_tree_logs_before_awarding_points` came after that. It
  backfills every existing tree as approved, so nothing already logged goes back
  into the queue. Once its run passes, new logs from the app need a photo and
  wait at `/cms/trees` for approval before they pay points.

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
  makes `db:push` abort before applying anything, so PR #14's migration could
  not be pushed until they were removed.

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

- Capacitor mobile wrapping
- AR tree overlay
- **More database integration tests** — the setup exists and covers planting a
  tree and its points, and suggestion points (see "Database integration
  tests"). Still unverified: most RLS policies, the `leaderboard` view,
  planting-suggestion visibility.
- **End-to-end tests** — no browser coverage of login → plant a tree →
  leaderboard, or of the admin CMS gate.
- Points for `update_tree`, `verify_tree`, `join_community` and `streak_bonus`.
  They exist as `point_events` action types (and in the seed), but nothing
  awards them yet. Deleting a tree doesn't take its points back either
  (deleting a planting suggestion does).
- **Showing tree photos on the dashboard and map.** `/cms/trees` shows each
  log's photo for review, and the community feed shows planted trees' photos,
  but the dashboard and map don't yet.

Done since this list was last updated: the interactive tree map
(`TreeMap.client.vue`, Leaflet + OpenStreetMap rather than Mapbox) and the
"Suggest a Planting Spot" map; the contact form's email backend
(`server/api/contact.post.ts`, via Resend — needs `RESEND_API_KEY`); species
seeding (all 100 hosted species are now in `seed.sql`); points for planting and
for suggesting a spot (see "Points" below); photo upload for trees (Supabase
Storage, see "Photo upload" below); admin review of every tree log, with points
for donated and earned trees (see "Tree log review" below); the community feed
(see "Community feed" below).

### Points

Tree logs earn points when an admin **approves** them, through the
`on_tree_approved` trigger on `trees`
(`20261016080000_review_tree_logs_before_awarding_points.sql`), not in
application code, so every path scores the same. See "Tree log review" below for
the approval flow.

- 20 points (`plant_tree`) for an approved tree with `source = 'planted'`.
- 5 points per tree (`donate_tree`) for an approved donated log, and 2 per tree
  (`earn_tree`) for an approved earned log, each times the log's `quantity`.
  There is no cap: the reviewer checks the quantity against the photo.
- A one-off 50-point `first_tree` bonus for a profile's first approved planted
  tree. It is withheld if the profile has a planted tree approved in an earlier
  transaction (trees from before review existed count from `created_at`, so
  anyone who planted before points existed gets none), and a partial unique index
  stops a profile getting it twice. Trees approved in the *same* transaction are
  deliberately not counted: row triggers fire after the whole statement, so in a
  multi-row insert or approval (as in `seed.sql`) each row sees the others, and a
  plain "no other approved tree" check would award nobody.

Points are paid once, on the change to `approved` (or on an insert that is
already approved, which only the service role and `seed.sql` can do). Trees
logged before review existed were backfilled as approved with no points paid:
planted ones had been paid on insert by the old `on_tree_planted` trigger
(`20261005122551_award_points_for_planted_trees.sql`, now dropped), and donated
and earned ones were not backfilled. The trigger function is `SECURITY DEFINER`
because `point_events` has no insert policy.

The same migration replaced the `trees: authenticated insert` policy, which only
checked that the caller was signed in, with `trees: own insert`, which requires
`planted_by` to be the caller's own profile. Without that, points would let any
user credit trees to anyone. `tree_updates: authenticated insert` still has the
old shape (any `author_id`); it awards nothing today, but needs the same fix
before updates earn points.
Since the trigger writes `plant_tree`/`first_tree` events itself, `seed.sql` must
not list them. Seeded trees are inserted with `review_status = 'approved'` so
they are paid; without it they would sit in the review queue.

Suggesting a planting spot awards 1 point (`suggest_spot`) through the
`on_planting_suggestion_created` trigger on `planting_suggestions`
(`20261013120000_award_points_for_planting_suggestions.sql`), same pattern and
same reason: every insert path scores the same, and `point_events` has no
insert policy so the function is `SECURITY DEFINER`. `suggest_spot` was not
among the action types the baseline schema anticipated, so this migration also
drops and re-adds `point_events_action_type_check` to add it — the only place
in the repo doing that today. No first-suggestion bonus.

Members can remove their own suggestions, so the same migration's
`on_planting_suggestion_deleted` trigger takes the point back: it inserts a
matching `-1` `suggest_spot` event rather than deleting the original, because
`sync_total_points` only reacts to inserts. Without it, suggesting and removing
a spot in a loop added points with nothing left on the map.

`tree_species` in `seed.sql` mirrors the hosted table. The hosted table also
holds a duplicate "English Oak" row (`Quercus Rubor`, no description), which was
left out of the seed; no trees reference it.

### Community feed

`/dashboard/feed` is each community's home page: a banner with the community's
tree, this-month and member counts, a feed with Everything/Trees/News/Events
filters, upcoming events and the community's top planters. Members of several
communities switch between them with the pills at the top (`?community=<id>`).
Posting earns no points.

Everything comes from one endpoint, `GET /api/dashboard/feed?community_id=`,
which reads `feed_posts` (`20261016090000_create_community_feed.sql`). A post is
one of two kinds:

- **`announcement`** — written by an admin at **`/cms/feed`** ("Community
  Posts"), under a heading (`category`: `upcoming_events` or `latest_news`), for
  one community or, with none, for everyone. Events need `event_at`. To add a
  heading, widen the `feed_posts.category` check in a new migration and add it
  to `FEED_CATEGORIES` (`server/utils/feed.ts`) and `FEED_CATEGORY_LABELS`
  (`app/utils/feedCategories.ts`).
- **`activity`** — "X just planted/donated/earned …", written by the
  `on_tree_approved_post` trigger when a tree log is **approved**, so rejected
  and pending logs are never announced. It stores only `tree_id`; the wording
  comes from the tree when the feed is read. A unique index allows one per tree,
  and deleting the tree deletes the post. The migration backfilled one for each
  tree already approved, dated when it was logged. Only planted trees show
  their photo: donation and earning proofs are often receipts or screenshots
  with personal details on them.

Communities nest, so a feed covers more than one community:

- announcements for the community, for **every community containing it**, and
  for everyone (an Utrecht event shows in Lombok's feed);
- activity from the community and **every community inside it** (Lombok's trees
  show in Utrecht's feed), plus activity on logs with no community from the
  community's members.
- The stats and top planters count approved trees from the community and those
  inside it.

`communityAncestors`/`communityDescendants` in `server/utils/feed.ts` walk the
tree in memory (the whole `communities` table is read), and the stats read every
approved tree in scope. Both are fine at this size; move them into SQL when
either table gets large.

**Likes** (`post_likes`, one per profile per post) are toggled with
`POST`/`DELETE /api/dashboard/feed/posts/:id/like`. They show as "Congratulate"
on activity, "Like" on news and "I'm interested" on events. You can't
congratulate yourself: your own activity posts show who congratulated you
instead of a button.

Both tables have RLS with a public `select` policy and **no write policies**:
announcements are written through `/api/cms/feed-posts` (`requireAdmin`), likes
through the like endpoints (signed in), and activity by the trigger, which is
`SECURITY DEFINER` for that reason. Admins can delete any post, activity
included, from `/api/cms/feed-posts/:id`.

The feed used to list `tree_updates`. That table is untouched (the leaderboard
still counts `updates_posted`) but nothing displays it now.

### Legal pages, account deletion and SEO

- **`/privacy` and `/terms`** are code pages, linked from the footer and from a
  required "16 or older and agree" checkbox on `/register`. They describe what
  the site actually does (what members see, which processors — Supabase,
  Vercel, Resend — and what deletion removes), so update them when that
  changes. Bump the `UPDATED` date at the top of each.
- **Deleting an account** (`DELETE /api/dashboard/account`, from the profile
  page, needs `{ confirm: 'DELETE' }`) removes the user's files under
  `<auth user id>/` in `tree-photos` and `avatars`, deletes their pending logs
  and tree updates, strips photos and notes from their other trees, then deletes
  the auth user; the profile and everything referencing it cascade. Trees stay,
  with `planted_by` null, so community totals don't drop. Files go first, so a
  storage failure leaves the account intact and the request can be retried.
- **Titles** use `titleTemplate: '%s · Tree Troupe'` (`nuxt.config.ts`); give
  every new page `useHead({ title })`. `app.vue` sets the default description
  and share preview (`og:image` is the homepage hero); public pages override the
  description with `useSeoMeta`. Absolute URLs come from
  `runtimeConfig.public.siteUrl`: `NUXT_PUBLIC_SITE_URL`, else Vercel's
  `VERCEL_PROJECT_PRODUCTION_URL`.
- **`/robots.txt` and `/sitemap.xml`** are server routes
  (`server/routes/`). The sitemap lists the public code pages; add new ones to
  `PUBLIC_PATHS`. `/dashboard/**` and `/cms/**` send `X-Robots-Tag: noindex`.

### Photo upload

`POST /api/dashboard/tree-photo` uploads one image to the `tree-photos`
Supabase Storage bucket and returns its public URL. It sits behind
`authUserId()`, and objects are stored under `<auth user id>/<uuid>.<ext>`.
The bucket is public and created on first use, like the CMS's `cms-images` in
`server/api/cms/upload.post.ts`.

- **Only JPEG, PNG and WebP are accepted**, identified from the file's first
  bytes. The browser-supplied type and filename are ignored, since the client
  controls both. Anything else, SVG in particular, is refused, so the public
  bucket can't serve a script or arbitrary files. The extension is derived from
  the detected type, and the bucket is created with the same `allowedMimeTypes`.
- **The limit is 4 MB**, because Vercel refuses function request bodies over
  4.5 MB with a 413 before the handler runs.
- **`PhotoUpload.vue` downscales before uploading**: `app/utils/downscaleImage.ts`
  redraws the photo at most 2048 px on its longer side and re-encodes it as JPEG,
  which brings phone photos well under 1 MB and drops their EXIF data (including
  GPS). If the browser can't decode the file, the original is sent, and one still
  over 4 MB is refused in the browser with a readable message.

`PhotoUpload.vue` is shared by `plant.vue`, `plant-donated.vue` and
`plant-earned.vue`. It uploads as soon as a file is picked and puts the URL in
the form via `v-model`. Bind `v-model:uploading` too and disable submit while it
is true: submitting mid-upload saves the tree without its photo. On submit,
`trees.post.ts` stores the URL as the one element of `trees.photo_urls` (plural
in the schema, since `tree_updates` can hold several; these forms only ever send
one).

**A photo is required on every log**, because it is the proof an admin reviews
(see "Tree log review" below). `trees.post.ts` refuses a log with no
`photo_url` (400), or with one outside the caller's own
`tree-photos/<auth user id>/` folder, and the forms keep submit disabled until a
photo is attached.

Known gap: nothing deletes uploads that never end up on a tree (a removed photo,
an abandoned form).

### Tree log review

Every tree log (planted, donated or earned) starts as `review_status =
'pending'` and pays no points until an admin approves it at `/cms/trees`, which
opens on the "Pending review" queue and shows each log's photo with Approve and
Reject buttons. The CMS overview shows a banner while anything is waiting.
Approving calls `PUT /api/cms/trees/:id/review` with `{ decision: 'approved' |
'rejected' }`, behind `requireAdmin`. It records `reviewed_by` (the admin's
profile), and the database sets `reviewed_at`.

`review_status` is separate from `status`, which is still the tree's life
(planted/growing/mature/removed), cycled by the existing status button.

The database enforces the rules, not only the endpoint:

- **Members can't review their own logs.** The `guard_tree_review` trigger
  forces anything `anon`/`authenticated` inserts to `pending`, and refuses
  their updates to `review_status`/`reviewed_by`/`reviewed_at` with `42501`.
  Without it, `trees: own insert` and `trees: own update` would let a member
  approve their own log directly through the REST API.
- **Approved is final.** Un-approving fails with `23514`, even through the
  service role, because the points have been paid and nothing takes them back.
  The endpoint only matches `pending` rows (409 otherwise), so a log can't be
  reviewed twice.
- **Pending logs must have a photo** (`trees_photo_required_for_review`).
  Approved and rejected rows are exempt, so trees from before photos were
  required stay valid.

What counts where:

- The **leaderboard** `trees_planted` column, the member dashboard's tree count
  and the public tree totals (`/api/public/stats`, the `stats-counter` smart
  block) count only approved trees, matching the points.
- The **map** shows pending and approved trees, but not rejected ones.
- The member dashboard's recent trees show "Pending review" or "Not approved"
  until a log is approved.

`test/db/plant-tree.test.ts` covers all of this against the real database.
