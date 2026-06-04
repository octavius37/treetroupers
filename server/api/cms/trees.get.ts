import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { filter } = getQuery(event)
  const client = serverSupabaseServiceRole(event)

  let query = client
    .from('trees')
    .select('*, tree_species(common_name), profiles!planted_by(display_name), communities(name)')
    .order('created_at', { ascending: false })

  if (filter && filter !== 'all') query = query.eq('status', filter)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
