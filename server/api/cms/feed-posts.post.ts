import { serverSupabaseServiceRole } from '#supabase/server'

// Publishes an announcement to one community's feed (and the feeds of the
// communities inside it) or, with no community, to everyone's.
export default defineEventHandler(async (event) => {
  const { profile } = await requireAdmin(event)

  const body = (await readBody(event)) ?? {}
  const announcement = parseAnnouncement(body)
  const communityId = typeof body.community_id === 'string' && body.community_id.trim() ? body.community_id.trim() : null

  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('feed_posts')
    .insert({ kind: 'announcement', community_id: communityId, author_id: profile.id, ...announcement })
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
