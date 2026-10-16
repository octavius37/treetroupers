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
