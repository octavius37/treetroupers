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
  // A failed fetch is not the same as "there are zero pages" — track it
  // separately so the UI doesn't tell the user their pages are gone.
  const loadError = useState<boolean>('cms-pages-load-error', () => false)

  async function reload() {
    loading.value = true
    loadError.value = false
    try {
      pages.value = (await $fetch('/api/cms/pages')) as CmsPage[]
    }
    catch {
      loadError.value = true
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

  return { pages, loading, loaded, loadError, reload, ensureLoaded }
}

export type { CmsPage }
