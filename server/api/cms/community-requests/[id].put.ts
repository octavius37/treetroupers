import { serverSupabaseServiceRole } from '#supabase/server'

// Approves a community request, creating the community with the requester as
// its admin, or declines it.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing request id' }) }

  const { decision } = (await readBody(event)) ?? {}
  if (decision !== 'approved' && decision !== 'declined') {
    throw createError({ statusCode: 400, message: 'decision must be "approved" or "declined"' })
  }

  const client = serverSupabaseServiceRole(event)

  const { data: request } = await client.from('community_requests').select('*').eq('id', id).eq('status', 'pending').maybeSingle()
  if (!request) { throw createError({ statusCode: 409, message: 'This request has already been dealt with' }) }

  let communityId: string | null = null
  if (decision === 'approved') {
    const base = slugify(request.name)
    const { data: taken } = await client.from('communities').select('slug').like('slug', `${base}%`)
    const slugs = new Set((taken ?? []).map(c => c.slug))
    let slug = base
    for (let n = 2; slugs.has(slug); n++) {
      slug = `${base}-${n}`
    }

    const { data: community, error } = await client
      .from('communities')
      .insert({
        name: request.name,
        slug,
        description: request.description ?? (request.area ? `Tree planting in ${request.area}.` : null),
        type: 'custom',
        parent_community_id: request.parent_community_id,
      })
      .select('id')
      .single()
    if (error) { throw createError({ statusCode: 500, message: error.message }) }
    communityId = community.id

    const { error: memberError } = await client
      .from('community_members')
      .upsert({ community_id: community.id, profile_id: request.requested_by, role: 'admin' }, { onConflict: 'profile_id,community_id' })
    if (memberError) { throw createError({ statusCode: 500, message: memberError.message }) }
  }

  const { error } = await client
    .from('community_requests')
    .update({ status: decision, community_id: communityId, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  return { status: decision, communityId }
})
