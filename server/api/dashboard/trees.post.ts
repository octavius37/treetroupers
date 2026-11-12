import { serverSupabaseServiceRole } from '#supabase/server'

// No cap on what a log may claim (the reviewer checks it against the photo),
// only a sanity limit so a typo or a prank can't overflow the points sum.
const MAX_QUANTITY = 10_000
const MAX_NOTES = 2000
const MAX_LABEL = 200
// A day's grace for time zones: "today" in the planter's zone may be tomorrow in UTC.
const FUTURE_GRACE_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const body = await readBody(event)
  const client = serverSupabaseServiceRole(event)

  // Every log needs a photo as proof: an admin approves it from the photo, and
  // only then are its points paid.
  if (typeof body.photo_url !== 'string' || !body.photo_url) {
    throw createError({ statusCode: 400, message: 'Please add a photo as proof' })
  }
  if (!isOwnPhotoUrl(client, uid, body.photo_url)) {
    throw createError({ statusCode: 400, message: 'The photo must be uploaded through Tree Troupe' })
  }
  const photoUrl = body.photo_url

  const source = body.source === 'donated' || body.source === 'earned' ? body.source : 'planted'
  // A planted log is one tree; a missing quantity means one.
  const parsed = Number.parseInt(body.quantity, 10)
  const quantity = source === 'planted' || Number.isNaN(parsed) ? 1 : parsed
  if (quantity < 1 || quantity > MAX_QUANTITY) {
    throw createError({ statusCode: 400, message: `Quantity must be between 1 and ${MAX_QUANTITY.toLocaleString('en')}` })
  }
  const notes = optionalText(body.notes, MAX_NOTES, 'Notes')
  const donationProject = source === 'donated' ? optionalText(body.donation_project, MAX_LABEL, 'The project') : null
  const earnedActivity = source === 'earned' ? optionalText(body.earned_activity, MAX_LABEL, 'The activity') : null

  let location: string | null = null
  if (source === 'planted') {
    const lat = Number(body.lat)
    const lng = Number(body.lng)
    if (body.lat == null || body.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw createError({ statusCode: 400, message: 'Pick where you planted the tree on the map' })
    }
    location = `SRID=4326;POINT(${lng} ${lat})`
  }

  let plantedAt: string | undefined
  if (body.planted_at != null && body.planted_at !== '') {
    const date = new Date(body.planted_at)
    if (Number.isNaN(date.getTime())) { throw createError({ statusCode: 400, message: 'That date isn\'t valid' }) }
    if (date.getTime() > Date.now() + FUTURE_GRACE_MS) { throw createError({ statusCode: 400, message: 'The date can\'t be in the future' }) }
    plantedAt = body.planted_at
  }

  await enforceRateLimit(event, 'tree-log', uid)
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', uid)
    .single()

  if (profileError || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  const { data, error } = await client
    .from('trees')
    .insert({
      planted_by: profile.id,
      source,
      species_id: source === 'planted' ? (body.species_id || null) : null,
      community_id: body.community_id || null,
      location,
      quantity,
      donation_project: donationProject,
      earned_activity: earnedActivity,
      photo_urls: [photoUrl],
      notes,
      planted_at: plantedAt,
    })
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
