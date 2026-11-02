import { serverSupabaseServiceRole } from '#supabase/server'

// Claims an unlocked reward. Badges need no claim. Points aren't deducted; a
// site admin fulfils the claim from /cms/rewards and gets in touch.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing reward id' }) }

  const client = serverSupabaseServiceRole(event)

  const [{ data: reward }, { data: me }] = await Promise.all([
    client.from('rewards').select('id, type, points_required, active').eq('id', id).maybeSingle(),
    client.from('profiles').select('total_points').eq('id', profile.id).single(),
  ])
  if (!reward || !reward.active) { throw createError({ statusCode: 404, message: 'Reward not found' }) }
  if (reward.type === 'badge') { throw createError({ statusCode: 400, message: 'Badges unlock by themselves; there\'s nothing to claim' }) }
  if ((me?.total_points ?? 0) < reward.points_required) {
    throw createError({ statusCode: 403, message: `You need ${reward.points_required} points to claim this` })
  }

  const { error } = await client.from('reward_redemptions').insert({ profile_id: profile.id, reward_id: id })
  if (error) {
    // unique_violation: reward_redemptions_one_claim
    if (error.code === '23505') { throw createError({ statusCode: 409, message: 'You\'ve already claimed this reward' }) }
    throw createError({ statusCode: 500, message: error.message })
  }
  return { claimed: true }
})
