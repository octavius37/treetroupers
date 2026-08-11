import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/public/pages/[slug].get'
import { captureError, createTestEvent, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const PAGE = {
  id: 'page-1',
  title: 'Climate change',
  slug: 'climate-change',
  content: '<p>Trees are good.</p>',
  status: 'published',
}

function withPages(config: TableConfig) {
  const supabase = createSupabaseMock({ pages: config })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('GET /api/public/pages/:slug', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    setRouterParams({ slug: 'climate-change' })
  })

  it('throws 400 when the slug is missing', async () => {
    setRouterParams({})
    const supabase = withPages({ data: PAGE })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(supabase.calls).toHaveLength(0)
  })

  it('filters on both the slug and published status', async () => {
    // This endpoint uses the service-role client, which bypasses RLS entirely —
    // the status filter is the only thing keeping drafts off the public site.
    const supabase = withPages({ data: PAGE })

    await handler(createTestEvent())

    const call = supabase.callFor('pages')
    expect(call.filters).toEqual([
      { method: 'eq', column: 'slug', value: 'climate-change' },
      { method: 'eq', column: 'status', value: 'published' },
    ])
    expect(call.terminal).toBe('maybeSingle')
  })

  it('throws 404 when no published page matches', async () => {
    withPages({ data: null })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Page not found')
  })

  it('throws 500 when the query errors', async () => {
    withPages({ data: null, error: { message: 'connection reset' } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
  })

  it('returns the page with its content rendered as `html`', async () => {
    withPages({ data: PAGE })

    await expect(handler(createTestEvent())).resolves.toEqual({
      id: 'page-1',
      title: 'Climate change',
      slug: 'climate-change',
      html: '<p>Trees are good.</p>',
    })
  })

  it('does not leak the raw `content` or `status` fields', async () => {
    withPages({ data: PAGE })

    const result = await handler(createTestEvent()) as Record<string, unknown>

    expect(Object.keys(result).toSorted()).toEqual(['html', 'id', 'slug', 'title'])
  })

  it('renders null content as an empty string rather than "null"', async () => {
    withPages({ data: { ...PAGE, content: null } })

    await expect(handler(createTestEvent())).resolves.toMatchObject({ html: '' })
  })

  it('resolves smart blocks in the page content', async () => {
    const supabase = createSupabaseMock({
      pages: { data: { ...PAGE, content: '<div data-block="stats-counter"><span>x</span></div>' } },
      trees: { count: 3 },
      communities: { count: 2 },
      profiles: { count: 1 },
    })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)

    const result = await handler(createTestEvent()) as { html: string }

    expect(result.html).not.toContain('data-block=')
    expect(result.html).toContain('Trees Planted')
  })
})
