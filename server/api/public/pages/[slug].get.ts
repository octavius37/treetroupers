import { serverSupabaseServiceRole } from '#supabase/server'
import { resolveSmartBlocks } from '../../../utils/resolveSmartBlocks'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('pages')
    .select('id, title, slug, content, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'Page not found' })

  const html = await resolveSmartBlocks(event, data.content || '')

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    html,
  }
})
