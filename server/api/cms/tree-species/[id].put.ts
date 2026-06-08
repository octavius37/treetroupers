import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('tree_species')
    .update({
      common_name: body.common_name,
      scientific_name: body.scientific_name,
      description: body.description || null,
      avg_co2_kg_per_year: body.avg_co2_kg_per_year ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
