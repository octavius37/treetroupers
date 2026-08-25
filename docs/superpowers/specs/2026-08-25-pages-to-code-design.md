# Move Public Pages from CMS to Code — Design

**Date:** 2026-08-25
**Status:** Approved (pending spec review)

## Goal

Move the six live public pages out of the Supabase `pages` table and into
hand-written Nuxt route files, so they are edited through code review rather
than through the GrapesJS editor. Keep the CMS itself intact and working for
future vlog/blog content.

## Context

### How pages render today

Public page content lives in the `pages` table as HTML strings. Two routes read it:

- `app/pages/index.vue` — hardcoded to the `home` slug.
- `app/pages/[slug].vue` — catch-all for every other slug.

Both call `usePublicPage()` → `GET /api/public/pages/[slug]`, which fetches the
row with `serverSupabaseServiceRole` and pipes `content` through
`resolveSmartBlocks()` before returning it as `html`. The routes then render it
with `v-html`.

Site nav is a hybrid: `AppHeader.vue` holds a `staticLinks` array and appends a
CMS-driven tree from `useNavPages()` → `GET /api/public/nav`, which returns
published rows with `show_in_nav = true`.

### Where the content actually is

Verified against the hosted project (ref `lsjoxlmpciuzgxtqtjmf`) on 2026-08-25 by
comparing `md5(content)` of each live row against the HTML in the repo:

| Slug | Live length | Content also in repo? |
|------|-------------|-----------------------|
| `climate-change` | 5060 | Yes — `20260804120000` migration, md5 identical |
| `what-can-i-do` | 6369 | Yes — `20260804140000` migration, md5 identical |
| `global-tree-planting-organizations` | 5566 | Yes — `20260804150000` migration, md5 identical |
| `who-we-are` | 3781 | Yes — `defaultPages.ts`, same length |
| `home` | 3600 | **No** — `defaultPages.ts` has 3175 chars; edited since seeding |
| `mission` | 3755 | **No** — authored entirely in the CMS |

**The remote database is therefore the only complete source of truth**, and the
migration files are the source for exactly three of the six pages.

Note that `AGENTS.md` ("Current remote state (2026-08-02)") claims the four
`20260804*` migrations are unapplied on remote. That is stale: remote migration
history lists all fourteen versions, the three page rows carry `updated_at` of
2026-08-11, and their md5s match the migration content byte-for-byte. This spec
supersedes that section.

### Migration filenames are misleading

`20260804140000_add_global_organizations_page.sql` contains **two** upserts: it
re-updates `what-can-i-do` to its final 6369-char version *and* inserts the
global-organizations page. The intermediate `what-can-i-do` content in
`20260804130000` (6254 chars) never survives to the final state. Anyone reading
filenames alone will map this content to the wrong slugs.

### Local vs remote divergence

`seed.sql` seeds four unrelated sample pages (`about`, `our-mission`,
`get-involved`, `press-kit`) and does **not** seed `home` or `who-we-are`. The
local dev homepage consequently 404s today. Moving `home` into code fixes that
as a side effect.

## Design

### 1. Six pages become route files

| Slug | File | Action |
|------|------|--------|
| `home` | `app/pages/index.vue` | Rewrite |
| `who-we-are` | `app/pages/who-we-are.vue` | New |
| `climate-change` | `app/pages/climate-change.vue` | New |
| `what-can-i-do` | `app/pages/what-can-i-do.vue` | New |
| `global-tree-planting-organizations` | `app/pages/global-tree-planting-organizations.vue` | New |
| `mission` | `app/pages/mission.vue` | New |

Content is pulled from the remote rows, not from the repo files, for all six.
Each file follows the shape of the existing hand-written `app/pages/contact.vue`:
`definePageMeta({ layout: 'default' })`, a `useHead({ title })` preserving the
current DB `title`, and the markup inline in `<template>`.

**Titles must also come from remote, not from the migrations.** The content
migrations end in `on conflict (slug) do update set content = excluded.content,
updated_at = now()` — they never touch `title`. So a slug's live title is
whatever predated the migration: `climate-change` is titled
`Climate change & trees` on remote, while `20260804120000` supplies
`Climate Change & Trees`. Taking titles from the migration files would silently
change page titles and break the match with the existing `AppHeader` link label.

Nuxt ranks static routes above dynamic ones, so these six shadow `[slug].vue`
automatically. No routing configuration is needed.

### 2. Conversion rules

- Stored HTML pastes into `<template>` under a single root element.
- Internal `href="/x"` links become `<NuxtLink to="/x">` for client-side
  navigation. External links (the five org sites on the organizations page) keep
  `<a href>` with their existing `target="_blank" rel="noopener noreferrer"`.
- `climate-change` and `mission` contain `<ul>`/`<ol>`. Today their markers are
  restored by the `.tt-page-content` CSS block that counteracts Tailwind
  preflight. In code pages that global crutch no longer applies, so the lists get
  explicit `list-disc` / `list-decimal` and padding classes instead.
- Smart-block placeholder `<div>`s are replaced by component tags (below).

### 3. Smart blocks become real components

`resolveSmartBlocks()` currently substitutes two markers server-side with
freshly-queried counts. Which pages use them:

