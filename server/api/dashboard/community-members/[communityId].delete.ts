import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const communityId = getRouterParam(event, 'communityId')
  const client = serverSupabaseServiceRole(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  const { error } = await client
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('profile_id', profile.id)

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return { success: true }
})
