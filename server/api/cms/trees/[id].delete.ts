import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const client = serverSupabaseServiceRole(event)

  const { error } = await client.from('trees').delete().eq('id', id)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  return { success: true }
})
