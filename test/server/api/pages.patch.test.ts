import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/cms/pages/[id].patch'
import { captureError, createTestEvent, setRequestBody, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const requireAdmin = vi.fn()

interface PageRow { id: string, parent_id: string | null }

/**
 * The handler reads the whole pages table to walk the ancestor chain, then
 * updates. Both hit the same table, so the mock is configured per operation.
 */
function withPages(rows: PageRow[], update: TableConfig = { data: { id: 'a' } }) {
  const supabase = createSupabaseMock({
    pages: { select: { data: rows }, update: update as never },
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

const VALID_BODY = { title: 'Alpha', slug: 'alpha', status: 'published' }

describe('PATCH /api/cms/pages/:id', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    requireAdmin.mockReset().mockResolvedValue({ user: { sub: 'auth-1' }, profile: { id: 'p1', role: 'admin' } })
    Object.assign(globalThis, { requireAdmin })
    setRouterParams({ id: 'a' })
    setRequestBody({ ...VALID_BODY })
  })

  it('requires an admin', async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    const supabase = withPages([])

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(403)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 400 when the id is missing from the route', async () => {
    setRouterParams({})
    withPages([])

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Missing page id')
  })

  describe('cycle prevention', () => {
    it('rejects a page as its own parent', async () => {
      setRequestBody({ ...VALID_BODY, parent_id: 'a' })
      const supabase = withPages([{ id: 'a', parent_id: null }])

      const error = await captureError(() => handler(createTestEvent()))

      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('That parent would create a loop in the page hierarchy.')
      expect(supabase.callsFor('pages').filter(c => c.operation === 'update')).toHaveLength(0)
    })

    it('rejects a parent that is already a child of this page', async () => {
      // The two-level loop the old `parent_id === id` guard let through: B's
      // parent is already A, so making B the parent of A closes the cycle and
      // both pages drop out of the nav.
      setRouterParams({ id: 'a' })
      setRequestBody({ ...VALID_BODY, parent_id: 'b' })
      const supabase = withPages([
        { id: 'a', parent_id: null },
        { id: 'b', parent_id: 'a' },
      ])

      const error = await captureError(() => handler(createTestEvent()))

      expect(error.statusCode).toBe(400)
      expect(supabase.callsFor('pages').filter(c => c.operation === 'update')).toHaveLength(0)
    })

    it('rejects a parent three levels down', async () => {
      setRouterParams({ id: 'a' })
      setRequestBody({ ...VALID_BODY, parent_id: 'c' })
      withPages([
        { id: 'a', parent_id: null },
        { id: 'b', parent_id: 'a' },
        { id: 'c', parent_id: 'b' },
      ])

      const error = await captureError(() => handler(createTestEvent()))

      expect(error.statusCode).toBe(400)
    })

    it('terminates instead of hanging when the stored data already loops', async () => {
      // Defensive: a loop written by a seed or a direct database edit must not
      // put the ancestor walk into an infinite loop.
      setRouterParams({ id: 'a' })
      setRequestBody({ ...VALID_BODY, parent_id: 'b' })
      withPages([
        { id: 'a', parent_id: null },
        { id: 'b', parent_id: 'c' },
        { id: 'c', parent_id: 'b' },
      ])

      const error = await captureError(() => handler(createTestEvent()))

      expect(error.statusCode).toBe(400)
    })

    it('accepts an unrelated page as parent', async () => {
      setRouterParams({ id: 'a' })
      setRequestBody({ ...VALID_BODY, parent_id: 'b' })
      const supabase = withPages([
        { id: 'a', parent_id: null },
        { id: 'b', parent_id: null },
      ])

      await expect(handler(createTestEvent())).resolves.toBeTruthy()

      const update = supabase.callsFor('pages').find(c => c.operation === 'update')
      expect((update!.payload as { parent_id: string }).parent_id).toBe('b')
    })

    it('accepts a deeper branch that does not loop back', async () => {
      setRouterParams({ id: 'a' })
      setRequestBody({ ...VALID_BODY, parent_id: 'c' })
      withPages([
        { id: 'a', parent_id: null },
        { id: 'b', parent_id: null },
        { id: 'c', parent_id: 'b' },
      ])

      await expect(handler(createTestEvent())).resolves.toBeTruthy()
    })

    it('skips the check entirely when clearing the parent', async () => {
      setRequestBody({ ...VALID_BODY, parent_id: null })
      const supabase = withPages([{ id: 'a', parent_id: 'b' }])

      await handler(createTestEvent())

      // No ancestor walk needed, so no read of the pages table.
      expect(supabase.callsFor('pages').filter(c => c.operation === 'select')).toHaveLength(0)
      const update = supabase.callsFor('pages').find(c => c.operation === 'update')
      expect((update!.payload as { parent_id: null }).parent_id).toBeNull()
    })

    it('treats an empty-string parent as cleared', async () => {
      setRequestBody({ ...VALID_BODY, parent_id: '' })
      const supabase = withPages([{ id: 'a', parent_id: 'b' }])

      await handler(createTestEvent())

      const update = supabase.callsFor('pages').find(c => c.operation === 'update')
      expect((update!.payload as { parent_id: null }).parent_id).toBeNull()
    })
  })

  it('updates the addressed page', async () => {
    const supabase = withPages([{ id: 'a', parent_id: null }])

    await handler(createTestEvent())

    const update = supabase.callsFor('pages').find(c => c.operation === 'update')
    expect(update!.filters).toEqual([{ method: 'eq', column: 'id', value: 'a' }])
    expect(update!.payload).toMatchObject({ title: 'Alpha', slug: 'alpha', status: 'published' })
  })

  it('throws 500 when the update fails', async () => {
    withPages([{ id: 'a', parent_id: null }], { data: null, error: { message: 'duplicate slug' } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('duplicate slug')
  })
})
