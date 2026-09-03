import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authUserId } from '~~/server/utils/authUserId'
import { createTestEvent } from '../../helpers/nitro'
import { serverSupabaseUser } from '../../mocks/supabase-server'

describe('authUserId', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseUser).mockReset()
  })

  it('returns the `sub` claim, which is where the decoded JWT keeps the user id', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ sub: 'auth-user-1' })

    await expect(authUserId(createTestEvent())).resolves.toBe('auth-user-1')
  })

  it('falls back to `id` so a plain user object still resolves', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'auth-user-2' })

    await expect(authUserId(createTestEvent())).resolves.toBe('auth-user-2')
  })

  it('prefers `sub` when both claims are present', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ sub: 'from-sub', id: 'from-id' })

    await expect(authUserId(createTestEvent())).resolves.toBe('from-sub')
  })

  it('returns null when there is no authenticated user', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue(null)

    await expect(authUserId(createTestEvent())).resolves.toBeNull()
  })

  it('returns null — never undefined — for a user object carrying neither claim', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({})

    // Callers branch on `if (!uid)`, but downstream code interpolates the result
    // into a uuid filter. null is the contract; undefined would query with
    // `auth_user_id=undefined`.
    await expect(authUserId(createTestEvent())).resolves.toBeNull()
  })
})
