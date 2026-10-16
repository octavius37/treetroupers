import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/leaderboard.get'
import * as feedUtils from '~~/server/utils/feed'
import * as rankUtils from '~~/server/utils/rank'
import { captureError, createTestEvent, setQuery } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

const PROFILES = [
  { id: 'p-ada', display_name: 'Ada', avatar_url: null, total_points: 105 },
  { id: 'p-me', display_name: 'Milo', avatar_url: null, total_points: 105 },
  { id: 'p-bo', display_name: 'Bo', avatar_url: null, total_points: 20 },
]

function withTables(tables: Record<string, TableConfig> = {}) {
  const supabase = createSupabaseMock({
    // Answers both the viewer lookup and the list: the mock returns the same
    // data for every query on a table, and .single() takes it as-is.
    profiles: { data: PROFILES },
    communities: { data: [{ id: 'utrecht', parent_community_id: null }, { id: 'lombok', parent_community_id: 'utrecht' }] },
    community_members: { data: [{ profile_id: 'p-me' }, { profile_id: 'p-bo' }] },
    point_events: { data: [] },
    ...tables,
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('GET /api/dashboard/leaderboard', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    authUserId.mockReset().mockResolvedValue('auth-me')
    Object.assign(globalThis, { authUserId, ...feedUtils, ...rankUtils })
    setQuery({})
  })

  it('throws 401 without an authenticated user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withTables()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it('ranks all-time points, with ties sharing a rank', async () => {
    withTables()

    const { rows } = await handler(createTestEvent())

    expect(rows.map(r => [r.name, r.points, r.rank])).toEqual([
      ['Ada', 105, 1],
      ['Milo', 105, 1],
      ['Bo', 20, 3],
    ])
  })

  it('totals this month\'s point events, leaving out people who scored nothing', async () => {
    setQuery({ period: 'month' })
    const supabase = withTables({
      point_events: { data: [
        { profile_id: 'p-bo', points: 20 },
        { profile_id: 'p-bo', points: 50 },
        { profile_id: 'p-ada', points: 5 },
      ] },
    })

    const { rows } = await handler(createTestEvent())

    expect(rows.map(r => [r.name, r.points, r.rank])).toEqual([['Bo', 70, 1], ['Ada', 5, 2]])
    const events = supabase.callFor('point_events')
    expect(events.filters[0]).toMatchObject({ method: 'gte', column: 'created_at' })
  })

  it('limits a community board to members of it and the communities inside it', async () => {
    setQuery({ community_id: 'utrecht' })
    const supabase = withTables()

    await handler(createTestEvent())

    expect(supabase.callFor('community_members').filters).toEqual([
      { method: 'in', column: 'community_id', value: ['utrecht', 'lombok'] },
    ])
    expect(supabase.callsFor('profiles')[1]!.filters).toEqual([
      { method: 'in', column: 'id', value: ['p-me', 'p-bo'] },
    ])
  })

  it('returns no rows for a community with no members', async () => {
    setQuery({ community_id: 'utrecht' })
    withTables({ community_members: { data: [] } })

    await expect(handler(createTestEvent())).resolves.toEqual({ rows: [], me: null })
  })
})
