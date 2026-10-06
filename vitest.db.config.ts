import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))
const resolveFromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// Database integration tests. Kept out of vitest.config.ts so `npm test` stays
// free of Docker; run with `npm run test:db` against the local Supabase stack.
//
// Handlers still get `serverSupabaseServiceRole` from the `#supabase/server`
// mock, but each test points it at a real client, so every query reaches
// Postgres — triggers, constraints, generated columns and all.
export default defineConfig({
  test: {
    name: 'db',
    environment: 'node',
    root,
    include: ['test/db/**/*.test.ts'],
    setupFiles: ['./test/setup/server.ts'],
    // Tests share one database, so run files one at a time.
    fileParallelism: false,
    testTimeout: 15_000,
  },
  resolve: {
    alias: {
      '#supabase/server': resolveFromRoot('./test/mocks/supabase-server.ts'),
      '~~': root,
      '~': resolveFromRoot('./app'),
    },
  },
})
