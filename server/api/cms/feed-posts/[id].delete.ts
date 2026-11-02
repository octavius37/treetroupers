import { serverSupabaseServiceRole } from '#supabase/server'

// Deletes any feed post, its likes going with it. Works for activity posts too,
// so an admin can take one down without deleting the tree behind it.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing post id' }) }

  const client = serverSupabaseServiceRole(event)

  const { error } = await client.from('feed_posts').delete().eq('id', id)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  return { success: true }
})
