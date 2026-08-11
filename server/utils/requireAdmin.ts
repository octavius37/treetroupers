import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

/**
 * Ensures the request comes from an authenticated admin.
 * Throws 401 if not logged in, 403 if not an admin.
 * Returns the auth user and their profile on success.
 */
export async function requireAdmin(event: H3Event) {
  const user = await serverSupabaseUser(event)
  // serverSupabaseUser returns the decoded JWT, where the id is `sub` (not `id`).
  // Guard against an id-less object (e.g. an SSR request that arrived without the
  // auth cookie): never query the uuid column with `undefined`.
  const uid = (user as { sub?: string, id?: string } | null)?.sub
    ?? (user as { id?: string } | null)?.id
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', uid)
    .single()

  if (error || !profile) {
    // Distinguish a real lookup failure (logged for ops) from a genuinely
    // missing profile; respond 403 either way so we never leak internals.
    if (error) { console.error('requireAdmin profile lookup failed:', error) }
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  if (profile.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  return { user, profile }
}
