import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const id = getRouterParam(event, 'id')
  const client = serverSupabaseServiceRole(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', uid)
    .single()

  if (profileError || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  // Scoped to the caller's profile: members can only remove their own spots.
  const { error } = await client
    .from('planting_suggestions')
    .delete()
    .eq('id', id)
    .eq('suggested_by', profile.id)

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return { success: true }
})
