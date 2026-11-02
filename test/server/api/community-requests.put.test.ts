import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/cms/community-requests/[id].put'
import { captureError, createTestEvent, setRequestBody, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const requireAdmin = vi.fn()

function withTables(tables: Record<string, TableConfig>) {
  const supabase = createSupabaseMock({
    'community_requests': { data: { id: 'req-1', name: 'Lombok West' } },
    'communities': { data: [{ slug: 'lombok-west' }] },
    'rpc:approve_community_request': { data: 'community-9' },
    ...tables,
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  requireAdmin.mockReset().mockResolvedValue({ user: {}, profile: { id: 'p-admin', role: 'admin' } })
  Object.assign(globalThis, { requireAdmin })
  setRouterParams({ id: 'req-1' })
  setRequestBody({ decision: 'approved' })
})

describe('PUT /api/cms/community-requests/:id', () => {
  it('requires an admin before doing anything else', async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    const supabase = withTables({})

    expect((await captureError(() => handler(createTestEvent()))).statusCode).toBe(403)
    expect(supabase.calls).toHaveLength(0)
  })

  it('approves in one database call, with a slug that isn\'t taken', async () => {
    const supabase = withTables({})

    await expect(handler(createTestEvent())).resolves.toEqual({ status: 'approved', communityId: 'community-9' })
    expect(supabase.callFor('rpc:approve_community_request').payload).toEqual({ p_request_id: 'req-1', p_slug: 'lombok-west-2' })
    // Nothing is written outside the transaction.
    expect(supabase.calls.filter(c => c.operation !== 'select')).toEqual([])
  })

  it.each([
    ['P0002', 'the request was no longer pending'],
    ['23505', 'the slug was taken in the meantime'],
  ])('answers 409 when the transaction fails with %s (%s)', async (code) => {
    withTables({ 'rpc:approve_community_request': { data: null, error: { code, message: 'nope' } } })

    expect((await captureError(() => handler(createTestEvent()))).statusCode).toBe(409)
  })

  it('declines only a pending request', async () => {
    setRequestBody({ decision: 'declined' })
    const supabase = withTables({})

    await expect(handler(createTestEvent())).resolves.toEqual({ status: 'declined', communityId: null })
    const update = supabase.callsFor('community_requests').find(c => c.operation === 'update')!
    expect(update.filters).toContainEqual({ method: 'eq', column: 'status', value: 'pending' })
    expect(supabase.callsFor('rpc:approve_community_request')).toHaveLength(0)
  })
})
