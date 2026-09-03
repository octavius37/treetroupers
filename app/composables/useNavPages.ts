import type { NavPageNode, NavPageRow } from '~/utils/navTree'
import { buildNavTree } from '~/utils/navTree'

// Fetches published, nav-visible pages and builds a parent/child tree for the
// public site header. Shared (useAsyncData key) so the header renders it on
// every page without refetching.
export function useNavPages() {
  return useAsyncData<NavPageNode[]>('public-nav-pages', async () => {
    const rows = await $fetch<NavPageRow[]>('/api/public/nav')
    return buildNavTree(rows || [])
  }, { default: () => [] })
}
