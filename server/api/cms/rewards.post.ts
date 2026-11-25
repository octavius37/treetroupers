import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  // New rewards from the CMS are badges (the type column's default).
  const achievement = rewardCriteriaFromBody(body)
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('rewards')
    .insert({
      title: body.title,
      description: body.description || null,
      points_required: body.points_required,
      ...achievement,
      active: body.active ?? true,
    })
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
