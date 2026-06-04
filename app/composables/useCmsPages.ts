interface CmsPage {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
}

// Shared CMS pages list, used by the CMS layout sidebar and the editor child
// routes (which call reload() after create/save/delete). useState keeps a single
// instance across all components.
export function useCmsPages() {
  const pages = useState<CmsPage[]>('cms-pages', () => [])
  const loading = useState<boolean>('cms-pages-loading', () => false)
  const loaded = useState<boolean>('cms-pages-loaded', () => false)

  async function reload() {
    loading.value = true
    try {
      pages.value = (await $fetch('/api/cms/pages')) as CmsPage[]
    }
    catch {
      pages.value = []
    }
    loading.value = false
    loaded.value = true
  }

  // Fetch once on first use
  async function ensureLoaded() {
    if (!loaded.value && !loading.value) {
      await reload()
    }
  }

  return { pages, loading, loaded, reload, ensureLoaded }
}

export type { CmsPage }
