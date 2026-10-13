import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import create from '~~/server/api/dashboard/planting-suggestions.post'
import remove from '~~/server/api/dashboard/planting-suggestions/[id].delete'
import { captureError, createTestEvent, setRequestBody, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

function withTables(tables: Record<string, TableConfig> = {}) {
  const supabase = createSupabaseMock({
    profiles: { data: { id: 'profile-1' } },
    planting_suggestions: { data: { id: 'suggestion-1' } },
    ...tables,
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  authUserId.mockReset().mockResolvedValue('auth-user-1')
  Object.assign(globalThis, { authUserId })
})

describe('POST /api/dashboard/planting-suggestions', () => {
  beforeEach(() => {
    setRequestBody({ lat: 52.3676, lng: 4.9041, notes: '  Empty verge  ' })
  })

  it('throws 401 without an authenticated user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withTables()

    const error = await captureError(() => create(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it.each([
    ['missing', {}],
    ['non-numeric', { lat: 'abc', lng: 4 }],
    ['out of range', { lat: 91, lng: 4 }],
  ])('throws 400 for a %s location without querying', async (_name, body) => {
    setRequestBody(body)
    const supabase = withTables()

    const error = await captureError(() => create(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 404 when the user has no profile', async () => {
    const supabase = withTables({ profiles: { data: null } })

    const error = await captureError(() => create(createTestEvent()))

    expect(error.statusCode).toBe(404)
    expect(supabase.callsFor('planting_suggestions')).toHaveLength(0)
  })

  it('stores the point longitude-first, attributed to the profile, with trimmed notes', async () => {
    const supabase = withTables()

    await create(createTestEvent())

    expect(supabase.callFor('planting_suggestions').payload).toEqual({
      suggested_by: 'profile-1',
      location: 'SRID=4326;POINT(4.9041 52.3676)',
      notes: 'Empty verge',
    })
  })

  it('stores blank notes as null', async () => {
    setRequestBody({ lat: 1, lng: 2, notes: '   ' })
    const supabase = withTables()

    await create(createTestEvent())

    expect((supabase.callFor('planting_suggestions').payload as { notes: unknown }).notes).toBeNull()
  })

  it('throws 500 with the database message when the insert fails', async () => {
    withTables({ planting_suggestions: { data: null, error: { message: 'boom' } } })

    const error = await captureError(() => create(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('boom')
  })
})

describe('DELETE /api/dashboard/planting-suggestions/:id', () => {
  beforeEach(() => {
    setRouterParams({ id: 'suggestion-1' })
  })

  it('throws 401 without an authenticated user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withTables()

    const error = await captureError(() => remove(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it('only deletes the caller\'s own suggestion', async () => {
    const supabase = withTables()

    await expect(remove(createTestEvent())).resolves.toEqual({ success: true })

    expect(supabase.callFor('planting_suggestions').filters).toEqual([
      { method: 'eq', column: 'id', value: 'suggestion-1' },
      { method: 'eq', column: 'suggested_by', value: 'profile-1' },
    ])
  })

  it('throws 404 when the user has no profile', async () => {
    const supabase = withTables({ profiles: { data: null } })

    const error = await captureError(() => remove(createTestEvent()))

    expect(error.statusCode).toBe(404)
    expect(supabase.callsFor('planting_suggestions')).toHaveLength(0)
  })
})
