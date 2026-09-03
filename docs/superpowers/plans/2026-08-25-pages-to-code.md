# Pages to Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the six live public pages out of the Supabase `pages` table into hand-written Nuxt route files, then delete the four page-content migrations and the default-pages seeder.

**Architecture:** Each page becomes a static route file under `app/pages/`, shadowing the `[slug].vue` catch-all (Nuxt ranks static routes above dynamic ones). The two server-rendered "smart blocks" become Vue components backed by new public API endpoints, so live counts keep updating. The `pages` table, its schema migrations and the whole CMS stay intact for future vlog content.

**Tech Stack:** Nuxt 4, Vue 3.5, Tailwind (via `@nuxtjs/tailwindcss`), Supabase (`@nuxtjs/supabase`), oxlint + eslint (antfu config), vue-tsc.

**Spec:** `docs/superpowers/specs/2026-08-25-pages-to-code-design.md`

## Global Constraints

- **No test runner exists.** There is no vitest/jest. Per-task verification is `npm run lint` + `npm run typecheck`, and the full `npm run build` at the integration task. Do not add a test framework as part of this work.
- **Content source of truth is the REMOTE database**, not repo files. Fetch via the Supabase MCP `execute_sql` against project ref `lsjoxlmpciuzgxtqtjmf`. Repo files (`defaultPages.ts`, the `20260804*` migrations) are stale for `home` and absent for `mission`.
- **Titles come from the remote `title` column**, never from migration files. The content migrations use `on conflict (slug) do update set content = excluded.content` and never touched `title`. Live `climate-change` is titled `Climate change & trees`, not the migration's `Climate Change & Trees`.
- **Nothing is deleted until every page is verified rendering** (Task 10 gates Tasks 11–13).
- Existing style: `definePageMeta({ layout: 'default' })`, `<script setup lang="ts">`, markup inline in `<template>`. Match `app/pages/contact.vue`.
- Internal links use `<NuxtLink to="...">`; external links keep `<a href target="_blank" rel="noopener noreferrer">`.
- Preserve existing Tailwind classes verbatim — these pages are live and must render identically.

---

### Task 1: Back up the live page rows

**Files:**
- Create: `docs/superpowers/plans/2026-08-25-pages-backup.sql`

**Interfaces:**
- Produces: an on-disk copy of all six rows, so every later task can re-read original content without another remote round trip.

- [ ] **Step 1: Fetch all six rows from remote**

Use the Supabase MCP `execute_sql` tool:

```sql
select slug, title, status, show_in_nav, nav_order, content
from public.pages
order by slug;
```

- [ ] **Step 2: Write the result to the backup file**

Write each row as a runnable `insert` so the state can be restored if needed. Header comment must record the date and that these rows are being retired in favour of code routes.

- [ ] **Step 3: Verify the backup covers all six slugs**

```bash
grep -c "^insert into public.pages" docs/superpowers/plans/2026-08-25-pages-backup.sql
```
Expected: `6`

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-08-25-pages-backup.sql
git commit -m "chore: back up live CMS page rows before moving to code"
```

---

### Task 2: Public stats endpoint and StatsCounter component

**Files:**
- Create: `server/api/public/stats.get.ts`
- Create: `app/components/StatsCounter.vue`
- Reference: `server/utils/resolveSmartBlocks.ts:18-30` (`renderStatsCounter` — the markup and queries to port)

**Interfaces:**
- Produces: `GET /api/public/stats` returning `{ trees: number, communities: number, members: number }`; component `<StatsCounter />` (auto-imported, used by Tasks 4 and 9).

- [ ] **Step 1: Create the endpoint**

```ts
import { serverSupabaseServiceRole } from '#supabase/server'

// Public, unauthenticated: live counts for the StatsCounter component.
// Mirrors the queries that renderStatsCounter() used when this was a
// server-rendered smart block.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const [trees, communities, members] = await Promise.all([
    client.from('trees').select('id', { count: 'exact', head: true }),
    client.from('communities').select('id', { count: 'exact', head: true }),
    client.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  return {
    trees: trees.count ?? 0,
    communities: communities.count ?? 0,
    members: members.count ?? 0,
  }
})
```

- [ ] **Step 2: Create the component**

Ports the markup from `renderStatsCounter`. `useFetch` gives SSR, and `default` keeps the zeros fallback the old `n ?? 0` provided on error.

```vue
<script setup lang="ts">
interface Stats { trees: number, communities: number, members: number }

const { data: stats } = await useFetch<Stats>('/api/public/stats', {
  default: () => ({ trees: 0, communities: 0, members: 0 }),
})

