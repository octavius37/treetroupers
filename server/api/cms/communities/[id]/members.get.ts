import { serverSupabaseServiceRole } from '#supabase/server'

// A community's members and their roles, for making someone a community admin.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing community id' }) }

  const { data, error } = await serverSupabaseServiceRole(event)
    .from('community_members')
    .select('profile_id, role, joined_at, profiles(display_name, avatar_url)')
    .eq('community_id', id)
    .order('joined_at')
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
