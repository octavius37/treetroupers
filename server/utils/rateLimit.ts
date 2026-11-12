import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

const HOUR = 60 * 60
const DAY = 24 * HOUR

/**
 * Per-action limits: how many requests one caller may make in the window.
 * Generous for real use; they exist to stop scripts filling storage, inboxes
 * or the feed. The contact form is keyed by IP, everything else by account.
 */
export const RATE_LIMITS = {
  'contact': { limit: 5, windowSeconds: HOUR },
  'tree-photo': { limit: 30, windowSeconds: HOUR },
  'avatar': { limit: 10, windowSeconds: HOUR },
  'tree-log': { limit: 30, windowSeconds: HOUR },
  'tree-update': { limit: 20, windowSeconds: HOUR },
  'feed-post': { limit: 20, windowSeconds: HOUR },
  'like': { limit: 200, windowSeconds: HOUR },
  'suggestion': { limit: 30, windowSeconds: HOUR },
  'community-request': { limit: 10, windowSeconds: DAY },
} as const

export type RateLimitedAction = keyof typeof RATE_LIMITS

/**
 * Counts one request by `who` for `action` and throws 429 once the limit is
 * reached. The count lives in Postgres (hit_rate_limit), so it holds across
 * Vercel's serverless instances, unlike an in-memory counter.
 *
 * If the check itself fails, the request is let through: a rate limiter
 * outage shouldn't take the site down with it.
 */
export async function enforceRateLimit(event: H3Event, action: RateLimitedAction, who: string) {
  const { limit, windowSeconds } = RATE_LIMITS[action]
  const { data, error } = await serverSupabaseServiceRole(event).rpc('hit_rate_limit', {
    p_key: `${action}:${who}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error(`Rate limit check failed for ${action}:`, error.message)
    return
  }
  if (data === false) {
    throw createError({
      statusCode: 429,
      message: windowSeconds >= DAY
        ? 'You\'ve reached today\'s limit for this. Please try again tomorrow.'
        : 'You\'re doing that too often. Please wait a while and try again.',
    })
  }
}
