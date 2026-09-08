import { serverSupabaseServiceRole } from '#supabase/server'
import { excerptFromHtml } from '../../../../utils/excerptFromHtml'

// Public, unauthenticated: returns the published child pages of a collection
// page (e.g. blog posts filed under the "Tree planting tips" parent) as short
// teaser cards, newest first.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const client = serverSupabaseServiceRole(event)

  const { data: collection, error: collectionError } = await client
    .from('pages')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (collectionError) throw createError({ statusCode: 500, message: collectionError.message })
  if (!collection) throw createError({ statusCode: 404, message: 'Collection not found' })

  const { data, error } = await client
    .from('pages')
    .select('id, title, slug, content, created_at')
    .eq('parent_id', collection.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return (data || []).map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    createdAt: post.created_at,
    excerpt: excerptFromHtml(post.content),
  }))
})
