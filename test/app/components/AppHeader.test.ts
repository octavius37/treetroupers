import type { NavPageNode } from '~/utils/navTree'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import AppHeader from '~/components/AppHeader.vue'

const user = ref<Record<string, unknown> | null>(null)
const isAdmin = ref(false)
const navPages = ref<NavPageNode[]>([])
const signOut = vi.fn()

mockNuxtImport('useSupabaseUser', () => () => user)
mockNuxtImport('useSupabaseClient', () => () => ({ auth: { signOut } }))
mockNuxtImport('useUserRole', () => () => ({ isAdmin: computed(() => isAdmin.value) }))
mockNuxtImport('useNavPages', () => () => ({ data: navPages }))

function node(title: string, slug: string, children: NavPageNode[] = []): NavPageNode {
  return { id: slug, title, to: `/${slug}`, children }
}

async function render() {
  const wrapper = await mountSuspended(AppHeader)
  return {
    wrapper,
    hrefs: () => wrapper.findAll('a').map(a => a.attributes('href')),
  }
}

describe('AppHeader', () => {
  beforeEach(() => {
    user.value = null
    isAdmin.value = false
    navPages.value = []
    signOut.mockReset()
  })

  it('always renders the static links, independent of CMS content', async () => {
    const { hrefs } = await render()

    expect(hrefs()).toEqual(expect.arrayContaining([
      '/',
      '/climate-change',
      '/what-can-i-do',
      '/who-we-are',
      '/contact',
    ]))
  })

  it('appends CMS-managed nav pages', async () => {
    navPages.value = [node('Resources', 'resources')]

    const { hrefs } = await render()

    expect(hrefs()).toContain('/resources')
  })

  it('renders child pages as dropdown entries', async () => {
    navPages.value = [node('Resources', 'resources', [node('Guides', 'guides')])]

    const { wrapper, hrefs } = await render()

    expect(hrefs()).toContain('/guides')
    expect(wrapper.text()).toContain('Guides')
  })

  it('shows a login link and no logout to an anonymous visitor', async () => {
    user.value = null

    const { wrapper, hrefs } = await render()

    expect(hrefs()).toContain('/login')
    expect(wrapper.text()).not.toContain('Logout')
  })

  it('shows logout instead of login once signed in', async () => {
    user.value = { sub: 'auth-user-1' }

    const { wrapper, hrefs } = await render()

    expect(hrefs()).not.toContain('/login')
    expect(wrapper.text()).toContain('Logout')
  })

  it('hides the CMS link from a signed-in non-admin', async () => {
    user.value = { sub: 'auth-user-1' }
    isAdmin.value = false

    const { hrefs } = await render()

    expect(hrefs()).not.toContain('/cms')
  })

  it('shows the CMS link to an admin', async () => {
    user.value = { sub: 'auth-user-1' }
    isAdmin.value = true

    const { hrefs } = await render()

    expect(hrefs()).toContain('/cms')
  })

  it('hides the CMS link from an anonymous visitor even if isAdmin is somehow set', async () => {
    // isAdmin is cached in shared state; a stale value must not out-live logout.
    user.value = null
    isAdmin.value = true

    const { hrefs } = await render()

    expect(hrefs()).not.toContain('/cms')
  })

  it('signs the user out when logout is clicked', async () => {
    user.value = { sub: 'auth-user-1' }

    const { wrapper } = await render()
    const logout = wrapper.findAll('button').find(b => b.text() === 'Logout')
    await logout!.trigger('click')

    expect(signOut).toHaveBeenCalled()
  })

  it('always links to the dashboard', async () => {
    const { hrefs } = await render()

    expect(hrefs()).toContain('/dashboard')
  })
})
