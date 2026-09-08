import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/public/pages/[slug]/posts.get'
import { captureError, createTestEvent, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const COLLECTION = { id: 'collection-1' }
const POST_ROW = {
  id: 'post-1',
  title: 'Mulching in autumn',
  slug: 'mulching-in-autumn',
  content: '<p>Lay mulch after the first frost to lock in moisture.</p>',
  created_at: '2026-09-01T00:00:00.000Z',
}

// The handler queries `pages` twice: once to resolve the collection by slug,
// once for its published children. The two calls expect different shapes, so
// `config` is the ordered [collection result, children result] pair.
function withPages(config: TableConfig) {
  const supabase = createSupabaseMock({ pages: config })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('GET /api/public/pages/:slug/posts', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    setRouterParams({ slug: 'tree-planting-tips' })
  })

  it('throws 400 when the slug is missing', async () => {
    setRouterParams({})
    const supabase = withPages([{ data: COLLECTION }])

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 404 when no published collection matches the slug', async () => {
    withPages([{ data: null }])

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Collection not found')
  })

  it('throws 500 when the collection lookup errors', async () => {
    withPages([{ data: null, error: { message: 'connection reset' } }])

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('connection reset')
  })

  it('throws 500 when the children query errors', async () => {
    withPages([{ data: COLLECTION }, { data: null, error: { message: 'timeout' } }])

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('timeout')
  })

  it('resolves the collection by slug and published status, then its children by parent_id and published status, newest first', async () => {
    const supabase = withPages([{ data: COLLECTION }, { data: [POST_ROW] }])

    await handler(createTestEvent())

    const calls = supabase.callsFor('pages')
    expect(calls).toHaveLength(2)
    expect(calls[0]!.filters).toEqual([
      { method: 'eq', column: 'slug', value: 'tree-planting-tips' },
      { method: 'eq', column: 'status', value: 'published' },
    ])
    expect(calls[0]!.terminal).toBe('maybeSingle')
    expect(calls[1]!.filters).toEqual([
      { method: 'eq', column: 'parent_id', value: 'collection-1' },
      { method: 'eq', column: 'status', value: 'published' },
    ])
    expect(calls[1]!.order).toBe('created_at')
  })

  it('maps rows to teaser cards with a plain-text excerpt', async () => {
    withPages([{ data: COLLECTION }, { data: [POST_ROW] }])

    await expect(handler(createTestEvent())).resolves.toEqual([{
      id: 'post-1',
      title: 'Mulching in autumn',
      slug: 'mulching-in-autumn',
      createdAt: '2026-09-01T00:00:00.000Z',
      excerpt: 'Lay mulch after the first frost to lock in moisture.',
    }])
  })

  it('returns an empty list when the collection has no published children', async () => {
    withPages([{ data: COLLECTION }, { data: [] }])

    await expect(handler(createTestEvent())).resolves.toEqual([])
  })
})
