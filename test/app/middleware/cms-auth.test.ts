import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import cmsAuthMiddleware from '~/middleware/cms-auth'

const user = ref<Record<string, unknown> | null>(null)
// mockNuxtImport factories are hoisted above module-scope consts, so anything a
// factory returns directly must be hoisted too.
const navigateTo = vi.hoisted(() => vi.fn((to: string) => to))
const fetchRole = vi.hoisted(() => vi.fn<() => Promise<string | null>>())

mockNuxtImport('useSupabaseUser', () => () => user)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useUserRole', () => () => ({ fetchRole }))

// Derived from the middleware rather than imported from vue-router: the repo
// resolves two copies of vue-router, whose RouteLocationNormalized types are
// structurally identical but nominally incompatible.
const route = { path: '/cms' } as Parameters<typeof cmsAuthMiddleware>[0]

describe('cms-auth middleware', () => {
  beforeEach(() => {
    user.value = { sub: 'auth-user-1' }
    navigateTo.mockClear()
    fetchRole.mockReset().mockResolvedValue('admin')
  })

  it('redirects an anonymous visitor to the login page', async () => {
    user.value = null

    await cmsAuthMiddleware(route, route)

    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(fetchRole).not.toHaveBeenCalled()
  })

  it('sends a logged-in non-admin back to their dashboard', async () => {
    fetchRole.mockResolvedValue('user')

    await cmsAuthMiddleware(route, route)

    expect(navigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('sends a user with no resolvable role back to their dashboard', async () => {
    // Fail closed: an unreadable profile must not be treated as an admin.
    fetchRole.mockResolvedValue(null)

    await cmsAuthMiddleware(route, route)

    expect(navigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('lets an admin through', async () => {
    fetchRole.mockResolvedValue('admin')

    const result = await cmsAuthMiddleware(route, route)

    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('resolves the role fresh on each navigation rather than trusting cached state', async () => {
    await cmsAuthMiddleware(route, route)

    expect(fetchRole).toHaveBeenCalledTimes(1)
  })
})
