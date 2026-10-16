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
// the communities inside it). Reads every profile in scope, which is fine at
// this size; move the ranking into SQL when there are thousands of members.
export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const { period, community_id: communityId } = getQuery(event)
  const client = serverSupabaseServiceRole(event)

  const { data: me } = await client.from('profiles').select('id').eq('auth_user_id', uid).single()

  let memberIds: string[] | null = null
  if (typeof communityId === 'string' && communityId) {
    const { data: communities } = await client.from('communities').select('id, parent_community_id')
    const inside = [communityId, ...communityDescendants(communities ?? [], communityId)]
    const { data: members, error } = await client.from('community_members').select('profile_id').in('community_id', inside)
    if (error) { throw createError({ statusCode: 500, message: error.message }) }
    memberIds = [...new Set((members ?? []).map(m => m.profile_id))]
    if (!memberIds.length) { return { rows: [], me: null } }
  }

  let profilesQuery = client.from('profiles').select('id, display_name, avatar_url, total_points')
  if (memberIds) { profilesQuery = profilesQuery.in('id', memberIds) }
  const { data: profiles, error: profilesError } = await profilesQuery
  if (profilesError) { throw createError({ statusCode: 500, message: profilesError.message }) }

  let pointsById = new Map((profiles ?? []).map(p => [p.id, p.total_points ?? 0]))

  if (period === 'month') {
    let eventsQuery = client.from('point_events').select('profile_id, points').gte('created_at', monthStart())
    if (memberIds) { eventsQuery = eventsQuery.in('profile_id', memberIds) }
    const { data: events, error } = await eventsQuery
    if (error) { throw createError({ statusCode: 500, message: error.message }) }
    pointsById = new Map()
    for (const e of events ?? []) {
      pointsById.set(e.profile_id, (pointsById.get(e.profile_id) ?? 0) + e.points)
    }
  }

  const rows: Row[] = (profiles ?? [])
    .map(p => ({
      id: p.id,
      name: p.display_name || 'A Tree Trouper',
      avatarUrl: p.avatar_url,
      points: pointsById.get(p.id) ?? 0,
    }))
    // This month, only people who scored; all time, everyone in scope.
    .filter(row => period !== 'month' || row.points > 0)
    .toSorted((a, b) => b.points - a.points || a.name.localeCompare(b.name))

  const ranked = rankRows(rows.map(row => Object.assign(row, { isMe: row.id === me?.id })))

  return {
    rows: ranked.slice(0, LIMIT),
    // The viewer's own place, even when it's outside the top rows.
    me: ranked.find(row => row.isMe) ?? null,
  }
})
