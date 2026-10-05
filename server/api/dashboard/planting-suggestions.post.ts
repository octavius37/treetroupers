import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const body = await readBody(event)
  const lat = Number(body?.lat)
  const lng = Number(body?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw createError({ statusCode: 400, message: 'A valid location is required' })
  }

  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : ''

  const client = serverSupabaseServiceRole(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', uid)
    .single()

  if (profileError || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  const { data, error } = await client
    .from('planting_suggestions')
    .insert({
      suggested_by: profile.id,
      location: `SRID=4326;POINT(${lng} ${lat})`,
      notes: notes || null,
    })
    .select('*, profiles!suggested_by(display_name)')
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
