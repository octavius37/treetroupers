import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  // Only badges can need an achievement, so look up what this reward is.
  const { data: existing } = await client.from('rewards').select('type').eq('id', id).maybeSingle()
  if (!existing) { throw createError({ statusCode: 404, message: 'Reward not found' }) }
  const achievement = rewardCriteriaFromBody(body, existing.type)

  const { data, error } = await client
    .from('rewards')
    .update({
      title: body.title,
      description: body.description || null,
      points_required: body.points_required,
      ...achievement,
      active: body.active,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
