import { serverSupabaseServiceRole } from '#supabase/server'

// Reward claims, open ones first, with the member's email so an admin can get
// in touch to send the reward.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('reward_redemptions')
    .select('id, status, redeemed_at, fulfilled_at, rewards(title, type), profiles(id, display_name, auth_user_id)')
    .neq('status', 'cancelled')
    .order('redeemed_at', { ascending: false })
    .limit(100)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  const rows = (data ?? []) as unknown as {
    id: string
    status: string
    redeemed_at: string
    fulfilled_at: string | null
    rewards: { title: string, type: string } | null
    profiles: { id: string, display_name: string | null, auth_user_id: string | null } | null
  }[]

  const emails = new Map<string, string | null>()
  await Promise.all(rows
    .filter(r => r.status === 'pending' && r.profiles?.auth_user_id)
    .map(async (r) => {
      const { data: auth } = await client.auth.admin.getUserById(r.profiles!.auth_user_id!)
      emails.set(r.id, auth?.user?.email ?? null)
    }))

  return rows
    .map(r => ({
      id: r.id,
      status: r.status,
      claimedAt: r.redeemed_at,
      fulfilledAt: r.fulfilled_at,
      reward: r.rewards?.title ?? 'Deleted reward',
      member: { id: r.profiles?.id ?? null, name: r.profiles?.display_name || 'A member', email: emails.get(r.id) ?? null },
    }))
    .toSorted((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'))
})
