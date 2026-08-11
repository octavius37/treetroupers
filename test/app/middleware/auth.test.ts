import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import authMiddleware from '~/middleware/auth'

const user = ref<Record<string, unknown> | null>(null)
// mockNuxtImport factories are hoisted above module-scope consts, and this one
// returns the mock itself rather than closing over it lazily — so it has to be
// hoisted too.
const navigateTo = vi.hoisted(() => vi.fn((to: string) => to))

mockNuxtImport('useSupabaseUser', () => () => user)
mockNuxtImport('navigateTo', () => navigateTo)

// Derived from the middleware rather than imported from vue-router: the repo
// resolves two copies of vue-router, whose RouteLocationNormalized types are
// structurally identical but nominally incompatible.
const route = { path: '/dashboard' } as Parameters<typeof authMiddleware>[0]

describe('auth middleware', () => {
  beforeEach(() => {
    user.value = null
    navigateTo.mockClear()
  })

  it('redirects an anonymous visitor to the login page', async () => {
    user.value = null

    await authMiddleware(route, route)

    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  it('lets an authenticated user through', async () => {
    user.value = { sub: 'auth-user-1' }

    const result = await authMiddleware(route, route)

    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
