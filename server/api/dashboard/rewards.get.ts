import { serverSupabaseServiceRole } from '#supabase/server'

// The active rewards, and where the caller stands on each: unlocked once their
// points reach it (points are never spent), and for claimable rewards, whether
// they've claimed it and whether it has been sent.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)
  const client = serverSupabaseServiceRole(event)

  const [meRes, rewardsRes, claimsRes] = await Promise.all([
    client.from('profiles').select('total_points').eq('id', profile.id).single(),
    client.from('rewards').select('id, title, description, points_required, type').eq('active', true).order('points_required'),
    client.from('reward_redemptions').select('reward_id, status').eq('profile_id', profile.id).neq('status', 'cancelled'),
  ])
  if (rewardsRes.error) { throw createError({ statusCode: 500, message: rewardsRes.error.message }) }

  const points = meRes.data?.total_points ?? 0
  const claims = new Map((claimsRes.data ?? []).map(c => [c.reward_id, c.status]))

  return {
    points,
    rewards: (rewardsRes.data ?? []).map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      pointsRequired: r.points_required,
      type: r.type,
      unlocked: points >= r.points_required,
      claimable: r.type !== 'badge',
      // 'pending' (claimed, waiting for an admin), 'fulfilled' (sent) or null.
      claim: claims.get(r.id) ?? null,
    })),
  }
})
