interface BlogPost {
  id: string
  title: string
  slug: string
  createdAt: string
  excerpt: string
}

// Fetches the published posts filed under a collection page, e.g. the "Tree
// planting tips" blog listed at /tree-planting-tips.
export function useBlogPosts(collectionSlug: string) {
  return useFetch<BlogPost[]>(`/api/public/pages/${collectionSlug}/posts`)
}
