# Tree Troupe

A community tree-planting platform: members join local troupes, log the trees
they plant, donate or earn with a photo as proof, and earn points once an admin
approves each log.

Built with Nuxt 4, Tailwind CSS, Supabase (Postgres + PostGIS, Auth, Storage),
Leaflet and GrapesJS (for the CMS page builder). Hosted on Vercel.

## Getting started

```bash
cp .env.local.example .env   # local demo keys, not secrets
yarn install
npm run db:start             # local Supabase in Docker
npm run db:reset             # migrations + seed
npm run dev                  # http://localhost:3000
```

Seeded logins (password `password123`): `admin@example.com` (admin) and
`member@example.com`.

## Checks

```bash
npm run lint
npm test          # unit tests
npm run test:db   # database tests, against the local stack
```

See [AGENTS.md](AGENTS.md) for the architecture, schema, conventions and
deployment notes.
