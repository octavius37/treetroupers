import { serverSupabaseServiceRole } from '#supabase/server'

// Removes the caller's own like from a feed post.
export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const postId = getRouterParam(event, 'id')
  if (!postId) { throw createError({ statusCode: 400, message: 'Missing post id' }) }

  const client = serverSupabaseServiceRole(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', uid)
    .single()
  if (profileError || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  const { error } = await client
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('profile_id', profile.id)

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return { liked: false }
})
