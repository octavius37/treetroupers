import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Rejects a parent that would make `id` its own ancestor.
 *
 * Guarding only `parent_id === id` catches the one-level case and misses every
 * longer loop: setting B's parent to A and then A's parent to B is accepted, and
 * from that point both pages are nested inside each other's subtree, so neither
 * appears in the site nav at all — silently, with no error.
 */
async function assertParentIsNotADescendant(
  client: SupabaseClient,
  id: string,
  parentId: string,
) {
  const { data, error } = await client.from('pages').select('id, parent_id')
  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  const parentOf = new Map<string, string | null>(
    (data ?? []).map(page => [page.id as string, page.parent_id as string | null]),
  )

  // Seeding `seen` with `id` makes reaching it a cycle; it also terminates the
  // walk if the stored data already contains an unrelated loop.
  const seen = new Set<string>([id])
  let cursor: string | null | undefined = parentId
  while (cursor) {
    if (seen.has(cursor)) {
      throw createError({
        statusCode: 400,
        message: 'That parent would create a loop in the page hierarchy.',
      })
    }
    seen.add(cursor)
    cursor = parentOf.get(cursor)
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing page id' })
  }
  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  const parentId: string | null = body.parent_id || null
  if (parentId) {
    await assertParentIsNotADescendant(client, id, parentId)
  }

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
