import { describe, expect, it } from 'vitest'
import { excerptFromHtml } from '~~/server/utils/excerptFromHtml'

describe('excerptFromHtml', () => {
  it('strips tags and collapses whitespace', () => {
    expect(excerptFromHtml('<p>Lay   mulch <strong>after</strong> the\nfirst frost.</p>')).toBe(
      'Lay mulch after the first frost.',
    )
  })

  it('returns an empty string for null content', () => {
    expect(excerptFromHtml(null)).toBe('')
  })

  it('returns short text unchanged', () => {
    expect(excerptFromHtml('<p>Short tip.</p>', 200)).toBe('Short tip.')
  })

  it('truncates long text on a word boundary and adds an ellipsis', () => {
    const text = 'word '.repeat(50).trim()

    const result = excerptFromHtml(`<p>${text}</p>`, 20)

    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(21)
    expect(result).not.toContain('  ')
  })
})
