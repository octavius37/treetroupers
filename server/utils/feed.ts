// Headings admins can post under. Mirrors the feed_posts.category check
// constraint; the labels live in app/utils/feedCategories.ts.
export const FEED_CATEGORIES = ['upcoming_events', 'latest_news'] as const

export type FeedCategory = typeof FEED_CATEGORIES[number]

export function isFeedCategory(value: unknown): value is FeedCategory {
  return FEED_CATEGORIES.includes(value as FeedCategory)
}

interface CommunityNode {
  id: string
  parent_community_id: string | null
}

/** The communities containing `id`, nearest first (Lombok → Utrecht → Netherlands). */
export function communityAncestors(communities: CommunityNode[], id: string): string[] {
  const byId = new Map(communities.map(c => [c.id, c]))
  const ancestors: string[] = []
  let parent = byId.get(id)?.parent_community_id
  // The schema doesn't forbid a cycle, so stop at the first repeat.
  while (parent && parent !== id && !ancestors.includes(parent)) {
    ancestors.push(parent)
    parent = byId.get(parent)?.parent_community_id
  }
  return ancestors
}

/** Every community inside `id`, at any depth. */
export function communityDescendants(communities: CommunityNode[], id: string): string[] {
  const descendants: string[] = []
  const queue = [id]
  while (queue.length) {
    const current = queue.shift()
    for (const c of communities) {
      if (c.parent_community_id === current && c.id !== id && !descendants.includes(c.id)) {
        descendants.push(c.id)
        queue.push(c.id)
      }
    }
  }
  return descendants
}

export interface Announcement {
  category: FeedCategory
  title: string
  body: string | null
  photo_url: string | null
  event_at: string | null
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Validates an announcement from a request body (400 on anything wrong). Shared
 * by site admins (/api/cms/feed-posts) and community admins
 * (/api/dashboard/feed/posts).
 */
export function parseAnnouncement(body: Record<string, unknown> | null): Announcement {
  const input = body ?? {}
  if (!isFeedCategory(input.category)) {
    throw createError({ statusCode: 400, message: `category must be one of: ${FEED_CATEGORIES.join(', ')}` })
  }
  const title = optionalText(input.title)
  if (!title) { throw createError({ statusCode: 400, message: 'A title is required' }) }

  let eventAt: string | null = null
  if (input.category === 'upcoming_events') {
    const date = new Date(input.event_at as string)
    if (!input.event_at || Number.isNaN(date.getTime())) {
      throw createError({ statusCode: 400, message: 'An event needs a valid date and time' })
    }
    eventAt = date.toISOString()
  }

  return {
    category: input.category,
    title,
    body: optionalText(input.body),
    photo_url: optionalText(input.photo_url),
    event_at: eventAt,
  }
}

/** Community roles that may post announcements to their community's feed. */
export const COMMUNITY_POSTER_ROLES = ['admin', 'moderator']
