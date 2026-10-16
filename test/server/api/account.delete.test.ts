import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/account.delete'
import { captureError, createTestEvent, setRequestBody } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

function withClient(tables: Record<string, TableConfig> = {}, files: Record<string, string[]> = {}) {
  const supabase = createSupabaseMock({ profiles: { data: { id: 'profile-1' } }, ...tables })
  const removed: string[][] = []
  const storage = {
    from: (bucket: string) => ({
      list: vi.fn(async () => ({ data: (files[bucket] ?? []).map(name => ({ name })), error: null })),
      remove: vi.fn(async (paths: string[]) => {
        removed.push(paths)
        return { error: null }
      }),
    }),
  }
  const deleteUser = vi.fn(async () => ({ error: null }))
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(
    Object.assign(supabase.client, { storage, auth: { admin: { deleteUser } } }),
  )
  return { ...supabase, removed, deleteUser }
}

describe('DELETE /api/dashboard/account', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    authUserId.mockReset().mockResolvedValue('auth-user-1')
    Object.assign(globalThis, { authUserId })
    setRequestBody({ confirm: 'DELETE' })
  })

  it('throws 401 without an authenticated user, before touching anything', async () => {
    authUserId.mockResolvedValue(null)
    const client = withClient()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(client.calls).toHaveLength(0)
    expect(client.deleteUser).not.toHaveBeenCalled()
  })

  it.each([[{ confirm: 'delete' }], [{}], [null]])('throws 400 without the typed confirmation %o', async (body) => {
    setRequestBody(body)
    const client = withClient()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(client.deleteUser).not.toHaveBeenCalled()
  })

  it('removes the user\'s uploaded files, strips their trees and deletes the auth user', async () => {
    const client = withClient({}, { 'tree-photos': ['a.jpg', 'b.jpg'] })

    await expect(handler(createTestEvent())).resolves.toEqual({ deleted: true })

    expect(client.removed).toEqual([['auth-user-1/a.jpg', 'auth-user-1/b.jpg']])
    const trees = client.callsFor('trees')
    expect(trees[0]).toMatchObject({ operation: 'delete' })
    expect(trees[0]!.filters).toContainEqual({ method: 'eq', column: 'review_status', value: 'pending' })
    expect(trees[1]).toMatchObject({ operation: 'update', payload: { photo_urls: [], notes: null } })
    expect(client.callFor('tree_updates')).toMatchObject({ operation: 'delete' })
    expect(client.deleteUser).toHaveBeenCalledWith('auth-user-1')
  })

  it('keeps the account when its data can\'t be cleaned up', async () => {
    const client = withClient({ trees: { data: null, error: { message: 'boom' } } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(client.deleteUser).not.toHaveBeenCalled()
  })
})
