import { serverSupabaseServiceRole } from '#supabase/server'

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

// Publishes an announcement to one community's feed (and the feeds of the
// communities inside it) or, with no community, to everyone's.
export default defineEventHandler(async (event) => {
  const { profile } = await requireAdmin(event)

  const body = (await readBody(event)) ?? {}

  if (!isFeedCategory(body.category)) {
    throw createError({ statusCode: 400, message: `category must be one of: ${FEED_CATEGORIES.join(', ')}` })
  }
  const title = optionalText(body.title)
  if (!title) { throw createError({ statusCode: 400, message: 'A title is required' }) }

  let eventAt: string | null = null
  if (body.category === 'upcoming_events') {
    const date = new Date(body.event_at)
    if (!body.event_at || Number.isNaN(date.getTime())) {
      throw createError({ statusCode: 400, message: 'An event needs a valid date and time' })
    }
    eventAt = date.toISOString()
  }

  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('feed_posts')
    .insert({
      kind: 'announcement',
      community_id: optionalText(body.community_id),
      author_id: profile.id,
      category: body.category,
      title,
      body: optionalText(body.body),
      photo_url: optionalText(body.photo_url),
      event_at: eventAt,
    })
    .select()
    .single()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  return data
})
