import { serverSupabaseServiceRole } from '#supabase/server'

// A member's public profile: what the privacy policy says other members can
// see. No email address.
export default defineEventHandler(async (event) => {
  const { profile: viewer } = await requireViewer(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing member id' }) }

  const client = serverSupabaseServiceRole(event)

  const { data: member } = await client
    .from('profiles')
    .select('id, display_name, avatar_url, bio, total_points, created_at')
    .eq('id', id)
    .maybeSingle()
  if (!member) { throw createError({ statusCode: 404, message: 'Member not found' }) }

  const [treesRes, communitiesRes, rankRes] = await Promise.all([
    client
      .from('trees')
      .select('id, source, quantity, status, planted_at, tree_species(common_name, avg_co2_kg_per_year)')
      .eq('planted_by', id)
      .eq('review_status', 'approved')
      .order('planted_at', { ascending: false }),
    client.from('community_members').select('role, communities(id, name)').eq('profile_id', id),
    client.from('profiles').select('id', { count: 'exact', head: true }).gt('total_points', member.total_points ?? 0),
  ])
  if (treesRes.error) { throw createError({ statusCode: 500, message: treesRes.error.message }) }

  const trees = (treesRes.data ?? []) as unknown as {
    id: string
    source: string
    quantity: number
    status: string
    planted_at: string
    tree_species: { common_name: string, avg_co2_kg_per_year: number | null } | null
  }[]

  return {
    id: member.id,
    name: member.display_name || 'A Tree Trouper',
    avatarUrl: member.avatar_url,
    bio: member.bio,
    points: member.total_points ?? 0,
    // Everyone with more points, plus one: ties share a rank, as on the leaderboard.
    rank: (rankRes.count ?? 0) + 1,
    memberSince: member.created_at,
    isMe: member.id === viewer.id,
    stats: {
      trees: trees.reduce((sum, t) => sum + t.quantity, 0),
      co2KgPerYear: co2KgPerYear(trees),
    },
    communities: (communitiesRes.data ?? [])
      .map((m: any) => m.communities ? { id: m.communities.id, name: m.communities.name, role: m.role } : null)
      .filter(Boolean),
    trees: trees.slice(0, 20).map(t => ({
      id: t.id,
      source: t.source,
      quantity: t.quantity,
      status: t.status,
      plantedAt: t.planted_at,
      species: t.tree_species?.common_name ?? null,
    })),
  }
})
