import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

const VALID_ROLES = ['admin', 'user'] as const
type Role = (typeof VALID_ROLES)[number]

export default defineEventHandler(async (event) => {
  const { profile: actingProfile } = await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing user id' }) }

  const body = await readBody<{ role?: string }>(event)
  if (!body?.role || !VALID_ROLES.includes(body.role as Role)) {
    throw createError({ statusCode: 400, message: 'role must be "admin" or "user"' })
  }
  const role = body.role as Role

  // Prevent an admin from demoting themselves (avoids locking out the last admin).
  if (id === actingProfile.id && role === 'user') {
    throw createError({
      statusCode: 400,
      message: 'You cannot remove your own admin role. Promote another admin first.',
    })
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await client
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
