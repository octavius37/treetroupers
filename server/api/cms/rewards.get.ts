import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client.from('rewards').select('*').order('points_required')
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  return data
})
