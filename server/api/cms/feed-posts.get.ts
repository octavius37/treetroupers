import { serverSupabaseServiceRole } from '#supabase/server'

// Admin-written feed posts, newest first. Activity posts are written by the
// database when a tree log is approved, so they aren't managed here.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('feed_posts')
    .select('*, communities(name), post_likes(count)')
    .eq('kind', 'announcement')
    .order('created_at', { ascending: false })

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
