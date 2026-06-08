import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('profiles')
    .update({
      display_name: body.display_name,
      bio: body.bio,
    })
    .eq('auth_user_id', uid)
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
