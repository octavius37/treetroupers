import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

/**
 * The current request's auth user id (auth.users.id / profiles.auth_user_id).
 *
 * serverSupabaseUser returns the decoded JWT payload (JwtPayload), where the
 * user id is the `sub` claim — there is no `.id` field. Use this instead of
 * reading `user.id`. Returns null when there is no authenticated user.
 */
export async function authUserId(event: H3Event): Promise<string | null> {
  const user = await serverSupabaseUser(event)
  return (user as { sub?: string, id?: string } | null)?.sub
    ?? (user as { id?: string } | null)?.id
    ?? null
}
