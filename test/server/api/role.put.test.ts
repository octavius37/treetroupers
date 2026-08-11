import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/cms/users/[id]/role.put'
import { captureError, createTestEvent, setRequestBody, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const ACTING_ADMIN = { id: 'profile-admin', role: 'admin' }

const requireAdmin = vi.fn()

function withProfiles(config: TableConfig = { data: { id: 'profile-target', role: 'admin' } }) {
  const supabase = createSupabaseMock({ profiles: config })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('PUT /api/cms/users/:id/role', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    requireAdmin.mockReset().mockResolvedValue({ user: { sub: 'auth-1' }, profile: ACTING_ADMIN })
    // Nitro auto-imports this from server/utils; it has its own unit tests.
    Object.assign(globalThis, { requireAdmin })
    setRouterParams({ id: 'profile-target' })
    setRequestBody({ role: 'admin' })
  })

  it('requires an admin before doing anything else', async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    const supabase = withProfiles()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(403)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 400 when the id is missing from the route', async () => {
    setRouterParams({})
    withProfiles()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Missing user id')
  })

  it.each([
    ['an unknown role', { role: 'superadmin' }],
    ['an empty role', { role: '' }],
    ['no role at all', {}],
    ['a null body', null],
  ])('throws 400 for %s', async (_label, body) => {
    setRequestBody(body)
    const supabase = withProfiles()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('role must be "admin" or "user"')
    expect(supabase.calls).toHaveLength(0)
  })

  it('refuses to let an admin demote themselves', async () => {
    // Guards against locking every admin out of the CMS.
    setRouterParams({ id: ACTING_ADMIN.id })
    setRequestBody({ role: 'user' })
    const supabase = withProfiles()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(error.message).toContain('cannot remove your own admin role')
    expect(supabase.calls).toHaveLength(0)
  })

  it('lets an admin re-assert their own admin role', async () => {
    // The guard is about demotion specifically, not about self-edits.
    setRouterParams({ id: ACTING_ADMIN.id })
    setRequestBody({ role: 'admin' })
    withProfiles()

    await expect(handler(createTestEvent())).resolves.toBeTruthy()
  })

  it('lets an admin demote a different user', async () => {
    setRouterParams({ id: 'profile-target' })
    setRequestBody({ role: 'user' })
    const supabase = withProfiles({ data: { id: 'profile-target', role: 'user' } })

    const result = await handler(createTestEvent())

    expect(result).toEqual({ id: 'profile-target', role: 'user' })
    const call = supabase.callFor('profiles')
    expect(call.operation).toBe('update')
    expect(call.payload).toEqual({ role: 'user' })
    expect(call.filters).toEqual([{ method: 'eq', column: 'id', value: 'profile-target' }])
  })

  it('promotes a user to admin', async () => {
    setRouterParams({ id: 'profile-target' })
    setRequestBody({ role: 'admin' })
    const supabase = withProfiles({ data: { id: 'profile-target', role: 'admin' } })

    await handler(createTestEvent())

    expect(supabase.callFor('profiles').payload).toEqual({ role: 'admin' })
  })

  it('throws 500 when the update fails', async () => {
    withProfiles({ data: null, error: { message: 'update failed' } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('update failed')
  })
})
