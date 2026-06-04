# Global User Roles (Admin / User) — Design

**Date:** 2026-06-04
**Status:** Approved (pending spec review)

## Goal

Introduce two global user roles, `admin` and `user`:

- **Admins** have full access to the CMS (`/cms/*` routes and `/api/cms/*` endpoints).
- **Users** (the default) can access only their dashboard (`/dashboard/*`) and the public/main pages.

## Context

The live authentication stack is **Supabase** (`useSupabaseUser()` on the client,
`serverSupabaseUser()` / `serverSupabaseServiceRole()` on the server). The
`@sidebase/nuxt-auth` / `next-auth` configuration present in the repo is not used by
the live flows and is out of scope.

Current state:

- `profiles` table has **no global role field**. Only `community_members.role` exists,
  which is a per-community role and unrelated to global admin access.
- CMS protection is **authentication-only**:
  - `app/middleware/cms-auth.ts` checks for a logged-in user but has a TODO for the
    admin check; any authenticated user can currently reach the CMS.
  - Every `/api/cms/*` endpoint checks `serverSupabaseUser()` but **not** admin status.
- No local migrations folder; schema is managed on the remote Supabase project.

## Design

### 1. Data layer — `profiles.role`

A Supabase migration that:

1. Creates a Postgres enum `user_role` with values `'admin'` and `'user'`.
2. Adds column `role user_role NOT NULL DEFAULT 'user'` to `profiles`.
3. Seeds `role = 'admin'` for the bootstrap admin
   `paulbollerman@gmail.com` (the account that actually exists in the DB;
   the originally-specified `p.bollerman@eceoffshore.com` had no profile),
   resolved by joining
   `profiles.auth_user_id` → `auth.users.id` and matching `auth.users.email`.
4. Updates RLS so that the `role` column can be changed **only** by the service role.
   A user must never be able to update their own `role` (no self-promotion). Admin
   role changes flow exclusively through server endpoints using the service role.

After applying the migration, regenerate `app/types/database.types.ts` so `role` is
typed on the `profiles` Row/Insert/Update types.

**First-admin bootstrap:** Because the default role is `user` and the
role-management UI is admin-only, the seed in step 3 resolves the chicken-and-egg
problem — the bootstrap admin can then promote others from the CMS.

### 2. Server enforcement (authoritative security boundary)

Client middleware is bypassable, so the real enforcement is server-side.

- **New helper `server/utils/requireAdmin.ts`**: takes the H3 `event`, resolves the
  Supabase user (`401` if none), looks up that user's profile `role` via the service
  role client, and throws `403` if the role is not `admin`. Returns the user/profile
  for convenience.
- **Update all `/api/cms/*` endpoints** to use `requireAdmin` in place of the bare
  `serverSupabaseUser()` check:
  - `users.get.ts`
  - `communities.get.ts`, `communities.post.ts`
  - `pages.get.ts`, `pages.post.ts`
  - `rewards.get.ts`, `rewards.post.ts`
  - `trees.get.ts`
  - `tree-species.get.ts`, `tree-species.post.ts`
  - `stats.get.ts`
  - the new role endpoint (section 4)
- `users.get.ts` already uses `select('*')`, so `role` is returned automatically once
  the column exists; only the auth check changes.

### 3. Client enforcement (UX layer)

Client checks are for experience, not security (the server handles security). They
keep non-admins from seeing a forbidden CMS and give a clean redirect.

- **New composable `useUserRole()`**: reads the current user's `role` from their
  profile via a single cached `useAsyncData` query; exposes `role` and a derived
  `isAdmin` boolean. Single source of truth on the client.
- **`app/middleware/cms-auth.ts`**: keep the existing `if (!user) → navigateTo('/login')`,
  then add `if (!isAdmin) → navigateTo('/dashboard')`. This replaces the existing TODO
  block.
- **`app/components/AppHeader.vue`**: the `<NuxtLink to="/cms">CMS</NuxtLink>`
  (currently shown to any logged-in user, ~lines 98–100) becomes conditional on
  `isAdmin`. Dashboard, public links, and Logout are unchanged for all users.
- **`app/middleware/auth.ts`** (on `/dashboard/*`) is unchanged — every logged-in user
  keeps dashboard access.

### 4. Role management UI + endpoint

- **New endpoint `server/api/cms/users/[id]/role.put.ts`**: admin-only via
  `requireAdmin`. Accepts `{ role: 'admin' | 'user' }`, validates the value against the
  allowed set, and updates the target profile's `role` via the service role client.
  **Guard:** an admin cannot demote themselves (prevents locking out the last admin) —
  if the target profile is the requesting admin and the new role is `user`, reject with
  a clear error. To step down, promote another admin first.
- **`app/pages/cms/users.vue`**: add a per-row role control (a `<select>` with
  admin/user) wired to the new endpoint, refreshing the list on success. The current
  user's own row renders the role as read-only to reinforce the self-demotion guard.

### 5. Testing & verification

- **Migration:** after apply, the bootstrap profile shows `role='admin'`; a fresh
  signup defaults to `role='user'`.
- **Server gate:** a non-admin session receives `403` from a `/api/cms/*` endpoint; an
  admin receives `200`.
- **Client:** as a non-admin, visiting `/cms` redirects to `/dashboard` and the CMS
  header link is hidden; as an admin, both the link and the routes work.
- **Role management:** an admin promotes a user → that user gains CMS access on next
  load; self-demotion is blocked with a clear error.
- **Build/type-check** passes after `database.types.ts` is regenerated.

## Out of Scope

- Migrating off `@sidebase/nuxt-auth` / `next-auth` (unused by live flows).
- Per-community roles (`community_members.role`) — unrelated to global access.
- Granular CMS permissions beyond the admin/user split.
