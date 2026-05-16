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

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Run production server
npm run typecheck  # TypeScript check (vue-tsc via nuxi)
npm run lint       # oxlint + eslint
npm run lint:fix   # Auto-fix lint issues
```

## What's Not Done Yet

- Mapbox integration for the tree map page (currently a placeholder)
- Photo upload (Supabase Storage) — upload UI exists as placeholder
- Capacitor mobile wrapping
- AR tree overlay
- Directus or Payload CMS content fully wired to public info pages
- Contact form email backend
- Test suite (CI placeholder exists but no tests)
- Tree species database seeding
