import { serverSupabaseServiceRole } from '#supabase/server'

const STATUSES = ['planted', 'growing', 'mature', 'removed']

// The planter edits their own tree: notes, how it's doing (status) and, for a
// planted tree, its species. Proof, quantity and location are what the review
// checked, so they stay as logged.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing tree id' }) }

  const body = (await readBody(event)) ?? {}
  const changes: Record<string, unknown> = {}

  if ('notes' in body) {
    if (body.notes !== null && typeof body.notes !== 'string') { throw createError({ statusCode: 400, message: 'notes must be text' }) }
    changes.notes = body.notes?.trim() || null
  }
  if ('status' in body) {
    if (!STATUSES.includes(body.status)) { throw createError({ statusCode: 400, message: `status must be one of: ${STATUSES.join(', ')}` }) }
    changes.status = body.status
  }
  if ('species_id' in body) {
    if (body.species_id !== null && typeof body.species_id !== 'string') { throw createError({ statusCode: 400, message: 'species_id must be an id' }) }
    changes.species_id = body.species_id || null
  }
  if (!Object.keys(changes).length) { throw createError({ statusCode: 400, message: 'Nothing to change' }) }

  const client = serverSupabaseServiceRole(event)

  const { data: tree } = await client.from('trees').select('id, planted_by, source').eq('id', id).maybeSingle()
  if (!tree || tree.planted_by !== profile.id) { throw createError({ statusCode: 404, message: 'Tree not found' }) }
  if ('species_id' in changes && tree.source !== 'planted') {
    throw createError({ statusCode: 400, message: 'Only planted trees have a species' })
  }

  const { data, error } = await client
    .from('trees')
    .update(changes)
    .eq('id', id)
    .eq('planted_by', profile.id)
    .select('id')
    .single()
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
