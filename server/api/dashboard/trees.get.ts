import { serverSupabaseServiceRole } from '#supabase/server'

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 50

// The caller's own most recent tree logs, with their proof photo. Members can't
// read photo_urls over the REST API (only the endpoints apply the photo rules),
// so the dashboard's "Your recent trees" comes from here.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const requested = Number(getQuery(event).limit)
  const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT

  const { data, error } = await serverSupabaseServiceRole(event)
    .from('trees')
    .select('id, source, quantity, status, review_status, planted_at, donation_project, earned_activity, photo_urls, tree_species(common_name)')
    .eq('planted_by', profile.id)
    .order('planted_at', { ascending: false })
    .limit(limit)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  // The planter always sees their own photo.
  return (data ?? []).map(tree => Object.assign(tree, { photoUrl: tree.photo_urls?.[0] ?? null, photo_urls: undefined }))
})
