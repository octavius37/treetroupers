import { serverSupabaseServiceRole } from '#supabase/server'

// Deletes an announcement: its author, an admin or moderator of its community,
// or a site admin. Activity posts are removed by deleting the tree, or by a
// site admin from the CMS.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing post id' }) }

  const client = serverSupabaseServiceRole(event)

  const { data: post } = await client.from('feed_posts').select('id, kind, author_id, community_id').eq('id', id).maybeSingle()
  if (!post || post.kind !== 'announcement') { throw createError({ statusCode: 404, message: 'Post not found' }) }

  let allowed = profile.role === 'admin' || post.author_id === profile.id
  if (!allowed && post.community_id) {
    const { data: membership } = await client
      .from('community_members')
      .select('role')
      .eq('profile_id', profile.id)
      .eq('community_id', post.community_id)
      .maybeSingle()
    allowed = !!membership && COMMUNITY_POSTER_ROLES.includes(membership.role)
  }
  if (!allowed) { throw createError({ statusCode: 403, message: 'You can\'t delete this post' }) }

  const { error } = await client.from('feed_posts').delete().eq('id', id)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return { deleted: true }
})
