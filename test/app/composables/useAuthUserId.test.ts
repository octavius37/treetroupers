import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const user = ref<Record<string, unknown> | null>(null)

mockNuxtImport('useSupabaseUser', () => () => user)

describe('useAuthUserId', () => {
  beforeEach(() => {
    user.value = null
  })

  it('exposes the `sub` claim, which is where the decoded JWT keeps the user id', () => {
    user.value = { sub: 'auth-user-1', email: 'member@example.com' }

    expect(useAuthUserId().value).toBe('auth-user-1')
  })

  it('is null when nobody is logged in', () => {
    user.value = null

    expect(useAuthUserId().value).toBeNull()
  })

  it('is null — never undefined — for a user object with no `sub`', () => {
    user.value = { email: 'member@example.com' }

    expect(useAuthUserId().value).toBeNull()
  })

  it('tracks the user reactively, so a login updates every consumer', async () => {
    const authUserId = useAuthUserId()
    expect(authUserId.value).toBeNull()

    user.value = { sub: 'auth-user-2' }
    await vi.waitFor(() => expect(authUserId.value).toBe('auth-user-2'))
  })
})
