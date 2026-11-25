import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_DISPLAY_NAME = 50
const MAX_BIO = 500

export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const body = (await readBody(event)) ?? {}
  const displayName = optionalText(body.display_name, MAX_DISPLAY_NAME, 'Your name')
  const bio = optionalText(body.bio, MAX_BIO, 'Your bio')

  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('profiles')
    .update({ display_name: displayName, bio })
    .eq('auth_user_id', uid)
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
