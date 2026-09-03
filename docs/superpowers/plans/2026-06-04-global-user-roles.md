# Global User Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add global `admin`/`user` roles so admins get full CMS access while regular users are limited to the dashboard and public pages.

**Architecture:** A `role` column on `profiles` (default `user`) is the source of truth. Security is enforced server-side via a `requireAdmin` helper applied to every `/api/cms/*` endpoint; client-side a `useUserRole()` composable drives CMS route redirects and nav visibility. Admins manage roles from the CMS users page through an admin-only role endpoint.

**Tech Stack:** Nuxt 3, Vue 3, `@nuxtjs/supabase` (Supabase auth + Postgres), H3 server routes, Supabase MCP for migrations.

---

## Reference: existing patterns

- Server CMS auth check (to be replaced): `server/api/cms/users.get.ts:4-5`
  ```ts
  const user = await serverSupabaseUser(event)
  if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }
  ```
- Service role client: `serverSupabaseServiceRole(event)` from `#supabase/server` (bypasses RLS).
- Existing profiles RLS: `profiles: own update` = `USING (auth.uid() = auth_user_id)` with **no** `WITH CHECK` — this lets a user update their own row, so `role` must be protected here.
- Bootstrap admin email: `p.bollerman@eceoffshore.com`.
- Supabase migrations applied via the `mcp__supabase__apply_migration` tool; SQL inspected via `mcp__supabase__execute_sql`; types regenerated via `mcp__supabase__generate_typescript_types`.

## File Structure

- **Migration** (via Supabase MCP, name `add_role_to_profiles`): enum + column + seed + RLS guard.
- Create `server/utils/requireAdmin.ts` — admin gate helper.
- Modify all `/api/cms/*` endpoints — use `requireAdmin`.
- Create `server/api/cms/users/[id]/role.put.ts` — admin-only role update.
- Create `app/composables/useUserRole.ts` — client role/isAdmin.
- Modify `app/middleware/cms-auth.ts` — redirect non-admins.
- Modify `app/components/AppHeader.vue` — hide CMS link from non-admins.
- Modify `app/pages/cms/users.vue` — per-row role control.
- Regenerate `app/types/database.types.ts`.

---

## Task 1: Add `role` column, seed admin, and RLS guard (migration)

**Files:**
- Migration via `mcp__supabase__apply_migration` (name: `add_role_to_profiles`)
- Modify: `app/types/database.types.ts` (regenerated)

- [ ] **Step 1: Inspect current state**

Run tool `mcp__supabase__execute_sql` with:
```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name='role';
```
Expected: empty result (column does not exist yet).

- [ ] **Step 2: Apply the migration**

Call `mcp__supabase__apply_migration` with name `add_role_to_profiles` and query:
```sql
-- 1. Role enum
create type public.user_role as enum ('admin', 'user');

-- 2. Column with safe default
alter table public.profiles
  add column role public.user_role not null default 'user';

-- 3. Seed bootstrap admin by email
update public.profiles p
set role = 'admin'
from auth.users u
where p.auth_user_id = u.id
  and u.email = 'p.bollerman@eceoffshore.com';

-- 4. Prevent self-promotion: replace the own-update policy with one that
--    forbids changing the role column. Service role bypasses RLS, so admin
--    endpoints are unaffected.
drop policy if exists "profiles: own update" on public.profiles;

create policy "profiles: own update" on public.profiles
  for update
  using (auth.uid() = auth_user_id)
  with check (
    auth.uid() = auth_user_id
    and role = (select role from public.profiles where id = profiles.id)
  );
```

- [ ] **Step 3: Verify column, seed, and policy**

Run tool `mcp__supabase__execute_sql` with:
```sql
select p.id, u.email, p.role from public.profiles p
join auth.users u on u.id = p.auth_user_id
order by p.role;
```
Expected: the row for `p.bollerman@eceoffshore.com` shows `role = admin`; all others show `role = user`.

Then:
```sql
select polname, with_check is not null as has_check from pg_policies pol
join pg_policy p on p.polname = pol.policyname
where pol.tablename = 'profiles' and pol.policyname = 'profiles: own update';
```
Expected: one row, `has_check = true`.

- [ ] **Step 4: Regenerate database types**

Call `mcp__supabase__generate_typescript_types` and overwrite `app/types/database.types.ts` with the result. Confirm the `profiles` Row now includes `role: "admin" | "user"` (and Insert/Update include `role?: "admin" | "user"`).

