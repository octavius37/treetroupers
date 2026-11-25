import { describe, expect, it } from 'vitest'
import { rewardCriteriaFromBody, rewardStatus } from '~~/server/utils/badges'

describe('rewardStatus', () => {
  it('unlocks a points-only reward on points', () => {
    expect(rewardStatus({ points_required: 50, criteria: null, criteria_count: null }, 50, {})).toEqual({ unlocked: true, achievement: null })
    expect(rewardStatus({ points_required: 50, criteria: null, criteria_count: null }, 49, {}).unlocked).toBe(false)
  })

  it('unlocks an achievement badge once the achievement is reached', () => {
    const badge = { points_required: 0, criteria: 'species', criteria_count: 5 }
    expect(rewardStatus(badge, 0, { species: 3 })).toEqual({ unlocked: false, achievement: { current: 3, target: 5, label: 'species planted' } })
    expect(rewardStatus(badge, 0, { species: 5 }).unlocked).toBe(true)
  })

  it('needs both the points and the achievement when a badge has both', () => {
    const badge = { points_required: 100, criteria: 'trees', criteria_count: 10 }
    expect(rewardStatus(badge, 99, { trees: 10 }).unlocked).toBe(false)
    expect(rewardStatus(badge, 100, { trees: 9 }).unlocked).toBe(false)
    expect(rewardStatus(badge, 100, { trees: 10 }).unlocked).toBe(true)
  })
})

describe('rewardCriteriaFromBody', () => {
  it('reads an achievement, or none', () => {
    expect(rewardCriteriaFromBody({ criteria: 'likes_given', criteria_count: '25' })).toEqual({ criteria: 'likes_given', criteria_count: 25 })
    expect(rewardCriteriaFromBody({ criteria: '' })).toEqual({ criteria: null, criteria_count: null })
  })

  it.each([
    [{ criteria: 'points', criteria_count: 1 }, 'badge'],
    [{ criteria: 'trees', criteria_count: 0 }, 'badge'],
    [{ criteria: 'trees', criteria_count: 2.5 }, 'badge'],
    [{ criteria: 'trees', criteria_count: 5 }, 'discount'],
  ])('refuses %o on a %s', (body, type) => {
    expect(() => rewardCriteriaFromBody(body, type)).toThrow(expect.objectContaining({ statusCode: 400 }))
  })
})
