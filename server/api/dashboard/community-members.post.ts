import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', uid)
    .single()

  if (profileError || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  const { error } = await client
    .from('community_members')
    .insert({ community_id: body.community_id, profile_id: profile.id })

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return { success: true }
})
