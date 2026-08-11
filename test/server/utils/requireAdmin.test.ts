import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdmin } from '~~/server/utils/requireAdmin'
import { captureError, createTestEvent } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole, serverSupabaseUser } from '../../mocks/supabase-server'

const ADMIN = { id: 'profile-admin', role: 'admin' }

function withProfile(result: { data?: unknown, error?: unknown }) {
  const supabase = createSupabaseMock({ profiles: result })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('requireAdmin', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.mocked(serverSupabaseUser).mockReset()
    vi.mocked(serverSupabaseServiceRole).mockReset()
    // spyOn returns the existing spy on repeat calls, so clear its history too.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleError.mockClear()
  })

  it('throws 401 when there is no authenticated user', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue(null)
    const supabase = withProfile({ data: ADMIN })

    const error = await captureError(() => requireAdmin(createTestEvent()))

    expect(error.statusCode).toBe(401)
    // The point of the early return: a missing user must not reach the database.
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 401 for a user object with neither `sub` nor `id`, without querying', async () => {
    // Guards the documented failure mode: querying a uuid column with `undefined`.
    vi.mocked(serverSupabaseUser).mockResolvedValue({})
    const supabase = withProfile({ data: ADMIN })

    const error = await captureError(() => requireAdmin(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it('looks the profile up by auth_user_id using the `sub` claim', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ sub: 'auth-user-1' })
    const supabase = withProfile({ data: ADMIN })

    await requireAdmin(createTestEvent())

    const call = supabase.callFor('profiles')
    expect(call.operation).toBe('select')
    expect(call.terminal).toBe('single')
    expect(call.filters).toEqual([
      { method: 'eq', column: 'auth_user_id', value: 'auth-user-1' },
    ])
  })

  it('falls back to the `id` field when there is no `sub` claim', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ id: 'auth-user-2' })
    const supabase = withProfile({ data: ADMIN })

    await requireAdmin(createTestEvent())

    expect(supabase.callFor('profiles').filters[0]!.value).toBe('auth-user-2')
  })

  it('throws 403 — not 500 — when the profile lookup errors, and logs it', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ sub: 'auth-user-1' })
    withProfile({ data: null, error: { message: 'connection reset' } })

    const error = await captureError(() => requireAdmin(createTestEvent()))

    // Internals must not leak to the caller, but ops still needs the detail.
    expect(error.statusCode).toBe(403)
    expect(error.message).toBe('Forbidden')
    expect(consoleError).toHaveBeenCalled()
  })

  it('throws 403 when the user has no profile row', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ sub: 'auth-user-1' })
    withProfile({ data: null })

    const error = await captureError(() => requireAdmin(createTestEvent()))

    expect(error.statusCode).toBe(403)
    expect(error.message).toBe('Forbidden')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('throws 403 for an authenticated non-admin', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ sub: 'auth-user-1' })
    withProfile({ data: { id: 'profile-1', role: 'user' } })

    const error = await captureError(() => requireAdmin(createTestEvent()))

    expect(error.statusCode).toBe(403)
    expect(error.message).toBe('Admin access required')
  })

  it('returns the user and profile for an admin', async () => {
    const user = { sub: 'auth-user-1' }
    vi.mocked(serverSupabaseUser).mockResolvedValue(user)
    withProfile({ data: ADMIN })

    await expect(requireAdmin(createTestEvent())).resolves.toEqual({ user, profile: ADMIN })
  })

  it('uses the service-role client, since RLS cannot see the caller here', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValue({ sub: 'auth-user-1' })
    withProfile({ data: ADMIN })
    const event = createTestEvent()

    await requireAdmin(event)

    expect(serverSupabaseServiceRole).toHaveBeenCalledWith(event)
  })
})
