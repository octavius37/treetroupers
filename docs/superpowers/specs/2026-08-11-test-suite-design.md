# Test Suite — Design

**Date:** 2026-08-11
**Status:** Approved (pending spec review)

## Goal

Give the repo its first automated test suite: a fast, dependency-free set of unit
tests over the logic that can silently break, wired into CI as a required job.

Two decisions were settled before design:

1. **Scope** — unit tests only. Server utilities and route handlers run in plain
   Node with Supabase mocked; composables, middleware and components run in the
   Nuxt test environment. No Docker, no live database, no browser.
2. **CI** — the suite gates `main` from the start, replacing the
   `# TODO: Add more steps here, like "nr test"` comment in
   `.github/workflows/ci.yaml`.

## Context

The repo has no tests. `AGENTS.md` lists "Test suite (CI placeholder exists but
no tests)" under *What's Not Done Yet*. CI runs `lint` and `build` only.

What the codebase looks like from a testing standpoint:

- **`server/utils/`** holds the real server-side logic — `requireAdmin`,
  `authUserId`, `resolveSmartBlocks`, `defaultPages`. These are imported by
  Nitro's auto-import, and `requireAdmin` / `resolveSmartBlocks` /
  `authUserId` all import from `#supabase/server`, a Nitro virtual alias.
- **`server/api/`** is ~35 handlers. Most CMS endpoints are thin:
  `requireAdmin(event)` plus one Supabase query with no branching. Three have
  genuine business logic worth locking down (see Layer 2).
- Handlers rely on Nitro auto-imports (`defineEventHandler`, `createError`,
  `readBody`, `getRouterParam`) that do not exist under plain Vitest.
- **`app/composables/`** and **`app/middleware/`** hold small units with real
  branching — nav-tree construction, role caching, redirect decisions.
- Every `server/api/**` endpoint queries with `serverSupabaseServiceRole`, which
  **bypasses RLS**. Authorization therefore lives entirely in application code,
  which makes `requireAdmin` the single most important thing to test.

Relevant versions: Nuxt 4.1.2, Vue 3.5.22, Vite 7.3.3, h3 1.15.11.

## Design

### 1. Tooling — two Vitest projects

New devDependencies: `vitest`, `@nuxt/test-utils`, `@vue/test-utils`, `happy-dom`.

A root `vitest.config.ts` declares two projects so each layer runs in the
environment it actually needs:

| Project | Environment | Covers |
|---------|-------------|--------|
| `server` | `node` | `server/utils/`, `server/trpc/`, `server/api/` handlers |
| `app` | `nuxt` (via `@nuxt/test-utils/config`) | `app/utils/`, `app/composables/`, `app/middleware/`, `app/components/` |

The `server` project resolves `#supabase/server` to a test double via
`resolve.alias`, and `~` / `~~` to `app` / the repo root so the type-only
`~/types/database.types` imports resolve. It loads a setup file that installs
the Nitro auto-imports as globals.

The `app` project uses the Nuxt environment because composables call
`useSupabaseUser`, `useState` and `computed` as auto-imports and components need
a real Nuxt app to mount. Server code deliberately does **not** run here: it
would be roughly ten times slower and the Nuxt environment does not provide
Nitro's server auto-imports anyway.

Scripts: `npm test` → `vitest run`, `npm run test:watch` → `vitest`.

No coverage tooling or thresholds in this pass. A percentage target would
reward tests over the ~20 thin CRUD endpoints, which is the opposite of what
this suite is for.

### 2. Shared test doubles

Two helpers, deliberately explicit rather than clever:

**`test/helpers/supabase-mock.ts`** — a chainable query-builder double matching
the call shapes actually used in the codebase:

- `.from(table).select().eq().single()` / `.maybeSingle()`
- `.from(table).insert().select().single()`
- `.from(table).update().eq().select().single()`
- `.from(table).delete().eq()`
- `.from(table).select('id', { count: 'exact', head: true })` → `{ count }`
- `.from(table).select().order().limit()`

Every chain method returns the builder; terminal methods resolve to a result
configured per table. It records the chain so tests can assert *what was
queried*, not just what came back — needed for the `auth_user_id` and
`status = 'published'` assertions below.

**`test/helpers/h3.ts`** — a minimal fake `H3Event`, plus globals for the Nitro
auto-imports. `createError` and `defineEventHandler` come from the real `h3`
package so status codes and error semantics are genuine; `readBody` and
`getRouterParam` are `vi.fn()` stubs configured per test, since the real ones
read from a Node request object.

