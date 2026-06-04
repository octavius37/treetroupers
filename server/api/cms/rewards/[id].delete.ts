import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const id = getRouterParam(event, 'id')
  const client = serverSupabaseServiceRole(event)

  const { error } = await client.from('rewards').delete().eq('id', id)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  return { success: true }
})
