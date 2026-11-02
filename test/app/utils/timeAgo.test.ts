import { describe, expect, it } from 'vitest'
import { timeAgo } from '~/utils/timeAgo'

const NOW = new Date('2026-10-16T12:00:00Z')

describe('timeAgo', () => {
  it.each([
    ['2026-10-16T11:59:30Z', 'just now'],
    ['2026-10-16T11:55:00Z', '5 minutes ago'],
    ['2026-10-16T09:00:00Z', '3 hours ago'],
    ['2026-10-15T12:00:00Z', 'yesterday'],
    ['2026-10-02T12:00:00Z', '2 weeks ago'],
    ['2025-10-16T12:00:00Z', 'last year'],
    ['2026-10-21T12:00:00Z', 'in 5 days'],
  ])('describes %s as "%s"', (date, expected) => {
    expect(timeAgo(date, NOW)).toBe(expected)
  })
})
