import { serverSupabaseServiceRole } from '#supabase/server'

// Public, unauthenticated: live totals for the StatsCounter component.
// Mirrors the queries renderStatsCounter() ran back when the counter was a
// server-rendered smart block inside CMS page HTML.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const [trees, communities, members] = await Promise.all([
    // Approved trees, counted by quantity (a log of 50 donated trees is 50),
    // the same way as the map and dashboards.
    client.rpc('tree_stats', { p_top: 0 }),
    client.from('communities').select('id', { count: 'exact', head: true }),
    client.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  return {
    trees: Number((trees.data as { trees?: number } | null)?.trees ?? 0),
    communities: communities.count ?? 0,
    members: members.count ?? 0,
  }
})
