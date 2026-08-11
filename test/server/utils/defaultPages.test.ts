import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PAGES } from '~~/server/utils/defaultPages'
import { resolveSmartBlocks } from '~~/server/utils/resolveSmartBlocks'
import { createTestEvent } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

describe('DEFAULT_PAGES', () => {
  it('has at least one page', () => {
    expect(DEFAULT_PAGES.length).toBeGreaterThan(0)
  })

  it('includes the home page the site falls back to', () => {
    expect(DEFAULT_PAGES.map(p => p.slug)).toContain('home')
  })

  it('has unique slugs', () => {
    // Seeding upserts on slug, so a duplicate would silently drop a page.
    const slugs = DEFAULT_PAGES.map(p => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it.each(DEFAULT_PAGES.map(p => [p.slug, p] as const))('%s has a title and content', (_slug, page) => {
    expect(page.title.trim()).not.toBe('')
    expect(page.content.trim()).not.toBe('')
  })

  it.each(DEFAULT_PAGES.map(p => [p.slug] as const))('%s uses a url-safe slug', (slug) => {
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })
})

describe('DEFAULT_PAGES smart-block markers', () => {
  beforeEach(() => {
    const supabase = createSupabaseMock({
      trees: { count: 1 },
      profiles: { count: 1 },
      communities: { count: 1, data: [{ name: 'Riverside', slug: 'riverside', description: 'By the water' }] },
    })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  })

  const withBlocks = DEFAULT_PAGES.filter(p => p.content.includes('data-block='))

  it('has at least one page carrying a smart block, so this contract is actually exercised', () => {
    expect(withBlocks.length).toBeGreaterThan(0)
  })

  it.each(withBlocks.map(p => [p.slug, p] as const))(
    'every marker on %s is resolved by resolveSmartBlocks',
    async (_slug, page) => {
      // These two files must agree on the exact marker markup and nothing else
      // forces them to. A whitespace or attribute-order change in either leaves
      // an unresolved placeholder rendered on the live public page.
      const html = await resolveSmartBlocks(createTestEvent(), page.content)

      expect(html).not.toContain('data-block=')
    },
  )
})
