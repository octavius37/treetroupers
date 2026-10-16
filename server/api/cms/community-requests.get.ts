import { serverSupabaseServiceRole } from '#supabase/server'

// Pending requests for new communities, oldest first.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { data, error } = await serverSupabaseServiceRole(event)
    .from('community_requests')
    .select('*, profiles!requested_by(display_name), parent:communities!parent_community_id(name)')
    .eq('status', 'pending')
    .order('created_at')
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
