import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('pages')
    .insert({
      title: body.title,
      slug: body.slug,
      content: body.content || null,
      status: body.status || 'draft',
      parent_id: body.parent_id || null,
      nav_order: body.nav_order ?? 0,
      show_in_nav: body.show_in_nav ?? true,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }
  return data
})