The `#supabase/server` alias target exports `vi.fn()` versions of
`serverSupabaseUser`, `serverSupabaseServiceRole` and `serverSupabaseClient`.

### 3. Layer 1 — server units (`node`)

**`authUserId`** — returns the `sub` claim; falls back to `id`; returns `null`
for a null user and for an object carrying neither field.

**`requireAdmin`** — 401 with no user; 403 when the profile lookup errors; 403
when no profile exists; 403 when `role === 'user'`; returns `{ user, profile }`
for an admin. Plus: asserts the profile query filters `auth_user_id` by the
`sub` value and is **never issued with `undefined`** — the failure mode the
function's own comment guards against.

**`resolveSmartBlocks`** — returns HTML untouched when it contains no
`data-block=`, and issues **no database calls at all** on that path; substitutes
`stats-counter` with live counts; renders `0` for a `null` count; substitutes
`communities-carousel`; renders the empty-state copy when there are no
communities; handles both blocks in one document. Plus an **XSS regression
test**: a community name and description containing `<script>`, quotes and
ampersands must come back escaped.

**`defaultPages`** — every entry has a non-empty title and content and slugs are
unique; a `home` entry exists. Plus a **contract test**: the `stats-counter`
marker embedded in `DEFAULT_PAGES` must match the `stats-counter` pattern in
`resolveSmartBlocks`. These two files must agree and nothing else forces them
to; a whitespace or attribute-order change in one leaves an unrendered
placeholder on the public homepage.

**tRPC `appRouter.hello`** — greeting with supplied text, and the `'world'`
default for nullish input, exercised through a direct caller.

### 4. Layer 2 — route handlers (`node`)

Three handlers with logic worth pinning down:

**`cms/users/[id]/role.put`** — 400 on missing id; 400 on a role outside
`admin | user`; **400 on self-demotion** (the last-admin lockout guard); allows
an admin to set their own role to `admin`; 500 on a database error; updates on
success.

**`public/pages/[slug].get`** — 400 on missing slug; 404 when the page is absent
or unpublished; asserts the query filters `status = 'published'` so drafts
cannot leak through the service-role client; returns resolved HTML.

**`dashboard/trees.post`** — 401 without a user; 404 when the profile is
missing; empty `species_id` / `community_id` become `null`; and the PostGIS
literal is `SRID=4326;POINT(<lng> <lat>)` — **longitude before latitude**. That
ordering is trivially reversible and produces silently wrong map positions
rather than an error.

**Source-level authorization guard** — a test that reads every file under
`server/api/cms/**` and asserts it calls `requireAdmin`, and every file under
`server/api/dashboard/**` and asserts it establishes a user via `authUserId` or
`requireAdmin`. Because these handlers all use the service role and bypass RLS,
an endpoint that forgets its guard is an unauthenticated write path to the
database. This test is ~15 lines and catches that on the day it is introduced,
including in endpoints added later that nobody wrote a test for.

The remaining ~20 CMS CRUD endpoints get no individual tests. They are
`requireAdmin` plus a single query with no branches; the `requireAdmin` unit
tests and this guard cover what could actually go wrong in them.

### 5. Layer 3 — app units (`nuxt`)

**`buildNavTree`** — children nest under their parents; a child whose parent is
absent from the visible set is **promoted to root** rather than dropped (the
unpublished-parent case the source comments describe); row order is preserved;
empty input yields an empty array.

**`useAuthUserId`** — exposes the `sub` claim; `null` when there is no user.

**`useUserRole`** — clears the cached role when there is no user; sets `role`
and `isAdmin` after a successful fetch; yields `null` when the profile lookup
returns nothing.

**`middleware/auth`** — redirects to `/login` when unauthenticated; passes
through when authenticated.

**`middleware/cms-auth`** — `/login` when unauthenticated; `/dashboard` for a
non-admin; `/dashboard` when the role is unresolvable (fail closed); passes
through for an admin.

Its SSR early-return is **not** covered: Vite replaces `import.meta.server` with
a literal `false` in the test build, so that branch is unreachable dead code
under Vitest. Covering it would need a second, server-side build of the app.

**`AppHeader`** — mounted with `mountSuspended` and `useNavPages` / `useUserRole`
mocked: renders the five static links; appends CMS nav pages, with children
rendered as a dropdown; shows the CMS link only when `isAdmin` is true.

### 6. Source and config changes

