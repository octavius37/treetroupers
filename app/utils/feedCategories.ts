// Display names for feed_posts.category. The keys mirror FEED_CATEGORIES in
// server/utils/feed.ts and the database check constraint.
export const FEED_CATEGORY_LABELS: Record<string, string> = {
  upcoming_events: 'Upcoming events',
  latest_news: 'Latest news',
}
