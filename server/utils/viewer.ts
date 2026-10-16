import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * The signed-in caller's profile, for dashboard endpoints: 401 without a user,
 * 404 without a profile.
 */
export async function requireViewer(event: H3Event): Promise<{ uid: string, profile: { id: string, role: string | null } }> {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const { data: profile, error } = await serverSupabaseServiceRole(event)
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', uid)
    .single()
  if (error || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  return { uid, profile }
}
