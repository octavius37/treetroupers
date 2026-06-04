import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { Pages } from './server/payload/collections/Pages'
import { Users } from './server/payload/collections/Users'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      // Close idle connections well before NAT/PgBouncer forcibly resets them
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      // keepAlive sends TCP probes through PgBouncer which triggers resets; leave off
      keepAlive: false,
      max: 3,
    },
    schemaName: 'payload',
    // Skip auto schema push on every dev boot — the drizzle-kit introspection
    // routine leaks unhandled rejections on transient connection drops, which
    // restarts the Nuxt dev server. Run `payload migrate` manually after
    // changing Payload collections.
    push: false,
  }),
  collections: [Users, Pages],
  // Disable admin panel — Local API only, no Next.js routes
  admin: {
    disable: true,
  },
  telemetry: false,
})
