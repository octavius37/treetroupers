import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)

  const [profiles, communities, trees, species, rewards] = await Promise.all([
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('communities').select('id', { count: 'exact', head: true }),
    client.from('trees').select('id', { count: 'exact', head: true }),
    client.from('tree_species').select('id', { count: 'exact', head: true }),
    client.from('rewards').select('id', { count: 'exact', head: true }),
  ])

  const { data: recentTrees } = await client
    .from('trees')
    .select('*, tree_species(common_name), profiles!planted_by(display_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentUsers } = await client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    counts: {
      profiles: profiles.count || 0,
      communities: communities.count || 0,
      trees: trees.count || 0,
      species: species.count || 0,
      rewards: rewards.count || 0,
    },
    recentTrees: recentTrees || [],
    recentUsers: recentUsers || [],
  }
})
