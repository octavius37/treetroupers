import { serverSupabaseServiceRole } from '#supabase/server'

// Public: approved planted trees for the visitor map, located to about 100 m
// with no planter, photo or notes, plus totals. Exact locations are only
// readable by signed-in members ("trees: members read"), so visitors get no
// more than this. Both come from SQL functions that return a single value, so
// PostgREST's 1000-row limit can't truncate them.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const [statsRes, mapRes, communitiesRes] = await Promise.all([
    client.rpc('tree_stats', { p_top: 0 }),
    client.rpc('public_tree_map'),
    client.from('communities').select('id', { count: 'exact', head: true }),
  ])
  if (statsRes.error) { throw createError({ statusCode: 500, message: statsRes.error.message }) }
  if (mapRes.error) { throw createError({ statusCode: 500, message: mapRes.error.message }) }

  const stats = statsRes.data as { trees: number, co2KgPerYear: number }
  return {
    totals: {
      trees: Number(stats.trees),
      communities: communitiesRes.count ?? 0,
      co2KgPerYear: Number(stats.co2KgPerYear),
    },
    trees: mapRes.data as { id: string, species: string, status: string, plantedAt: string, lat: number, lng: number }[],
  }
})
