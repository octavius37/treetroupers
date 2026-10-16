import { serverSupabaseServiceRole } from '#supabase/server'

// Public, unauthenticated: live totals for the StatsCounter component.
// Mirrors the queries renderStatsCounter() ran back when the counter was a
// server-rendered smart block inside CMS page HTML.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const [trees, communities, members] = await Promise.all([
    // Only trees an admin has approved count towards the public total.
    client.from('trees').select('id', { count: 'exact', head: true }).eq('review_status', 'approved'),
    client.from('communities').select('id', { count: 'exact', head: true }),
    client.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  return {
    trees: trees.count ?? 0,
    communities: communities.count ?? 0,
    members: members.count ?? 0,
  }
})
