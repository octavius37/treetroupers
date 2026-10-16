import { serverSupabaseServiceRole } from '#supabase/server'

// The planter deletes their own log, while it is pending or after it was
// rejected. An approved tree has paid its points and appears in community
// totals, so removing one is an admin's job.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing tree id' }) }

  const client = serverSupabaseServiceRole(event)

  const { data: tree } = await client.from('trees').select('id, planted_by, review_status, photo_urls').eq('id', id).maybeSingle()
  if (!tree || tree.planted_by !== profile.id) { throw createError({ statusCode: 404, message: 'Tree not found' }) }
  if (tree.review_status === 'approved') {
    throw createError({ statusCode: 409, message: 'Approved trees can\'t be deleted. Contact us if this one needs removing.' })
  }

  const { error } = await client.from('trees').delete().eq('id', id).eq('planted_by', profile.id)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  // Best effort: an orphaned file is untidy, not harmful.
  const paths = (tree.photo_urls ?? []).map(treePhotoPath).filter((p: string | null): p is string => !!p)
  if (paths.length) { await client.storage.from(TREE_PHOTOS_BUCKET).remove(paths) }

  return { deleted: true }
})
