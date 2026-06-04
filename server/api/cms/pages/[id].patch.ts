import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  // Prevent a page from being its own parent (one-level cycle guard).
  const parentId = body.parent_id === id ? null : (body.parent_id || null)

  const { data, error } = await client
    .from('pages')
    .update({
      title: body.title,
      slug: body.slug,
      content: body.content ?? null,
      status: body.status,
      parent_id: parentId,
      nav_order: body.nav_order ?? 0,
      show_in_nav: body.show_in_nav ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }
  return data
})
