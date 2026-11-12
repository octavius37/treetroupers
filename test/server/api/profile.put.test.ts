import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/profile.put'
import { captureError, createTestEvent, setRequestBody } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

function withProfiles() {
  const supabase = createSupabaseMock({ profiles: { data: { id: 'profile-1' } } })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client as never)
  return supabase
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  authUserId.mockReset().mockResolvedValue('auth-user-1')
  Object.assign(globalThis, { authUserId })
})

describe('PUT /api/dashboard/profile', () => {
  it('saves a trimmed name and bio for the caller only', async () => {
    const supabase = withProfiles()
    setRequestBody({ display_name: '  Ada  ', bio: ' Oak fan ' })

    await handler(createTestEvent())

    const call = supabase.callFor('profiles')
    expect(call.payload).toEqual({ display_name: 'Ada', bio: 'Oak fan' })
    expect(call.filters).toEqual([{ method: 'eq', column: 'auth_user_id', value: 'auth-user-1' }])
  })

  it('clears a field left empty', async () => {
    const supabase = withProfiles()
    setRequestBody({ display_name: 'Ada', bio: '   ' })

    await handler(createTestEvent())

    expect(supabase.callFor('profiles').payload).toEqual({ display_name: 'Ada', bio: null })
  })

  it.each([
    ['a name over 50 characters', { display_name: 'x'.repeat(51), bio: '' }],
    ['a bio over 500 characters', { display_name: 'Ada', bio: 'x'.repeat(501) }],
    ['a name that isn\'t text', { display_name: ['Ada'], bio: '' }],
  ])('throws 400 for %s, before touching the database', async (_case, body) => {
    const supabase = withProfiles()
    setRequestBody(body)

    expect((await captureError(() => handler(createTestEvent()))).statusCode).toBe(400)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 401 without a user', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withProfiles()

    expect((await captureError(() => handler(createTestEvent()))).statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })
})
