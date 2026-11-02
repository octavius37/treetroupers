import { serverSupabaseServiceRole } from '#supabase/server'

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

// A member asks for a community that doesn't exist yet. A site admin reviews
// it at /cms/communities; if approved, the requester becomes its admin.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const body = (await readBody(event)) ?? {}
  const name = text(body.name, 80)
  if (!name || name.length < 2) { throw createError({ statusCode: 400, message: 'Give the community a name' }) }

  const client = serverSupabaseServiceRole(event)

  const { count } = await client
    .from('community_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requested_by', profile.id)
    .eq('status', 'pending')
  if ((count ?? 0) >= 3) {
    throw createError({ statusCode: 429, message: 'You already have 3 requests waiting. We\'ll get to them soon!' })
  }

  const { data, error } = await client
    .from('community_requests')
    .insert({
      requested_by: profile.id,
      name,
      area: text(body.area, 120),
      description: text(body.description, 500),
      parent_community_id: text(body.parent_community_id, 64),
    })
    .select('id')
    .single()
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
