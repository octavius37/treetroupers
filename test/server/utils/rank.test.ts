import { describe, expect, it } from 'vitest'
import { rankRows } from '~~/server/utils/rank'

describe('rankRows', () => {
  it('gives equal points the same rank and skips the next', () => {
    const ranked = rankRows([{ points: 100 }, { points: 100 }, { points: 90 }, { points: 80 }, { points: 80 }, { points: 10 }])
    expect(ranked.map(r => r.rank)).toEqual([1, 1, 3, 4, 4, 6])
  })

  it('handles an empty list', () => {
    expect(rankRows([])).toEqual([])
  })
})