- [ ] **Step 5: Commit**

```bash
git add app/types/database.types.ts
git commit -m "feat: add role column to profiles with admin seed and self-promotion guard"
```

---

## Task 2: `requireAdmin` server helper

**Files:**
- Create: `server/utils/requireAdmin.ts`

This helper is the authoritative security boundary. Nuxt auto-imports files in `server/utils/`, so `requireAdmin` is callable in any server route without an explicit import.

- [ ] **Step 1: Write the helper**

Create `server/utils/requireAdmin.ts`:
```ts
import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

/**
 * Ensures the request comes from an authenticated admin.
 * Throws 401 if not logged in, 403 if not an admin.
 * Returns the auth user and their profile on success.
 */
export async function requireAdmin(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (error || !profile) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  if (profile.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  return { user, profile }
}
```

- [ ] **Step 2: Type-check the helper**

Run: `npx nuxi typecheck` (or `npx vue-tsc --noEmit` if typecheck script absent).
Expected: no errors referencing `server/utils/requireAdmin.ts`. (Pre-existing unrelated errors, if any, are acceptable — note them but do not fix.)

- [ ] **Step 3: Commit**

```bash
git add server/utils/requireAdmin.ts
git commit -m "feat: add requireAdmin server helper"
```

---

## Task 3: Gate all `/api/cms/*` endpoints with `requireAdmin`

**Files (modify each):**
- `server/api/cms/users.get.ts`
- `server/api/cms/users/[id].put.ts`
- `server/api/cms/communities.get.ts`, `server/api/cms/communities.post.ts`
- `server/api/cms/pages.get.ts`, `server/api/cms/pages.post.ts`
- `server/api/cms/rewards.get.ts`, `server/api/cms/rewards.post.ts`
- `server/api/cms/trees.get.ts`
- `server/api/cms/tree-species.get.ts`, `server/api/cms/tree-species.post.ts`
- `server/api/cms/stats.get.ts`
- Plus any other files under `server/api/cms/` (verify in Step 1)

- [ ] **Step 1: List every CMS endpoint to confirm the full set**

Run: `find server/api/cms -name '*.ts'`
Expected: confirms the files above. If new files appear, include them.

- [ ] **Step 2: Replace the auth check in each endpoint**

In every file, find this pattern near the top of the handler:
```ts
const user = await serverSupabaseUser(event)
if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }
```
Replace with:
```ts
await requireAdmin(event)
```
Then remove `serverSupabaseUser` from the `#supabase/server` import on line 1 if it is no longer used in that file (keep `serverSupabaseServiceRole`). `requireAdmin` is auto-imported — do not add an import for it.

Example — `server/api/cms/users.get.ts` becomes:
```ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
```

- [ ] **Step 3: Verify no stale `serverSupabaseUser` 401 checks remain in CMS**

Run: `grep -rn "serverSupabaseUser" server/api/cms`
Expected: no matches (every CMS endpoint now uses `requireAdmin`).

- [ ] **Step 4: Type-check**

Run: `npx nuxi typecheck`
Expected: no new errors in `server/api/cms/`.

- [ ] **Step 5: Commit**

```bash
git add server/api/cms
git commit -m "feat: require admin role on all CMS API endpoints"
```

---

## Task 4: Admin-only role update endpoint

**Files:**
- Create: `server/api/cms/users/[id]/role.put.ts`

This serves `PUT /api/cms/users/:id/role`. The `[id]` directory may not exist yet (sibling `[id].put.ts` is a file) — create the directory.

- [ ] **Step 1: Create the endpoint**

Create `server/api/cms/users/[id]/role.put.ts`:
```ts
import type { Database } from '~/types/database.types'
import { serverSupabaseServiceRole } from '#supabase/server'

const VALID_ROLES = ['admin', 'user'] as const
type Role = (typeof VALID_ROLES)[number]

export default defineEventHandler(async (event) => {
  const { profile: actingProfile } = await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing user id' }) }

  const body = await readBody<{ role?: string }>(event)
  if (!body?.role || !VALID_ROLES.includes(body.role as Role)) {
    throw createError({ statusCode: 400, message: 'role must be "admin" or "user"' })
  }
  const role = body.role as Role

  // Prevent an admin from demoting themselves (avoids locking out the last admin).
  if (id === actingProfile.id && role === 'user') {
    throw createError({
      statusCode: 400,
      message: 'You cannot remove your own admin role. Promote another admin first.',
    })
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await client
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
```

