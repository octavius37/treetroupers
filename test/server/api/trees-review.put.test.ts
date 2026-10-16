import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/cms/trees/[id]/review.put'
import { captureError, createTestEvent, setRequestBody, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const ACTING_ADMIN = { id: 'profile-admin', role: 'admin' }

const requireAdmin = vi.fn()

function withTrees(config: TableConfig = { data: { id: 'tree-1', review_status: 'approved' } }) {
  const supabase = createSupabaseMock({ trees: config })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('PUT /api/cms/trees/:id/review', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    requireAdmin.mockReset().mockResolvedValue({ user: { sub: 'auth-1' }, profile: ACTING_ADMIN })
    // Nitro auto-imports this from server/utils; it has its own unit tests.
    Object.assign(globalThis, { requireAdmin })
    setRouterParams({ id: 'tree-1' })
    setRequestBody({ decision: 'approved' })
  })

  it('requires an admin before doing anything else', async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    const supabase = withTrees()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(403)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 400 when the id is missing from the route', async () => {
    setRouterParams({})
    const supabase = withTrees()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(supabase.calls).toHaveLength(0)
  })

  it.each([
    ['an unknown decision', { decision: 'maybe' }],
    ['"pending", which would reopen a review', { decision: 'pending' }],
    ['no decision', {}],
    ['a null body', null],
  ])('throws 400 for %s', async (_label, body) => {
    setRequestBody(body)
    const supabase = withTrees()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(supabase.calls).toHaveLength(0)
  })

  it.each(['approved', 'rejected'])('records %s with the reviewing admin', async (decision) => {
    setRequestBody({ decision })
    const supabase = withTrees()

    await handler(createTestEvent())

    const call = supabase.callFor('trees')
    expect(call.operation).toBe('update')
    expect(call.payload).toEqual({ review_status: decision, reviewed_by: 'profile-admin' })
  })

  // Approving pays points, so a log that has already been reviewed must not be
  // matched again, e.g. by two admins clicking at once.
  it('only updates the log while it is still pending', async () => {
    const supabase = withTrees()

    await handler(createTestEvent())

    expect(supabase.callFor('trees').filters).toEqual([
      { method: 'eq', column: 'id', value: 'tree-1' },
      { method: 'eq', column: 'review_status', value: 'pending' },
    ])
  })

  it('throws 409 when no pending log matched', async () => {
    withTrees({ data: null })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(409)
  })

  it('throws 500 with the database message when the update fails', async () => {
    withTrees({ data: null, error: { message: 'boom' } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('boom')
  })
})
