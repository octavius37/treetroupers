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

  if (decision === 'approved') {
    const { data: request } = await client.from('community_requests').select('name').eq('id', id).eq('status', 'pending').maybeSingle()
    if (!request) { throw createError({ statusCode: 409, message: 'This request has already been dealt with' }) }

    const base = slugify(request.name)
    const { data: taken } = await client.from('communities').select('slug').like('slug', `${base}%`)
    const slugs = new Set((taken ?? []).map(c => c.slug))
    let slug = base
    for (let n = 2; slugs.has(slug); n++) {
      slug = `${base}-${n}`
    }

    // Creating the community, making the requester its admin and marking the
    // request approved happen in one transaction (approve_community_request),
    // so a failure part-way can't leave a community behind a pending request.
    const { data: communityId, error } = await client.rpc('approve_community_request', { p_request_id: id, p_slug: slug })
    if (error) {
      // P0002: no longer pending (another admin got there first).
      // 23505: the slug was taken in the meantime.
      if (error.code === 'P0002') { throw createError({ statusCode: 409, message: 'This request has already been dealt with' }) }
      if (error.code === '23505') { throw createError({ statusCode: 409, message: 'A community with that name was just created; try again' }) }
      throw createError({ statusCode: 500, message: error.message })
    }
    return { status: decision, communityId: communityId as string }
  }

  const { data: declined, error } = await client
    .from('community_requests')
    .update({ status: 'declined', reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  if (!declined) { throw createError({ statusCode: 409, message: 'This request has already been dealt with' }) }

  return { status: decision, communityId: null }
})
