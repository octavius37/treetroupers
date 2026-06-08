import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client.from('tree_species').select('*').order('common_name')
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  return data
})
