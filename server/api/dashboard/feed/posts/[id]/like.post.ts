import { serverSupabaseServiceRole } from '#supabase/server'

// Likes a feed post as the caller, to congratulate them on a tree or cheer an
// announcement. Liking twice is harmless. Earns no points.
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
    .upsert({ post_id: postId, profile_id: profile.id }, { onConflict: 'post_id,profile_id', ignoreDuplicates: true })

  if (error) {
    // foreign_key_violation: the post doesn't exist (or was just deleted).
    if (error.code === '23503') { throw createError({ statusCode: 404, message: 'Post not found' }) }
    throw createError({ statusCode: 500, message: error.message })
  }
  return { liked: true }
})
