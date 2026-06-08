import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'

/**
 * Ensures the request comes from an authenticated admin.
 * Throws 401 if not logged in, 403 if not an admin.
 * Returns the auth user and their profile on success.
 */
export async function requireAdmin(event: H3Event) {
  const user = await serverSupabaseUser(event)
  // The user identifier may surface as `id` or, with the decoded-JWT shape, as
  // `sub`. Guard against an id-less object (e.g. an SSR request that arrived
  // without the auth cookie): never query the uuid column with `undefined`.
  const authUserId = (user as { id?: string, sub?: string } | null)?.id
    ?? (user as { sub?: string } | null)?.sub
  if (!authUserId) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', authUserId)
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
