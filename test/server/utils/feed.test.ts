import { describe, expect, it } from 'vitest'
import { communityAncestors, communityDescendants, isFeedCategory } from '~~/server/utils/feed'

// Netherlands ⊃ Utrecht ⊃ { Lombok, Oost }, plus an unrelated Amsterdam.
const COMMUNITIES = [
  { id: 'nl', parent_community_id: null },
  { id: 'utrecht', parent_community_id: 'nl' },
  { id: 'lombok', parent_community_id: 'utrecht' },
  { id: 'oost', parent_community_id: 'utrecht' },
  { id: 'amsterdam', parent_community_id: 'nl' },
]

describe('communityAncestors', () => {
  it('walks up to the top, nearest first', () => {
    expect(communityAncestors(COMMUNITIES, 'lombok')).toEqual(['utrecht', 'nl'])
  })

  it('is empty for a top-level or unknown community', () => {
    expect(communityAncestors(COMMUNITIES, 'nl')).toEqual([])
    expect(communityAncestors(COMMUNITIES, 'nowhere')).toEqual([])
  })

  it('stops at a cycle instead of looping forever', () => {
    const cyclic = [
      { id: 'a', parent_community_id: 'b' },
      { id: 'b', parent_community_id: 'a' },
    ]
    expect(communityAncestors(cyclic, 'a')).toEqual(['b'])
  })
})

describe('communityDescendants', () => {
  it('finds every community inside, at any depth', () => {
    expect(communityDescendants(COMMUNITIES, 'nl').toSorted()).toEqual(['amsterdam', 'lombok', 'oost', 'utrecht'])
    expect(communityDescendants(COMMUNITIES, 'utrecht').toSorted()).toEqual(['lombok', 'oost'])
  })

  it('is empty for a community with nothing inside', () => {
    expect(communityDescendants(COMMUNITIES, 'lombok')).toEqual([])
  })

  it('stops at a cycle instead of looping forever', () => {
    const cyclic = [
      { id: 'a', parent_community_id: 'b' },
      { id: 'b', parent_community_id: 'a' },
    ]
    expect(communityDescendants(cyclic, 'a')).toEqual(['b'])
  })
})

describe('isFeedCategory', () => {
  it.each(['upcoming_events', 'latest_news'])('accepts %s', (category) => {
    expect(isFeedCategory(category)).toBe(true)
  })

  it.each(['news', '', null, undefined, 42])('rejects %s', (category) => {
    expect(isFeedCategory(category)).toBe(false)
  })
})
