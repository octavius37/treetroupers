import { describe, expect, it } from 'vitest'
import { slugify } from '~~/server/utils/slugify'

describe('slugify', () => {
  it.each([
    ['Lombok West!', 'lombok-west'],
    ['Zürich Nord', 'zurich-nord'],
    ['  ’s-Hertogenbosch  ', 's-hertogenbosch'],
    ['!!!', 'community'],
  ])('%s → %s', (name, slug) => {
    expect(slugify(name)).toBe(slug)
  })
})
