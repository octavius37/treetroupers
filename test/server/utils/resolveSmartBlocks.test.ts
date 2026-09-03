import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveSmartBlocks } from '~~/server/utils/resolveSmartBlocks'
import { createTestEvent } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const STATS_BLOCK = '<div data-block="stats-counter" class="marker"><span>placeholder</span></div>'
const CAROUSEL_BLOCK = '<div data-block="communities-carousel" class="marker"><span>placeholder</span></div>'

function withData(tables: Record<string, TableConfig>) {
  const supabase = createSupabaseMock(tables)
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('resolveSmartBlocks', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
  })

  describe('content without smart blocks', () => {
    it('returns the html unchanged', async () => {
      withData({})
      const html = '<section><h1>Plain page</h1></section>'

      await expect(resolveSmartBlocks(createTestEvent(), html)).resolves.toBe(html)
    })

    it('makes no database calls at all', async () => {
      // Every public page render goes through here; the common case must not
      // pay for three count queries.
      const supabase = withData({})

      await resolveSmartBlocks(createTestEvent(), '<p>no blocks here</p>')

      expect(serverSupabaseServiceRole).not.toHaveBeenCalled()
      expect(supabase.calls).toHaveLength(0)
    })

    it('handles empty content', async () => {
      withData({})

      await expect(resolveSmartBlocks(createTestEvent(), '')).resolves.toBe('')
    })
  })

  describe('stats-counter', () => {
    it('replaces the marker with live counts', async () => {
      withData({ trees: { count: 128 }, communities: { count: 7 }, profiles: { count: 42 } })

      const html = await resolveSmartBlocks(createTestEvent(), STATS_BLOCK)

      expect(html).not.toContain('data-block="stats-counter"')
      expect(html).toContain('128')
      expect(html).toContain('Trees Planted')
      expect(html).toContain('7')
      expect(html).toContain('Communities')
      expect(html).toContain('42')
      expect(html).toContain('Active Members')
    })

    it('counts with a head-only query rather than fetching rows', async () => {
      const supabase = withData({ trees: { count: 1 }, communities: { count: 1 }, profiles: { count: 1 } })

      await resolveSmartBlocks(createTestEvent(), STATS_BLOCK)

      for (const table of ['trees', 'communities', 'profiles']) {
        expect(supabase.callFor(table).options).toEqual({ count: 'exact', head: true })
      }
    })

    it('renders 0 when a count comes back null', async () => {
      withData({ trees: { count: null }, communities: { count: null }, profiles: { count: null } })

      const html = await resolveSmartBlocks(createTestEvent(), STATS_BLOCK)

      expect(html).not.toContain('null')
      expect(html.match(/>0</g)).toHaveLength(3)
    })

    it('preserves surrounding content', async () => {
      withData({ trees: { count: 1 }, communities: { count: 1 }, profiles: { count: 1 } })

      const html = await resolveSmartBlocks(
        createTestEvent(),
        `<h1>Before</h1>${STATS_BLOCK}<p>After</p>`,
      )

      expect(html).toContain('<h1>Before</h1>')
      expect(html).toContain('<p>After</p>')
    })
  })

  describe('communities-carousel', () => {
    it('renders a card per community', async () => {
      withData({
        communities: {
          data: [
            { name: 'Riverside', slug: 'riverside', description: 'By the water' },
            { name: 'Hilltop', slug: 'hilltop', description: 'Up high' },
          ],
        },
      })

      const html = await resolveSmartBlocks(createTestEvent(), CAROUSEL_BLOCK)

      expect(html).not.toContain('data-block="communities-carousel"')
      expect(html).toContain('Riverside')
      expect(html).toContain('By the water')
      expect(html).toContain('Hilltop')
      expect(html).toContain('Active Communities')
    })

    it('caps the query at six communities, ordered by name', async () => {
      const supabase = withData({ communities: { data: [] } })

      await resolveSmartBlocks(createTestEvent(), CAROUSEL_BLOCK)

      const call = supabase.callFor('communities')
      expect(call.limit).toBe(6)
      expect(call.order).toBe('name')
    })

    it('renders the empty state when there are no communities', async () => {
      withData({ communities: { data: [] } })

      const html = await resolveSmartBlocks(createTestEvent(), CAROUSEL_BLOCK)

      expect(html).toContain('No communities yet.')
    })

    it('renders the empty state when the query returns null data', async () => {
      withData({ communities: { data: null } })

      const html = await resolveSmartBlocks(createTestEvent(), CAROUSEL_BLOCK)

      expect(html).toContain('No communities yet.')
    })

    it('tolerates a null description', async () => {
      withData({ communities: { data: [{ name: 'Riverside', slug: 'riverside', description: null }] } })

      const html = await resolveSmartBlocks(createTestEvent(), CAROUSEL_BLOCK)

      expect(html).toContain('Riverside')
      expect(html).not.toContain('null')
    })

    it('escapes community-supplied name and description', async () => {
      // Community names are user input rendered into a public page as raw HTML.
      withData({
        communities: {
          data: [{
            name: '<script>alert("xss")</script>',
            slug: 'evil',
            description: `Tom & Jerry's "trees" <b>bold</b>`,
          }],
        },
      })

      const html = await resolveSmartBlocks(createTestEvent(), CAROUSEL_BLOCK)

      expect(html).not.toContain('<script>')
      expect(html).not.toContain('<b>bold</b>')
      expect(html).toContain('&lt;script&gt;')
      expect(html).toContain('&amp;')
      expect(html).toContain('&quot;')
      expect(html).toContain('&#39;')
    })
  })

  describe('both blocks in one page', () => {
    it('resolves each one', async () => {
      withData({
        trees: { count: 5 },
        profiles: { count: 9 },
        communities: { count: 2, data: [{ name: 'Riverside', slug: 'riverside', description: 'By the water' }] },
      })

      const html = await resolveSmartBlocks(
        createTestEvent(),
        `${STATS_BLOCK}<hr>${CAROUSEL_BLOCK}`,
      )

      expect(html).not.toContain('data-block=')
      expect(html).toContain('Trees Planted')
      expect(html).toContain('Active Communities')
      expect(html).toContain('<hr>')
    })
  })
})
