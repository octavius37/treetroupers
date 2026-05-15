import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { Pages } from './server/payload/collections/Pages'
import { Users } from './server/payload/collections/Users'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      // Close idle connections before Supabase PgBouncer forcibly resets them
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
    },
    schemaName: 'payload',
  }),
  collections: [Users, Pages],
  // Disable admin panel — Local API only, no Next.js routes
  admin: {
    disable: true,
  },
  telemetry: false,
})