- [ ] **Step 2: Type-check**

Run: `npx nuxi typecheck`
Expected: no new errors in this file.

- [ ] **Step 3: Manual smoke test (dev server running)**

Start dev server if not running: `yarn dev`. With an admin session cookie, in the browser devtools console on the app origin:
```js
await $fetch('/api/cms/users/<some-non-admin-profile-id>/role', { method: 'PUT', body: { role: 'admin' } })
```
Expected: returns the updated profile with `role: 'admin'`. Then verify in DB via `mcp__supabase__execute_sql`:
```sql
select id, role from public.profiles where id = '<that-id>';
```
Expected: `role = admin`. (Revert with `{ role: 'user' }` afterward if desired.)

- [ ] **Step 4: Commit**

```bash
git add server/api/cms/users
git commit -m "feat: add admin-only role update endpoint"
```

---

## Task 5: `useUserRole` composable

**Files:**
- Create: `app/composables/useUserRole.ts`

Provides the client-side role and `isAdmin` flag. Uses `useAsyncData` with a stable key so the role is fetched once and shared. Reads from the public-readable `profiles` table (the `profiles: public read` RLS policy allows SELECT).

- [ ] **Step 1: Write the composable**

Create `app/composables/useUserRole.ts`:
```ts
import type { Database } from '~/types/database.types'

export function useUserRole() {
  const user = useSupabaseUser()
  const client = useSupabaseClient<Database>()

  const { data: role, refresh } = useAsyncData(
    'current-user-role',
    async () => {
      if (!user.value) { return null }
      const { data } = await client
        .from('profiles')
        .select('role')
        .eq('auth_user_id', user.value.id)
        .single()
      return data?.role ?? null
    },
    { watch: [user] },
  )

  const isAdmin = computed(() => role.value === 'admin')

  return { role, isAdmin, refresh }
}
```

- [ ] **Step 2: Type-check**

Run: `npx nuxi typecheck`
Expected: no new errors in this file.

- [ ] **Step 3: Commit**

```bash
git add app/composables/useUserRole.ts
git commit -m "feat: add useUserRole composable"
```

---

## Task 6: Redirect non-admins out of the CMS (client middleware)

**Files:**
- Modify: `app/middleware/cms-auth.ts`

- [ ] **Step 1: Replace the middleware body**

Replace the entire contents of `app/middleware/cms-auth.ts` with:
```ts
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }

  const { isAdmin, refresh } = useUserRole()
  await refresh()
  if (!isAdmin.value) {
    return navigateTo('/dashboard')
  }
})
```

- [ ] **Step 2: Manual test — non-admin blocked**

With dev server running and logged in as a `user`-role account, navigate to `/cms`.
Expected: redirected to `/dashboard`.
Then as the admin account, navigate to `/cms`.
Expected: CMS loads normally.

- [ ] **Step 3: Commit**

```bash
git add app/middleware/cms-auth.ts
git commit -m "feat: redirect non-admins away from CMS routes"
```

---

## Task 7: Hide CMS nav link from non-admins

**Files:**
- Modify: `app/components/AppHeader.vue`

- [ ] **Step 1: Add isAdmin to the script**

In the `<script setup>` block of `app/components/AppHeader.vue`, where composables are set up (near the existing `useSupabaseUser()` usage), add:
```ts
const { isAdmin } = useUserRole()
```

- [ ] **Step 2: Gate the CMS link**

Find (around lines 98-100):
```vue
<NuxtLink to="/cms" class="text-sm text-gray-600 hover:text-gray-900">
  CMS
</NuxtLink>
```
Add `v-if="isAdmin"`:
```vue
<NuxtLink v-if="isAdmin" to="/cms" class="text-sm text-gray-600 hover:text-gray-900">
  CMS
</NuxtLink>
```

- [ ] **Step 3: Manual test**

As a `user`-role account: the CMS link is absent from the header; Logout and dashboard remain.
As the admin account: the CMS link is visible.

- [ ] **Step 4: Commit**

```bash
git add app/components/AppHeader.vue
git commit -m "feat: show CMS nav link only to admins"
```

---

## Task 8: Role control on the CMS users page

