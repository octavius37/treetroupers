/**
 * What an achievement badge can count, as stored in `rewards.criteria`, and
 * how to describe it ("3 / 5 species planted"). Must match the check
 * constraint and badge_progress() in
 * 20261125140000_achievement_badges_and_pause_discounts.sql.
 */
export const BADGE_CRITERIA = {
  planted_trees: 'planted trees',
  trees: 'trees',
  donated_trees: 'donations',
  earned_trees: 'earned trees',
  streaks: '4-week streaks',
  suggestions: 'spots suggested',
  species: 'species planted',
  communities_founded: 'communities started',
  likes_given: 'likes given',
} as const

export type BadgeCriteria = keyof typeof BADGE_CRITERIA

export function isBadgeCriteria(value: unknown): value is BadgeCriteria {
  return typeof value === 'string' && Object.hasOwn(BADGE_CRITERIA, value)
}
