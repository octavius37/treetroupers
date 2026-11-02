import type { SupabaseClient } from '@supabase/supabase-js'

export const TREE_PHOTOS_BUCKET = 'tree-photos'

/**
 * Whether `url` is a file the user uploaded through /api/dashboard/tree-photo,
 * which stores under tree-photos/<auth user id>/. Stops a client attaching
 * someone else's photo, or any other URL, as proof.
 */
export function isOwnPhotoUrl(client: Pick<SupabaseClient, 'storage'>, uid: string, url: unknown): url is string {
  if (typeof url !== 'string' || !url || url.includes('..')) { return false }
  const ownFolder = client.storage.from(TREE_PHOTOS_BUCKET).getPublicUrl(`${uid}/`).data.publicUrl
  return url.startsWith(ownFolder)
}

/** The storage path of a tree-photos public URL, or null if it isn't one. */
export function treePhotoPath(url: string): string | null {
  const marker = `/object/public/${TREE_PHOTOS_BUCKET}/`
  const at = url.indexOf(marker)
  return at === -1 ? null : url.slice(at + marker.length)
}
