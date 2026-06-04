import { serverSupabaseServiceRole } from '#supabase/server'

// Public, unauthenticated: returns the published pages that should appear in
// the site nav, flat + ordered. The client builds the parent/child tree.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('pages')
    .select('id, title, slug, parent_id, nav_order')
    .eq('status', 'published')
    .eq('show_in_nav', true)
    .order('nav_order', { ascending: true })
    .order('title', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