`eslint.config.js` gains one override: `test/prefer-lowercase-title` is off for
`test/**`. Test titles name HTTP verbs and components, and the autofix rewrites
`POST /api/dashboard/trees` to `pOST /api/dashboard/trees`.

One change to application code: move `buildNavTree` out of
`app/composables/useNavPages.ts` into `app/utils/navTree.ts`, and import it in
the composable.

It is currently module-private, so it can only be reached through
`useNavPages`, which wraps it in `useAsyncData` and `$fetch` — testing a pure
tree-building function through two layers of async plumbing. `app/utils/` is
auto-imported by Nuxt, so it is the idiomatic home for a shared pure helper and
makes the export intentional rather than a side effect of testing. Behaviour is
unchanged.

No other application code is modified.

### 7. CI

`.github/workflows/ci.yaml` gains a `test` job mirroring the existing `lint`
and `build` jobs — checkout, Node 24.10.0, `npm i -g @antfu/ni`, `nci`,
`nr test` — and the trailing TODO comment is removed. The job needs no Docker
and no secrets, because nothing in the suite touches a database or a network.

## Layout

```
test/
  helpers/
    supabase-mock.ts        chainable Supabase query-builder double
    h3.ts                   fake H3Event + Nitro auto-import globals
  mocks/
    supabase-server.ts      #supabase/server alias target
  setup/
    server.ts               installs the globals for the `server` project
  server/
    utils/                  authUserId, requireAdmin, resolveSmartBlocks, defaultPages
    api/                    role.put, pages/[slug].get, trees.post
    api-guards.test.ts      source-level authorization guard
    trpc/                   appRouter
  app/
    utils/                  navTree
    composables/            useAuthUserId, useUserRole
    middleware/             auth, cms-auth
    components/             AppHeader
vitest.config.ts
```

## Success criteria

- `npm test` passes from a clean checkout with no Docker, no `.env`, and no
  network access.
- The suite completes fast enough to run on every commit — the `server` project
  in about a second, the `app` project bounded by one Nuxt environment build.
- The suite adds **no new lint errors**. Note that `npm run lint` and
  `npm run typecheck` were both already failing on `main` before this work —
  803 eslint errors repo-wide, and two `TS2321` "excessive stack depth" errors
  in `app/composables/useCmsPages.ts`. The bar here is parity with that
  baseline, not a green run; fixing the pre-existing failures is separate work.
- The test files are themselves type-clean. `test/` is outside the include list
  of every generated `.nuxt/tsconfig*.json`, so `nuxt typecheck` does not read
  them; they were verified with a throwaway tsconfig covering `test/`, `app/`
  and `server/`.
- CI fails when a test fails.
- Each behaviour called out in sections 3–5 has a test that fails if that
  behaviour is removed. Verified by mutation: reversing the PostGIS lng/lat
  order, commenting out or un-awaiting a `requireAdmin` call, dropping the
  `status = 'published'` filter, removing the HTML escaping, inverting the
  cms-auth admin check, removing `v-if="isAdmin"` from the CMS link, and
  dropping orphan promotion in `buildNavTree` each turn the suite red.

## Out of scope

- **Database integration tests.** Nothing here verifies the database itself:
  RLS policies, the `handle_new_user` trigger, `sync_total_points`, or the
  `leaderboard` view. That is the same class of bug as everything in the *Known
  Schema Issues* section of `AGENTS.md`, and Layer 2 cannot reach it — those
  tests confirm handlers *use* the service role correctly, not that the
  policies behind it are right. This is the natural follow-up project and needs
  Docker in CI, so it is recorded as a known gap in `AGENTS.md` rather than
  quietly omitted.
- **End-to-end browser tests.** No Playwright; no coverage of the real
  login → plant → leaderboard flow.
- **`PageBuilder.client.vue`.** GrapesJS is a browser-only canvas editor; unit
  testing it means asserting against a mock of GrapesJS.
- **The `@sidebase/nuxt-auth` demo routes and `Welcome/*` components**, which
  `AGENTS.md` marks as removable template leftovers.
- **Coverage thresholds.**

## Documentation

When the suite is green, update `AGENTS.md`:

- Add `npm test` and `npm run test:watch` to **Commands**.
- Add a **Testing** section: the two-project split and why, where tests live,
  the shared doubles, and the rule that server code is tested in the `node`
  project with Supabase mocked.
- In **What's Not Done Yet**, replace "Test suite (CI placeholder exists but no
  tests)" with the narrower remaining gap: database integration tests
  (RLS, triggers, views) and end-to-end browser tests.
