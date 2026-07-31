interface PublicPage {
  id: string
  title: string
  slug: string
  html: string
}

// Fetches a published CMS page by slug for public rendering. Shared by the
// homepage (fixed slug) and the catch-all [slug].vue route (reactive slug,
// so client-side navigation between two CMS pages refetches correctly).
export function usePublicPage(slug: MaybeRefOrGetter<string>) {
  return useFetch<PublicPage>(() => `/api/public/pages/${toValue(slug)}`)
}
