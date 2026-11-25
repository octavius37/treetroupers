import { beforeEach, describe, expect, it, vi } from 'vitest'
import treeMap from '~~/server/api/dashboard/tree-map.get'
import myTrees from '~~/server/api/dashboard/trees.get'
import { captureError, createTestEvent, setQuery } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  authUserId.mockReset().mockResolvedValue('auth-user-1')
  Object.assign(globalThis, { authUserId })
})

describe('GET /api/dashboard/trees', () => {
  it('returns the caller\'s own recent logs with their photo', async () => {
    const supabase = createSupabaseMock({
      profiles: { data: { id: 'profile-1', role: 'user' } },
      trees: { data: [{ id: 't1', source: 'donated', photo_urls: ['https://x/tree-photos/auth-user-1/a.jpg'] }] },
    })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client as never)
    setQuery({ limit: '500' })

    const result = await myTrees(createTestEvent())

    expect(result[0]).toMatchObject({ id: 't1', photoUrl: 'https://x/tree-photos/auth-user-1/a.jpg' })
    expect(result[0]!.photo_urls).toBeUndefined()
    const query = supabase.callFor('trees')
    expect(query.filters).toContainEqual(expect.objectContaining({ column: 'planted_by', value: 'profile-1' }))
    expect(query.limit).toBe(50)
  })

  it('throws 401 without a user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = createSupabaseMock()
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client as never)

    expect((await captureError(() => myTrees(createTestEvent()))).statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })
})

describe('GET /api/dashboard/tree-map', () => {
  it('asks member_tree_map for the caller\'s view and marks their own trees', async () => {
    const supabase = createSupabaseMock({
      'profiles': { data: { id: 'profile-1', role: 'user' } },
      'rpc:member_tree_map': { data: [{ id: 't1', plantedById: 'profile-1' }, { id: 't2', plantedById: 'profile-2' }] },
    })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client as never)

    const result = await treeMap(createTestEvent())

    expect(supabase.callFor('rpc:member_tree_map').payload).toEqual({ p_viewer: 'profile-1' })
    expect(result.map(t => t.isMine)).toEqual([true, false])
  })
})
