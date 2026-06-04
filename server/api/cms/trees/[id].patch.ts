import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('trees')
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
