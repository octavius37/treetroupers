import { serverSupabaseServiceRole } from '#supabase/server'

const BATCH = 1000
// One run deletes at most this many batches; anything left goes next day.
const MAX_BATCHES = 10

// Daily housekeeping, run by Vercel Cron (vercel.json):
// - deletes tree-photos uploads older than a day that nothing references
//   (a photo removed from a form, an abandoned log, a deleted tree), so
//   repeated uploads can't fill the bucket;
// - prunes rate-limit hits older than the longest window.
//
// Vercel sends `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET set
// the job refuses to run, so it is never an open delete endpoint.
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (!secret) { throw createError({ statusCode: 503, message: 'CRON_SECRET is not set' }) }
  if (getHeader(event, 'authorization') !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const client = serverSupabaseServiceRole(event)

  let photosDeleted = 0
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    // oxlint-disable-next-line no-await-in-loop -- each batch depends on the last being gone
    const { data: names, error } = await client.rpc('orphaned_tree_photos', { p_older_than_hours: 24, p_limit: BATCH })
    if (error) { throw createError({ statusCode: 500, message: error.message }) }
    const paths = (names ?? []) as string[]
    if (!paths.length) { break }

    // oxlint-disable-next-line no-await-in-loop
    const { error: removeError } = await client.storage.from('tree-photos').remove(paths)
    if (removeError) { throw createError({ statusCode: 500, message: removeError.message }) }
    photosDeleted += paths.length
    if (paths.length < BATCH) { break }
  }

  const { error: pruneError } = await client
    .from('rate_limit_hits')
    .delete()
    .lt('hit_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  if (pruneError) { throw createError({ statusCode: 500, message: pruneError.message }) }

  return { photosDeleted }
})
