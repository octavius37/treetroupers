import type { BadgeCriteria } from '../../shared/utils/badgeCriteria'
import { BADGE_CRITERIA, isBadgeCriteria } from '../../shared/utils/badgeCriteria'

export type BadgeProgress = Partial<Record<BadgeCriteria, number>>

interface RewardRule {
  points_required: number
  criteria: string | null
  criteria_count: number | null
}

/**
 * Whether a member has unlocked a reward: enough points and, for an
 * achievement badge, enough of what it counts. `achievement` is null for a
 * points-only reward.
 */
export function rewardStatus(reward: RewardRule, points: number, progress: BadgeProgress) {
  const hasPoints = points >= reward.points_required
  if (!isBadgeCriteria(reward.criteria) || !reward.criteria_count) {
    return { unlocked: hasPoints, achievement: null }
  }
  const current = Number(progress[reward.criteria] ?? 0)
  const achievement = { current, target: reward.criteria_count, label: BADGE_CRITERIA[reward.criteria] }
  return { unlocked: hasPoints && current >= reward.criteria_count, achievement }
}

/**
 * The achievement part of a reward from an admin's request: both null for a
 * points-only reward. 400 for an unknown criteria, a count below 1, or an
 * achievement on a reward that isn't a badge.
 */
export function rewardCriteriaFromBody(body: { criteria?: unknown, criteria_count?: unknown }, type = 'badge') {
  if (body.criteria == null || body.criteria === '') { return { criteria: null, criteria_count: null } }
  if (!isBadgeCriteria(body.criteria)) {
    throw createError({ statusCode: 400, message: `criteria must be one of: ${Object.keys(BADGE_CRITERIA).join(', ')}` })
  }
  if (type !== 'badge') { throw createError({ statusCode: 400, message: 'Only badges can need an achievement' }) }
  const count = Number(body.criteria_count)
  if (!Number.isInteger(count) || count < 1) { throw createError({ statusCode: 400, message: 'The achievement count must be a whole number of at least 1' }) }
  return { criteria: body.criteria, criteria_count: count }
}
