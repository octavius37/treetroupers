import { serverSupabaseServiceRole } from '#supabase/server'

const LIMIT = 50

interface Row {
  id: string
  name: string
  avatarUrl: string | null
  points: number
}

function monthStart() {
  const date = new Date()
  date.setUTCDate(1)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

// The leaderboard, all time or this month, for everyone or one community (and
// the communities inside it). The points are summed in SQL (leaderboard_points),
// which returns one json value, so PostgREST's 1000-row limit can't cut the
// board short; only the ranking happens here.
export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const { period, community_id: communityId } = getQuery(event)
  const client = serverSupabaseServiceRole(event)

  const { data: me } = await client.from('profiles').select('id').eq('auth_user_id', uid).single()

  let communityIds: string[] | null = null
  if (typeof communityId === 'string' && communityId) {
    const { data: communities } = await client.from('communities').select('id, parent_community_id')
    communityIds = [communityId, ...communityDescendants(communities ?? [], communityId)]
  }

  const { data, error } = await client.rpc('leaderboard_points', {
    p_since: period === 'month' ? monthStart() : null,
    p_community_ids: communityIds,
  })
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  // Sorted by points, then name, in SQL.
  const rows = ((data ?? []) as Row[]).map(row => Object.assign(row, { points: Number(row.points), isMe: row.id === me?.id }))
  const ranked = rankRows(rows)

  return {
    rows: ranked.slice(0, LIMIT),
    // The viewer's own place, even when it's outside the top rows.
    me: ranked.find(row => row.isMe) ?? null,
  }
})
