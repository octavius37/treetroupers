import { serverSupabaseServiceRole } from '#supabase/server'

// Public, unauthenticated: the communities shown by CommunitiesCarousel.
// Mirrors the query renderCommunitiesCarousel() ran back when the carousel was
// a server-rendered smart block inside CMS page HTML.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('communities')
    .select('name, slug, description')
    .order('name')
    .limit(6)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data ?? []
})