| Block | Used by |
|-------|---------|
| `stats-counter` | `home`, `mission` |
| `communities-carousel` | `mission` |

Freezing these as static HTML would silently stop the numbers updating, so each
becomes a component backed by a new public endpoint:

- `app/components/StatsCounter.vue` ← `GET /api/public/stats` — counts of
  `trees`, `communities`, `profiles`.
- `app/components/CommunitiesCarousel.vue` ← `GET /api/public/communities` —
  first 6 communities by name (`name`, `slug`, `description`).

Both endpoints use `serverSupabaseServiceRole` and mirror the existing queries in
`resolveSmartBlocks.ts` exactly, so rendered output is unchanged. Markup is
ported from the template strings in that file, with the manual `escapeHtml()`
calls dropped — Vue interpolation escapes by default.

`resolveSmartBlocks.ts` itself is **kept**: `[slug].vue` still serves CMS pages
and those may still contain block markers.

### 4. Navigation

`mission` is the only page with `show_in_nav = true`, so it is the only entry the
dynamic nav currently produces. It gains a static `{ to: '/mission', label: 'Our
Mission' }` entry in `AppHeader.staticLinks`.

`useNavPages()` and `/api/public/nav` are **kept and still wired**. Once the rows
are deleted they return an empty list and contribute nothing, but they stay ready
for CMS-authored content without needing to be rebuilt.

### 5. What the CMS keeps

Deliberately untouched, so vlog content can reuse them:

- The `pages` table and its three schema migrations (`20260604122558`,
  `20260604150746`, `20260802000000`).
- `/cms/*` routes, `PageBuilder.client.vue`, `/api/cms/pages*` CRUD, `upload`.
- `app/pages/[slug].vue`, `usePublicPage()`, `/api/public/pages/[slug]`.
- The four sample pages in `seed.sql` — none collide with the six code routes
  (`our-mission` is a distinct slug from `mission`), so they become the CMS
  smoke test and keep the nav and catch-all paths exercised locally.

### 6. Teardown

Only after the six pages are built and verified rendering:

**Deleted from the repo:**

- `supabase/migrations/20260804120000_update_climate_change_page_content.sql`
- `supabase/migrations/20260804130000_update_what_can_i_do_page_content.sql`
- `supabase/migrations/20260804140000_add_global_organizations_page.sql`
- `supabase/migrations/20260804150000_add_org_website_links.sql`
- `server/utils/defaultPages.ts`
- `server/api/cms/seed-default-pages.post.ts`

The seeder and its data have no callers anywhere in `app/` or `server/` — only
the endpoint imports the constant. Both must go regardless, since re-running the
seeder would recreate rows for slugs that code now owns.

**Deleted from the remote database:** the six page rows, after being dumped to a
timestamped SQL backup. The Vue files are the durable copy; the dump covers the
window before they are proven.

**Accepted drift:** remote migration history retains the four `20260804*` version
rows whose files no longer exist. This is cosmetic — `db:push` skips versions
already in history, so nothing re-runs and nothing breaks. `AGENTS.md` gets a
note recording this, replacing its stale "Current remote state" section. A
`supabase migration repair --status reverted` would clear the rows if exactness
is ever wanted; it is not run here because it needs the direct-connection
workaround documented in `AGENTS.md`.

## Data flow

Before: browser → `index.vue` / `[slug].vue` → `usePublicPage()` →
`/api/public/pages/[slug]` → service-role select → `resolveSmartBlocks()` →
`v-html`.

After, for the six pages: browser → route file → static markup, plus
`StatsCounter` / `CommunitiesCarousel` fetching their own endpoints. No DB round
trip for page content, so these pages survive a database outage and prerender
cleanly.

After, for CMS pages: unchanged from the "before" path.

## Error handling

- The six routes cannot 404 on missing content; they are files. The
  `createError({ statusCode: 404 })` guards in `index.vue` disappear with the
  fetch.
- `StatsCounter` and `CommunitiesCarousel` must degrade rather than break the
  page. On fetch failure the stats component renders zeros (matching today's
  `n ?? 0` behaviour) and the carousel renders its existing "No communities yet."
  empty state — the same fallback `renderCommunitiesCarousel()` uses now.
- `[slug].vue` keeps its existing 404 behaviour for unknown CMS slugs.

## Testing and verification

The repo has no test runner, so verification is build-level plus visual:

1. `npm run lint` — oxlint and eslint, zero warnings.
2. `npm run typecheck` — `vue-tsc`.
3. `npm run build` — production build succeeds.
4. Page-by-page visual comparison of each local route against the live site
   **before** any deletion, confirming markup, styling and the live counts in the
   two smart blocks.
5. `npm run db:reset` after the migration deletions, confirming a clean replay
   with the four sample CMS pages intact and the catch-all still rendering them.

## Out of scope

- Building the vlog/blog collection itself. This change only preserves the CMS
  machinery it will reuse.
- Dropping the `pages` table, removing the CMS page editor, or reverting remote
  migration history.
- The unused `@sidebase/nuxt-auth` / `next-auth` configuration.
- The pre-existing `contact.vue` form TODO (not wired to an email service).
