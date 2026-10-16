import { serverSupabaseServiceRole } from '#supabase/server'

// A community admin or moderator posts an announcement to their community's
// feed (it also shows in the communities inside it). Site admins can post to
// any community, here or from /cms/feed.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const body = (await readBody(event)) ?? {}
  const communityId = typeof body.community_id === 'string' ? body.community_id : ''
  if (!communityId) { throw createError({ statusCode: 400, message: 'Choose a community to post to' }) }
  const announcement = parseAnnouncement(body)

  const client = serverSupabaseServiceRole(event)

  if (profile.role !== 'admin') {
    const { data: membership } = await client
      .from('community_members')
      .select('role')
      .eq('profile_id', profile.id)
      .eq('community_id', communityId)
      .maybeSingle()
    if (!membership || !COMMUNITY_POSTER_ROLES.includes(membership.role)) {
      throw createError({ statusCode: 403, message: 'Only this community\'s admins can post here' })
    }
  }

  const { data, error } = await client
    .from('feed_posts')
    .insert({ kind: 'announcement', community_id: communityId, author_id: profile.id, ...announcement })
    .select('id')
    .single()
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