**Files:**
- Modify: `app/pages/cms/users.vue`

Add a Role column with a per-row `<select>` that calls the role endpoint. The current admin's own row is read-only (reinforces the self-demotion guard).

- [ ] **Step 1: Add current-user identity and role-change handler to the script**

In the `<script setup>` of `app/pages/cms/users.vue`, after the existing `error` ref (line 9), add:
```ts
const supaUser = useSupabaseUser()
const roleSavingId = ref<string | null>(null)

async function changeRole(profile: any, newRole: string) {
  if (profile.role === newRole) { return }
  roleSavingId.value = profile.id
  error.value = ''
  try {
    await $fetch(`/api/cms/users/${profile.id}/role`, {
      method: 'PUT',
      body: { role: newRole },
    })
    await loadUsers()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to update role'
  }
  roleSavingId.value = null
}

function isSelf(profile: any) {
  return profile.auth_user_id === supaUser.value?.id
}
```

Note: `error` is currently only shown inside the edit modal. To surface role errors on the page, also add a page-level banner — see Step 3.

- [ ] **Step 2: Add a Role column header**

In the table `<thead>`, add a header cell before the Actions header (after the Joined `<th>` that ends at line 158):
```vue
<th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
  Role
</th>
```

- [ ] **Step 3: Add the Role cell and a page-level error banner**

In the `<tbody>` row, add a cell before the Actions `<td>` (before line 185):
```vue
<td class="px-6 py-4">
  <span v-if="isSelf(profile)" class="text-sm font-medium text-gray-700 capitalize">
    {{ profile.role }}
  </span>
  <select
    v-else
    :value="profile.role"
    :disabled="roleSavingId === profile.id"
    class="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:opacity-50"
    @change="changeRole(profile, ($event.target as HTMLSelectElement).value)"
  >
    <option value="user">User</option>
    <option value="admin">Admin</option>
  </select>
</td>
```

Add a page-level error banner just inside the root `<div>`, right after the header block (`</div>` that ends at line 72):
```vue
<div v-if="error" class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
  {{ error }}
</div>
```

- [ ] **Step 4: Type-check**

Run: `npx nuxi typecheck`
Expected: no new errors in `app/pages/cms/users.vue`.

- [ ] **Step 5: Manual end-to-end test**

As admin on `/cms/users`:
1. A non-self user row shows a Role dropdown; your own row shows the role as plain text.
2. Change a user's role to Admin → list refreshes, that user now shows Admin.
3. Log in as that newly-promoted user → CMS link appears and `/cms` loads.
4. Attempt to demote yourself via the endpoint directly (devtools): expect the 400 "cannot remove your own admin role" error surfaced in the banner if attempted through any UI path.

- [ ] **Step 6: Commit**

```bash
git add app/pages/cms/users.vue
git commit -m "feat: manage user roles from CMS users page"
```

---

## Task 9: Final verification

- [ ] **Step 1: Full type-check / build**

Run: `npx nuxi typecheck` then `yarn build`
Expected: build succeeds; no new type errors introduced by this work.

- [ ] **Step 2: Security spot-check — non-admin API access blocked**

Logged in as a `user`-role account, in devtools console:
```js
await $fetch('/api/cms/users').catch(e => e.data)
```
Expected: a `403` error (`Admin access required`), not user data.

- [ ] **Step 3: Confirm regular user happy path**

As a `user`-role account: `/` (main page) and `/dashboard` load normally; `/cms` redirects to `/dashboard`; no CMS link in header.

- [ ] **Step 4: Final commit if anything outstanding**

```bash
git status
# commit any remaining changes with an appropriate message
```

---

## Self-Review Notes

- **Spec coverage:** §1 data layer → Task 1; §2 server enforcement → Tasks 2 & 3; §3 client enforcement → Tasks 5, 6, 7; §4 role management → Tasks 4 & 8; §5 testing → distributed test steps + Task 9. All covered.
- **Self-promotion via RLS:** addressed in Task 1 Step 2 (the existing `profiles: own update` policy had no `WITH CHECK`; new policy pins `role` to its current value for self-updates).
- **Type consistency:** role values are exactly `'admin'`/`'user'` everywhere; helper returns `{ user, profile }`; `profile.id` (not auth id) is used for the self-demotion comparison in Task 4 and `auth_user_id` for the self-check in Task 8.
