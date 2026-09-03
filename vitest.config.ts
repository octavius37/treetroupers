import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))
const resolveFromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// The Nuxt environment boots a real Nuxt app, which loads nuxt.config.ts and its
// modules. @nuxtjs/supabase and @sidebase/nuxt-auth read these at config time and
// there is no .env in CI, so give them inert placeholders. Nothing in the suite
// makes a network call — these only need to exist and parse as URLs.
process.env.NUXT_URL ??= 'http://localhost:3000'
process.env.SUPABASE_URL ??= 'http://localhost:54321'
process.env.SUPABASE_KEY ??= 'test-anon-key'
process.env.NUXT_SUPABASE_SECRET_KEY ??= 'test-secret-key'

export default defineConfig(async () => ({
  test: {
    projects: [
      // Server code: plain Node. Nitro's virtual `#supabase/server` alias and its
      // auto-imported h3 helpers don't exist outside a Nitro build, so we supply
      // both — the alias below, the globals in test/setup/server.ts.
      {
        test: {
          name: 'server',
          environment: 'node',
          root,
          include: ['test/server/**/*.test.ts'],
          setupFiles: ['./test/setup/server.ts'],
        },
        resolve: {
          alias: {
            // `~~` must precede `~`, otherwise `~~/server/...` matches `~` first.
            '#supabase/server': resolveFromRoot('./test/mocks/supabase-server.ts'),
            '~~': root,
            '~': resolveFromRoot('./app'),
          },
        },
      },

      // App code: composables, middleware and components need a Nuxt app for
      // auto-imports, `useState` and mounting.
      await defineVitestProject({
        test: {
          name: 'app',
          environment: 'nuxt',
          root,
          include: ['test/app/**/*.test.ts'],
          setupFiles: ['./test/setup/app.ts'],
        },
      }),
    ],
  },
}))
