import { registerEndpoint } from '@nuxt/test-utils/runtime'

// @sidebase/nuxt-auth's plugin fetches this on every app init. It is a leftover
// from the sidebase template and unused by the live Supabase auth flows, but
// without a stub it logs a FetchError into every test run.
registerEndpoint('/api/auth/session', () => ({}))
