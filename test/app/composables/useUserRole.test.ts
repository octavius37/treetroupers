import type { EffectScope } from 'vue'
import type { TableConfig } from '../../helpers/supabase-mock'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { createSupabaseMock } from '../../helpers/supabase-mock'

const authUserId = ref<string | null>(null)
let supabase = createSupabaseMock()

mockNuxtImport('useAuthUserId', () => () => authUserId)
mockNuxtImport('useSupabaseClient', () => () => supabase.client)

function withProfile(config: TableConfig) {
  supabase = createSupabaseMock({ profiles: config })
  return supabase
}

/**
 * useUserRole registers a `watch` on the auth user. In the app that watcher is
 * owned by the calling component's scope and dies with it; here it would
 * out-live the test and race the next one, so each test gets its own scope.
 */
let scope: EffectScope

function setup() {
  return scope.run(() => useUserRole())!
}

describe('useUserRole', () => {
  beforeEach(() => {
    scope = effectScope()
    authUserId.value = null
    supabase = createSupabaseMock()
    // The role is cached in shared useState, so it also outlives a single test.
    useState<string | null>('current-user-role').value = null
  })

  afterEach(() => {
    scope.stop()
  })

  it('reports null and queries nothing when nobody is logged in', async () => {
    const tracked = withProfile({ data: { role: 'admin' } })

    const { role, isAdmin, fetchRole } = setup()

    await expect(fetchRole()).resolves.toBeNull()
    expect(role.value).toBeNull()
    expect(isAdmin.value).toBe(false)
    expect(tracked.calls).toHaveLength(0)
  })

  it('looks the role up by auth_user_id', async () => {
    authUserId.value = 'auth-user-1'
    const tracked = withProfile({ data: { role: 'user' } })

    await setup().fetchRole()

    const [call] = tracked.callsFor('profiles')
    expect(call).toBeDefined()
    expect(call!.columns).toBe('role')
    expect(call!.filters).toEqual([{ method: 'eq', column: 'auth_user_id', value: 'auth-user-1' }])
  })

  it('sets isAdmin for an admin', async () => {
    authUserId.value = 'auth-user-1'
    withProfile({ data: { role: 'admin' } })

    const { role, isAdmin, fetchRole } = setup()
    await fetchRole()

    expect(role.value).toBe('admin')
    expect(isAdmin.value).toBe(true)
  })

  it('leaves isAdmin false for a regular user', async () => {
    authUserId.value = 'auth-user-1'
    withProfile({ data: { role: 'user' } })

    const { role, isAdmin, fetchRole } = setup()
    await fetchRole()

    expect(role.value).toBe('user')
    expect(isAdmin.value).toBe(false)
  })

  it('falls back to null when the profile has no row', async () => {
    authUserId.value = 'auth-user-1'
    withProfile({ data: null })

    const { role, isAdmin, fetchRole } = setup()

    await expect(fetchRole()).resolves.toBeNull()
    expect(role.value).toBeNull()
    expect(isAdmin.value).toBe(false)
  })

  it('shares one cached role across separate callers', async () => {
    // Middleware, the header and pages all call this; they must agree.
    authUserId.value = 'auth-user-1'
    withProfile({ data: { role: 'admin' } })

    await setup().fetchRole()

    expect(setup().isAdmin.value).toBe(true)
  })

  it('clears a cached role when the user logs out', async () => {
    authUserId.value = 'auth-user-1'
    withProfile({ data: { role: 'admin' } })
    const { role, fetchRole } = setup()
    await fetchRole()
    expect(role.value).toBe('admin')

    authUserId.value = null
    await fetchRole()

    // A stale 'admin' here would show the CMS link to the next visitor.
    expect(role.value).toBeNull()
  })

  it('refetches when the logged-in user changes', async () => {
    // The composable captures its Supabase client once, so this varies the
    // response in place rather than swapping the whole mock.
    const profiles = { data: { role: 'user' } }
    authUserId.value = 'auth-user-1'
    supabase = createSupabaseMock({ profiles })

    const { role, isAdmin } = setup()
    await vi.waitFor(() => expect(role.value).toBe('user'))

    profiles.data = { role: 'admin' }
    authUserId.value = 'auth-user-2'

    await vi.waitFor(() => expect(role.value).toBe('admin'))
    expect(isAdmin.value).toBe(true)
  })
})
