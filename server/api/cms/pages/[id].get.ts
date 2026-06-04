import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client.from('pages').select('*').eq('id', id).single()
  if (error) {
    throw createError({ statusCode: error.code === 'PGRST116' ? 404 : 500, message: error.message })
  }

  return data
})
