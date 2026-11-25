import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/trees/[id]/updates.post'
import { captureError, createTestEvent, setRequestBody, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

function withTree(source: string) {
  const supabase = createSupabaseMock({
    profiles: { data: { id: 'profile-1', role: 'user' } },
    trees: { data: { id: 'tree-1', planted_by: 'profile-1', source } },
    tree_updates: { data: { id: 'update-1' } },
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client as never)
  return supabase
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  authUserId.mockReset().mockResolvedValue('auth-user-1')
  Object.assign(globalThis, { authUserId })
  setRouterParams({ id: 'tree-1' })
  setRequestBody({ content: 'First leaves are out' })
})

describe('POST /api/dashboard/trees/:id/updates', () => {
  it('posts an update on the planter\'s own planted tree', async () => {
    const supabase = withTree('planted')

    expect(await handler(createTestEvent())).toEqual({ id: 'update-1' })
    expect(supabase.callFor('tree_updates').payload).toMatchObject({ tree_id: 'tree-1', content: 'First leaves are out' })
  })

  it.each(['donated', 'earned'])('refuses an update on a %s tree, which the member didn\'t plant', async (source) => {
    const supabase = withTree(source)

    expect((await captureError(() => handler(createTestEvent()))).statusCode).toBe(400)
    expect(supabase.callsFor('tree_updates')).toHaveLength(0)
  })
})