const cells = computed(() => [
  { value: stats.value.trees, label: 'Trees Planted' },
  { value: stats.value.communities, label: 'Communities' },
  { value: stats.value.members, label: 'Active Members' },
])
</script>

<template>
  <section class="py-20 px-4">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        <div v-for="cell in cells" :key="cell.label">
          <div class="text-4xl font-bold text-green-600 mb-2">
            {{ cell.value }}
          </div>
          <div class="text-gray-600">
            {{ cell.label }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify lint and types**

```bash
npm run lint && npm run typecheck
```
Expected: both pass with zero warnings.

- [ ] **Step 4: Commit**

```bash
git add server/api/public/stats.get.ts app/components/StatsCounter.vue
git commit -m "feat: add StatsCounter component and public stats endpoint"
```

---

### Task 3: Public communities endpoint and CommunitiesCarousel component

**Files:**
- Create: `server/api/public/communities.get.ts`
- Create: `app/components/CommunitiesCarousel.vue`
- Reference: `server/utils/resolveSmartBlocks.ts:32-57` (`renderCommunitiesCarousel`)

**Interfaces:**
- Produces: `GET /api/public/communities` returning `Array<{ name: string, slug: string, description: string | null }>` (max 6, ordered by name); component `<CommunitiesCarousel />` (used by Task 9).

- [ ] **Step 1: Create the endpoint**

```ts
import { serverSupabaseServiceRole } from '#supabase/server'

// Public, unauthenticated: the communities shown by CommunitiesCarousel.
// Mirrors the query renderCommunitiesCarousel() used as a smart block.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('communities')
    .select('name, slug, description')
    .order('name')
    .limit(6)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data ?? []
})
```

- [ ] **Step 2: Create the component**

Note `line-clamp-3` and the empty state are both carried over from the original markup. Vue interpolation escapes `name`/`description`, so the old `escapeHtml()` is no longer needed.

```vue
<script setup lang="ts">
interface Community { name: string, slug: string, description: string | null }

const { data: communities } = await useFetch<Community[]>('/api/public/communities', {
  default: () => [],
})
</script>

<template>
  <section v-if="communities.length === 0" class="py-12 px-4">
    <div class="max-w-5xl mx-auto text-center text-gray-500">
      No communities yet.
    </div>
  </section>
  <section v-else class="py-16 px-4 bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">
        Active Communities
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="community in communities"
          :key="community.slug"
          class="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ community.name }}
          </h3>
          <p class="text-sm text-gray-600 line-clamp-3">
            {{ community.description || '' }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify lint and types**

```bash
npm run lint && npm run typecheck
```
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add server/api/public/communities.get.ts app/components/CommunitiesCarousel.vue
git commit -m "feat: add CommunitiesCarousel component and public communities endpoint"
```

---

### Task 4: Home page

**Files:**
- Modify: `app/pages/index.vue` (full rewrite)
- Source: `home` row in the Task 1 backup (3600 chars, title `Home`)

**Interfaces:**
- Consumes: `<StatsCounter />` from Task 2.

- [ ] **Step 1: Rewrite the page**

Replace the whole file. Drop the `usePublicPage` fetch, the 404 guard, the `v-html` wrapper and the `.tt-page-content` `<style>` block (no CMS HTML is injected any more). Structure:

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Home' })
</script>

<template>
  <div>
    <!-- sections ported verbatim from the `home` row -->
  </div>
</template>
```

Port every `<section>` from the backup's `home` content in order, preserving all Tailwind classes and inline `style` attributes exactly. Apply these conversions:
- The `<div data-block="stats-counter" …>` placeholder becomes `<StatsCounter />`.
- `<a href="/register">` becomes `<NuxtLink to="/register">`; `<a href="/what-can-i-do">` becomes `<NuxtLink to="/what-can-i-do">`. Keep their classes.

- [ ] **Step 2: Verify lint and types**

```bash
npm run lint && npm run typecheck
```
Expected: both pass.

- [ ] **Step 3: Confirm it renders**

```bash
npm run dev
```
Load `http://localhost:3000/` and confirm the hero, mission, how-it-works, stats and CTA sections all appear, with non-zero counts in the stats band. (This also fixes the pre-existing local 404 — `home` was never in `seed.sql`.)

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat: move home page from CMS to code"
```

---

### Task 5: Who We Are page

**Files:**
- Create: `app/pages/who-we-are.vue`
- Source: `who-we-are` row in the Task 1 backup (3781 chars, title `Who We Are`)

**Interfaces:**
- Consumes: nothing. No smart blocks, no lists, no internal links.

- [ ] **Step 1: Create the page**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Who We Are' })
</script>

<template>
  <div>
    <!-- sections ported verbatim from the `who-we-are` row -->
  </div>
</template>
```

Port the content verbatim. This page has no internal links and no lists, so no conversions apply beyond wrapping in a root `<div>`.

- [ ] **Step 2: Verify lint and types**

```bash
npm run lint && npm run typecheck
```
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add app/pages/who-we-are.vue
git commit -m "feat: move who-we-are page from CMS to code"
```

---

### Task 6: Climate Change page

**Files:**
- Create: `app/pages/climate-change.vue`
- Source: `climate-change` row in the Task 1 backup (5060 chars, title **`Climate change & trees`** — lower-case "change", per the Global Constraints)

**Interfaces:**
- Consumes: nothing.

- [ ] **Step 1: Create the page**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Climate change & trees' })
</script>

<template>
  <div>
    <!-- sections ported verbatim from the `climate-change` row -->
  </div>
</template>
```

- [ ] **Step 2: Restore list markers**

This page contains `<ul>`/`<ol>`. Their markers previously came from the `.tt-page-content` CSS block, which no longer applies. Add explicit classes to each list so rendering is unchanged:
- `<ul>` → `<ul class="list-disc my-4 pl-6">`
- `<ol>` → `<ol class="list-decimal my-4 pl-6">`
- nested `<ul>` inside a `<ul>` → `list-circle` is not a Tailwind class; use `<ul class="list-[circle] my-4 pl-6">`
- `<li>` → `<li class="my-1">`

If a list already carries Tailwind list classes in the source HTML, leave it alone.

- [ ] **Step 3: Convert internal links**

This page has `href="/…"` links. Convert each to `<NuxtLink to="/…">`, preserving classes.

- [ ] **Step 4: Verify lint and types**

```bash
npm run lint && npm run typecheck
```
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add app/pages/climate-change.vue
git commit -m "feat: move climate-change page from CMS to code"
```

---

### Task 7: What Can I Do page

**Files:**
- Create: `app/pages/what-can-i-do.vue`
- Source: `what-can-i-do` row in the Task 1 backup (6369 chars, title `What Can I Do?`)

**Interfaces:**
- Consumes: nothing.

**Note:** the live content matches migration `20260804140000_add_global_organizations_page.sql` (its *first* upsert), NOT the similarly-named `20260804130000_update_what_can_i_do_page_content.sql`, which holds a superseded 6254-char version. Use the backup, not the migrations.

- [ ] **Step 1: Create the page**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'What Can I Do?' })
</script>

<template>
  <div>
    <!-- sections ported verbatim from the `what-can-i-do` row -->
  </div>
</template>
```

- [ ] **Step 2: Convert internal links**

Convert every `href="/…"` to `<NuxtLink to="/…">`, preserving classes. This page links internally to the organizations page and to `/register`.

- [ ] **Step 3: Verify lint and types**

```bash
npm run lint && npm run typecheck
```
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add app/pages/what-can-i-do.vue
git commit -m "feat: move what-can-i-do page from CMS to code"
```

---

### Task 8: Global tree planting organizations page

**Files:**
- Create: `app/pages/global-tree-planting-organizations.vue`
- Source: `global-tree-planting-organizations` row in the Task 1 backup (5566 chars, title `Global tree planting organizations`)

**Interfaces:**
- Consumes: nothing.

- [ ] **Step 1: Create the page**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Global tree planting organizations' })
</script>

<template>
  <div>
    <!-- sections ported verbatim from the organizations row -->
  </div>
</template>
```

- [ ] **Step 2: Preserve external links exactly**

Five organization links (`onetreeplanted.org`, `eden-plus.org`, `weforest.org`, `treesisters.org`, `trees.org`) must stay as `<a href="https://…" target="_blank" rel="noopener noreferrer">`. Do **not** convert these to `NuxtLink`. The single `href="/register"` CTA *does* become `<NuxtLink to="/register">`.

- [ ] **Step 3: Verify lint and types**

```bash
npm run lint && npm run typecheck
```
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add app/pages/global-tree-planting-organizations.vue
git commit -m "feat: move global organizations page from CMS to code"
```

---

### Task 9: Mission page and nav link

**Files:**
- Create: `app/pages/mission.vue`
- Modify: `app/components/AppHeader.vue:15-21` (the `staticLinks` array)
- Source: `mission` row in the Task 1 backup (3755 chars, title `Our Mission`)

**Interfaces:**
- Consumes: `<StatsCounter />` (Task 2) and `<CommunitiesCarousel />` (Task 3). This is the only page using both.

- [ ] **Step 1: Create the page**

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Our Mission' })
</script>

<template>
  <div>
    <!-- sections ported verbatim from the `mission` row -->
  </div>
</template>
```

Conversions: `<div data-block="stats-counter" …>` → `<StatsCounter />`; `<div data-block="communities-carousel" …>` → `<CommunitiesCarousel />`; lists get the explicit classes from Task 6 Step 2; internal `href="/…"` → `<NuxtLink to="/…">`.

- [ ] **Step 2: Add the static nav entry**

`mission` is the only page with `show_in_nav = true`, so it is the sole entry the dynamic nav produces today. Once its row is deleted the link vanishes unless it is made static. In `app/components/AppHeader.vue`, add to `staticLinks` after the `who-we-are` entry:

```txt
  { to: '/mission', label: 'Our Mission', children: [] },
```

Leave `useNavPages()` and the `navItems` computed untouched — they stay wired for future CMS content.

- [ ] **Step 3: Verify lint and types**

```bash
npm run lint && npm run typecheck
```
Expected: both pass.

- [ ] **Step 4: Confirm it renders**

Load `http://localhost:3000/mission` and confirm both the stats band and the communities grid render with live data, and that "Our Mission" appears in the header nav exactly once (not duplicated by the dynamic nav, whose row still exists at this point — if it appears twice, that is expected until Task 12 deletes the row).

- [ ] **Step 5: Commit**

```bash
git add app/pages/mission.vue app/components/AppHeader.vue
git commit -m "feat: move mission page from CMS to code and pin its nav link"
```

---

### Task 10: Integration verification (gates all teardown)

**Files:**
- No changes. This task is a gate.

**Interfaces:**
- Consumes: all six pages from Tasks 4–9.

- [ ] **Step 1: Full build**

```bash
npm run lint && npm run typecheck && npm run build
```
Expected: all three succeed.

- [ ] **Step 2: Compare every route against the live site**

With `npm run dev` running, load each local route and compare against the same path on the live site:

| Local | Live |
|---|---|
| `/` | production `/` |
| `/who-we-are` | production `/who-we-are` |
| `/climate-change` | production `/climate-change` |
| `/what-can-i-do` | production `/what-can-i-do` |
| `/global-tree-planting-organizations` | production `/global-tree-planting-organizations` |
| `/mission` | production `/mission` |

Check: section order, headings, spacing, colours, list markers, working links, and live numbers in the stats/communities blocks. Also confirm each browser tab title matches the table of titles in Tasks 4–9.

- [ ] **Step 3: Confirm the CMS still works**

Load `/about` (a `seed.sql` sample page) and confirm the `[slug].vue` catch-all still renders CMS content. Load `/cms/pages` as an admin and confirm the editor still lists and opens pages.

- [ ] **Step 4: STOP if anything differs**

Do not proceed to Tasks 11–13 until every page matches. Teardown is irreversible on remote.

---

### Task 11: Remove the content migrations and seeder

**Files:**
- Delete: `supabase/migrations/20260804120000_update_climate_change_page_content.sql`
- Delete: `supabase/migrations/20260804130000_update_what_can_i_do_page_content.sql`
- Delete: `supabase/migrations/20260804140000_add_global_organizations_page.sql`
- Delete: `supabase/migrations/20260804150000_add_org_website_links.sql`
- Delete: `server/utils/defaultPages.ts`
- Delete: `server/api/cms/seed-default-pages.post.ts`

**Interfaces:**
- Consumes: the Task 10 gate. Do not start until it passed.

- [ ] **Step 1: Confirm the seeder has no callers**

```bash
grep -rn "seed-default-pages\|defaultPages\|DEFAULT_PAGES" --include='*.vue' --include='*.ts' app server
```
Expected: matches only inside the two files being deleted. If anything in `app/` references them, stop and fix that first.

- [ ] **Step 2: Delete the files**

```bash
git rm supabase/migrations/20260804120000_update_climate_change_page_content.sql \
       supabase/migrations/20260804130000_update_what_can_i_do_page_content.sql \
       supabase/migrations/20260804140000_add_global_organizations_page.sql \
       supabase/migrations/20260804150000_add_org_website_links.sql \
       server/utils/defaultPages.ts \
       server/api/cms/seed-default-pages.post.ts
```

- [ ] **Step 3: Confirm the schema migrations survive**

```bash
ls supabase/migrations/
```
Expected: 10 files remain, including `20260604122558_create_pages_table.sql`, `20260604150746_add_pages_nav_hierarchy.sql` and `20260802000000_add_pages_public_read_policy.sql`.

- [ ] **Step 4: Verify a clean replay**

```bash
npm run db:reset
```
Expected: succeeds. The local `pages` table then holds only the four `seed.sql` sample rows (`about`, `our-mission`, `get-involved`, `press-kit`) — the three migration-inserted pages are gone.

- [ ] **Step 5: Verify the app still builds**

```bash
npm run lint && npm run typecheck && npm run build
```
Expected: all pass. Nothing should reference the deleted seeder.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove page content migrations and default-pages seeder"
```

---

### Task 12: Delete the live page rows

**Files:**
- No repo changes. Remote database only.

**Interfaces:**
- Consumes: the Task 1 backup (restore path) and the Task 10 gate.

- [ ] **Step 1: Confirm the backup exists**

```bash
grep -c "^insert into public.pages" docs/superpowers/plans/2026-08-25-pages-backup.sql
```
Expected: `6`.

- [ ] **Step 2: Delete the six rows**

Via Supabase MCP `execute_sql`:

```sql
delete from public.pages
where slug in (
  'home', 'who-we-are', 'climate-change',
  'what-can-i-do', 'global-tree-planting-organizations', 'mission'
);
```

- [ ] **Step 3: Verify the table is empty but present**

```sql
select count(*) from public.pages;
```
Expected: `0`. The table itself must still exist — confirm the query returns a count rather than an error.

- [ ] **Step 4: Confirm the site still renders**

Reload each of the six routes. They must render identically — they no longer touch the database. Confirm "Our Mission" now appears exactly once in the nav.

---

### Task 13: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md` — the "Current remote state (2026-08-02)" section and the `db:push` warning that references the `20260804*` migrations.

**Interfaces:**
- Consumes: the completed state from Tasks 11–12.

- [ ] **Step 1: Replace the stale remote-state section**

The existing section claims the four `20260804*` migrations are unapplied and would overwrite live content. That is now doubly wrong: they were in fact applied, and the files no longer exist. Replace it with a "Current remote state (2026-08-25)" section recording:
- The six public pages now live in `app/pages/*.vue`; the `pages` table is empty and reserved for future CMS content (vlog).
- The four `20260804*` versions remain in remote migration history with no corresponding files. This drift is intentional and harmless — `db:push` skips versions already in history. `supabase migration repair --status reverted <version>` would clear them if exactness is wanted.
- The `db:push` warning about overwriting live page content is obsolete and removed.

- [ ] **Step 2: Note where page content now lives**

Add a line to the CMS/pages description stating that public marketing pages are code (`app/pages/`), and the CMS and `[slug].vue` catch-all serve only CMS-authored content.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: record pages-to-code move and intentional migration drift"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| 1. Six pages become route files | 4, 5, 6, 7, 8, 9 |
| Titles from remote, not migrations | Global Constraints; Tasks 4–9 Step 1 |
| 2. Conversion rules (NuxtLink, lists) | 6 Step 2–3, 7 Step 2, 8 Step 2, 9 Step 1 |
| 3. Smart blocks become components | 2, 3 (consumed in 4, 9) |
| 4. Navigation | 9 Step 2 |
| 5. What the CMS keeps | 10 Step 3 (verified); 11 Step 3 (schema migrations survive) |
| 6. Teardown — repo | 11 |
| 6. Teardown — remote rows | 12 |
| 6. Teardown — accepted drift | 13 |
| Backup before deletion | 1 |
| Error handling (degrade to zeros / empty state) | 2 Step 2, 3 Step 2 |
| Testing and verification | 10, plus per-task lint/typecheck |

No gaps.

**Placeholder scan:** The `<!-- sections ported verbatim from the … row -->` comments in Tasks 4–9 are pointers to Task 1's concrete backup file, not deferred decisions — the content is 3.5–6.4KB of HTML per page and lives in that file rather than being duplicated here. Every conversion applied to it is stated explicitly per task. No TBDs.

**Type consistency:** `StatsCounter` consumes `{ trees, communities, members }` from `/api/public/stats` — matches the endpoint's return in Task 2. `CommunitiesCarousel` consumes `{ name, slug, description }` from `/api/public/communities` — matches Task 3's `.select('name, slug, description')`. `staticLinks` entries in Task 9 use `{ to, label, children }`, matching the `NavItem` interface at `AppHeader.vue:9-13`.
