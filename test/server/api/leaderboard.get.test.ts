import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/leaderboard.get'
import { captureError, createTestEvent, setQuery } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

// What leaderboard_points returns: everyone in scope, sorted by points.
const POINTS = [
  { id: 'p-ada', name: 'Ada', avatarUrl: null, points: 105 },
  { id: 'p-me', name: 'Milo', avatarUrl: null, points: 105 },
  { id: 'p-bo', name: 'Bo', avatarUrl: null, points: 20 },
]

function withTables(tables: Record<string, TableConfig> = {}) {
  const supabase = createSupabaseMock({
    'profiles': { data: { id: 'p-me' } },
    'communities': { data: [{ id: 'utrecht', parent_community_id: null }, { id: 'lombok', parent_community_id: 'utrecht' }] },
    'rpc:leaderboard_points': { data: POINTS },
    ...tables,
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('GET /api/dashboard/leaderboard', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    authUserId.mockReset().mockResolvedValue('auth-me')
    Object.assign(globalThis, { authUserId })
    setQuery({})
  })

  it('throws 401 without an authenticated user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withTables()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it('ranks the points, with ties sharing a rank, and finds the viewer', async () => {
    const supabase = withTables()

    const { rows, me } = await handler(createTestEvent())

    expect(rows.map(r => [r.name, r.points, r.rank])).toEqual([['Ada', 105, 1], ['Milo', 105, 1], ['Bo', 20, 3]])
    expect(me).toMatchObject({ id: 'p-me', rank: 1 })
    expect(supabase.callFor('rpc:leaderboard_points').payload).toEqual({ p_since: null, p_community_ids: null })
  })

  it('asks for points since the start of the month', async () => {
    setQuery({ period: 'month' })
    const supabase = withTables()

    await handler(createTestEvent())

    const { p_since: since } = supabase.callFor('rpc:leaderboard_points').payload as { p_since: string }
    expect(new Date(since).getUTCDate()).toBe(1)
    expect(new Date(since).getUTCHours()).toBe(0)
  })

  it('limits a community board to it and the communities inside it', async () => {
    setQuery({ community_id: 'utrecht' })
    const supabase = withTables()

    await handler(createTestEvent())

    expect(supabase.callFor('rpc:leaderboard_points').payload).toMatchObject({ p_community_ids: ['utrecht', 'lombok'] })
  })

  it('throws 500 when the database fails', async () => {
    withTables({ 'rpc:leaderboard_points': { data: null, error: { message: 'boom' } } })

    expect((await captureError(() => handler(createTestEvent()))).statusCode).toBe(500)
  })
})
