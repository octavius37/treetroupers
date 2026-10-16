import { serverSupabaseServiceRole } from '#supabase/server'

// Rounds to 3 decimal places, about 100 m. Visitors who aren't signed in see
// roughly where a tree is, not exactly, since a tree in someone's garden would
// otherwise give away their home. Members see exact locations on /dashboard/map.
function approximate(value: number) {
  return Math.round(value * 1000) / 1000
}

// Public: approved planted trees for the visitor map, with totals. No names,
// photos or notes.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const [treesRes, communitiesRes] = await Promise.all([
    client
      .from('trees')
      .select('id, source, quantity, status, planted_at, lat, lng, tree_species(common_name, avg_co2_kg_per_year)')
      .eq('review_status', 'approved'),
    client.from('communities').select('id', { count: 'exact', head: true }),
  ])
  if (treesRes.error) { throw createError({ statusCode: 500, message: treesRes.error.message }) }

  const trees = (treesRes.data ?? []) as unknown as {
    id: string
    source: string
    quantity: number
    status: string
    planted_at: string
    lat: number | null
    lng: number | null
    tree_species: { common_name: string, avg_co2_kg_per_year: number | null } | null
  }[]

  return {
    totals: {
      trees: trees.reduce((sum, t) => sum + t.quantity, 0),
      communities: communitiesRes.count ?? 0,
      co2KgPerYear: co2KgPerYear(trees),
    },
    trees: trees
      .filter(t => t.source === 'planted' && t.lat != null && t.lng != null)
      .map(t => ({
        id: t.id,
        species: t.tree_species?.common_name ?? 'Tree',
        status: t.status,
        plantedAt: t.planted_at,
        lat: approximate(Number(t.lat)),
        lng: approximate(Number(t.lng)),
      })),
  }
})
