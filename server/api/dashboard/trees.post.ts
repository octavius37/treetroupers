import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || !profile) throw createError({ statusCode: 404, message: 'Profile not found' })

  const { data, error } = await client
    .from('trees')
    .insert({
      planted_by: profile.id,
      species_id: body.species_id || null,
      community_id: body.community_id || null,
      location: `SRID=4326;POINT(${body.lng} ${body.lat})`,
      notes: body.notes,
      planted_at: body.planted_at,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
