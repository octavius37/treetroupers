import { serverSupabaseServiceRole } from '#supabase/server'
import { DEFAULT_PAGES } from '../../utils/defaultPages'

// One-time (safe to re-run) helper: creates the CMS `pages` rows for the
// homepage and marketing pages that used to be hardcoded Vue files. Skips
// any slug that already has a row, so it never overwrites edits made
// afterwards through the CMS.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)
  const { data: existing, error: fetchError } = await client
    .from('pages')
    .select('slug')
    .in('slug', DEFAULT_PAGES.map(p => p.slug))

  if (fetchError) {
    throw createError({ statusCode: 500, message: fetchError.message })
  }

  const existingSlugs = new Set((existing ?? []).map(p => p.slug))
  const toCreate = DEFAULT_PAGES.filter(p => !existingSlugs.has(p.slug))

  if (toCreate.length === 0) {
    return { created: [], skipped: DEFAULT_PAGES.map(p => p.slug) }
  }

  const { error: insertError } = await client
    .from('pages')
    .insert(toCreate.map(p => ({
      title: p.title,
      slug: p.slug,
      content: p.content,
      status: 'published',
      // These pages already have permanent links in AppHeader/AppFooter, so
      // they're excluded from the CMS-driven nav to avoid duplicate entries.
      show_in_nav: false,
      nav_order: 0,
    })))

  if (insertError) {
    throw createError({ statusCode: 500, message: insertError.message })
  }

  return {
    created: toCreate.map(p => p.slug),
    skipped: DEFAULT_PAGES.filter(p => existingSlugs.has(p.slug)).map(p => p.slug),
  }
})
