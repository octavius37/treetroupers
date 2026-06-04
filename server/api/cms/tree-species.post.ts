import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('tree_species')
    .insert({
      common_name: body.common_name,
      scientific_name: body.scientific_name,
      description: body.description || null,
      avg_co2_kg_per_year: body.avg_co2_kg_per_year ?? null,
    })
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
