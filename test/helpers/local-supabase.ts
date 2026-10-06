import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// The local stack's well-known demo keys (printed by `supabase status`). They are
// identical on every machine and in CI, so they are safe to hard-code here.
const LOCAL_URL = 'http://127.0.0.1:54421'
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Deliberately not read from SUPABASE_URL: that variable may point at the hosted
// project in someone's .env, and these tests create and delete rows.
const url = process.env.TEST_SUPABASE_URL ?? LOCAL_URL
const { hostname } = new URL(url)
if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
  throw new Error(`Database tests only run against the local stack, not ${url}`)
}

const options = { auth: { persistSession: false, autoRefreshToken: false } }

const TEST_PASSWORD = 'password123'

/** Bypasses RLS — the same role the server handlers use. */
export const serviceClient: SupabaseClient<Database> = createClient<Database>(url, LOCAL_SERVICE_KEY, options)

/** A fresh anon client; RLS applies. */
export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(url, LOCAL_ANON_KEY, options)
}

/**
 * Creates a throwaway auth user. The `on_auth_user_created` trigger gives it a
 * profile, which is returned alongside so tests can assert on that trigger too.
 */
export async function createTestUser() {
  const { data, error } = await serviceClient.auth.admin.createUser({
    email: `db-test-${randomUUID()}@example.com`,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) { throw error }

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .single()
  if (profileError) { throw profileError }

  return { authUser: data.user, profile }
}

/** A client signed in as a test user, so RLS applies as that user. */
export async function signedInClient(email: string): Promise<SupabaseClient<Database>> {
  const client = anonClient()
  const { error } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD })
  if (error) { throw error }
  return client
}

/**
 * Deletes a test user and their trees. Trees go first: `trees.planted_by` is
 * `on delete set null`, so deleting the user alone would orphan them. Supabase
 * returns failures instead of throwing, so each step is checked, and the user is
 * kept if their trees could not be removed.
 */
export async function deleteTestUser(authUserId: string, profileId: string) {
  const { error: treesError } = await serviceClient.from('trees').delete().eq('planted_by', profileId)
  if (treesError) { throw treesError }

  const { error } = await serviceClient.auth.admin.deleteUser(authUserId)
  if (error) { throw error }
}
