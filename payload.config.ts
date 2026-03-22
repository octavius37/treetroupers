import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { Pages } from './server/payload/collections/Pages'
import { Users } from './server/payload/collections/Users'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
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
