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
  if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', user.id)
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
