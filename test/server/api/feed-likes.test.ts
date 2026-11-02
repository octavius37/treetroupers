import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import unlike from '~~/server/api/dashboard/feed/posts/[id]/like.delete'
import like from '~~/server/api/dashboard/feed/posts/[id]/like.post'
import { captureError, createTestEvent, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

function withTables(tables: Record<string, TableConfig> = {}) {
  const supabase = createSupabaseMock({
    profiles: { data: { id: 'profile-1' } },
    post_likes: { data: null },
    ...tables,
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  authUserId.mockReset().mockResolvedValue('auth-user-1')
  Object.assign(globalThis, { authUserId })
  setRouterParams({ id: 'post-1' })
})

describe.each([
  ['POST', like],
  ['DELETE', unlike],
])('%s /api/dashboard/feed/posts/:id/like', (_method, handler) => {
  it('throws 401 without an authenticated user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withTables()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 400 without a post id', async () => {
    setRouterParams({})
    const supabase = withTables()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 404 when the user has no profile', async () => {
    const supabase = withTables({ profiles: { data: null } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(404)
    expect(supabase.callsFor('post_likes')).toHaveLength(0)
  })
})

describe('POST /api/dashboard/feed/posts/:id/like', () => {
  it('likes the post as the caller\'s profile', async () => {
    const supabase = withTables()

    await expect(like(createTestEvent())).resolves.toEqual({ liked: true })

    const call = supabase.callFor('post_likes')
    expect(call.operation).toBe('insert')
    expect(call.payload).toEqual({ post_id: 'post-1', profile_id: 'profile-1' })
  })

  it('throws 404 when the post does not exist', async () => {
    withTables({ post_likes: { data: null, error: { code: '23503', message: 'violates foreign key constraint' } } })

    const error = await captureError(() => like(createTestEvent()))

    expect(error.statusCode).toBe(404)
  })
})

describe('DELETE /api/dashboard/feed/posts/:id/like', () => {
  it('removes only the caller\'s own like', async () => {
    const supabase = withTables()

    await expect(unlike(createTestEvent())).resolves.toEqual({ liked: false })

    const call = supabase.callFor('post_likes')
    expect(call.operation).toBe('delete')
    expect(call.filters).toEqual([
      { method: 'eq', column: 'post_id', value: 'post-1' },
      { method: 'eq', column: 'profile_id', value: 'profile-1' },
    ])
  })
})
