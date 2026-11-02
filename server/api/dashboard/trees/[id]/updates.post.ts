import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_LENGTH = 2000

// The planter posts an update on their own tree ("first leaves are out"), with
// an optional photo. Earns no points.
export default defineEventHandler(async (event) => {
  const { uid, profile } = await requireViewer(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing tree id' }) }

  const body = (await readBody(event)) ?? {}
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) { throw createError({ statusCode: 400, message: 'Write something about your tree' }) }
  if (content.length > MAX_LENGTH) { throw createError({ statusCode: 400, message: `Updates can be up to ${MAX_LENGTH} characters` }) }

  const client = serverSupabaseServiceRole(event)

  if (body.photo_url && !isOwnPhotoUrl(client, uid, body.photo_url)) {
    throw createError({ statusCode: 400, message: 'The photo must be uploaded through Tree Troupe' })
  }

  const { data: tree } = await client.from('trees').select('id, planted_by').eq('id', id).maybeSingle()
  if (!tree || tree.planted_by !== profile.id) { throw createError({ statusCode: 404, message: 'Tree not found' }) }

  const { data, error } = await client
    .from('tree_updates')
    .insert({ tree_id: id, author_id: profile.id, content, photo_urls: body.photo_url ? [body.photo_url] : [] })
    .select('id')
    .single()
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
