import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client.from('rewards').select('*').order('points_required')
  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
