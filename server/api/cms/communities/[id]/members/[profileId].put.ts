import { serverSupabaseServiceRole } from '#supabase/server'

const ROLES = ['member', 'moderator', 'admin']

// Sets a member's role in a community. Admins and moderators can post
// announcements to that community's feed.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const communityId = getRouterParam(event, 'id')
  const profileId = getRouterParam(event, 'profileId')
  if (!communityId || !profileId) { throw createError({ statusCode: 400, message: 'Missing community or member' }) }

  const { role } = (await readBody(event)) ?? {}
  if (!ROLES.includes(role)) { throw createError({ statusCode: 400, message: `role must be one of: ${ROLES.join(', ')}` }) }

  const { data, error } = await serverSupabaseServiceRole(event)
    .from('community_members')
    .update({ role })
    .eq('community_id', communityId)
    .eq('profile_id', profileId)
    .select('profile_id, role')
    .maybeSingle()
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  if (!data) { throw createError({ statusCode: 404, message: 'Not a member of this community' }) }
  return data
})
