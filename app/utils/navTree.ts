export interface NavPageRow {
  id: string
  title: string
  slug: string
  parent_id: string | null
  nav_order: number
}

export interface NavPageNode {
  id: string
  title: string
  to: string
  children: NavPageNode[]
}

/**
 * Turns a flat list of nav-visible pages into a parent/child tree for the public
 * header. Rows arrive already ordered by the API, so ordering is preserved
 * rather than re-sorted here.
 */
export function buildNavTree(rows: NavPageRow[]): NavPageNode[] {
  const byId = new Map<string, NavPageNode>()
  const parentOf = new Map<string, string | null>()
  for (const r of rows) {
    byId.set(r.id, { id: r.id, title: r.title, to: `/${r.slug}`, children: [] })
    parentOf.set(r.id, r.parent_id)
  }

  /**
   * True when walking up from `id` revisits a page — i.e. `id` sits in a parent
   * cycle. Such a page would be nested inside its own subtree and never reach
   * `roots`, disappearing from the header with no error anywhere. The API rejects
   * cycles, but seeds, migrations and direct database edits can still produce
   * one, and losing a page from the nav is worse than showing it flat.
   */
  function inParentCycle(id: string) {
    const seen = new Set<string>()
    let cursor: string | null | undefined = id
    while (cursor) {
      if (seen.has(cursor)) {
        return true
      }
      seen.add(cursor)
      cursor = parentOf.get(cursor)
    }
    return false
  }

  const roots: NavPageNode[] = []
  for (const r of rows) {
    const node = byId.get(r.id)!
    // Attach to parent if it exists in the visible set, otherwise treat as root
    // (covers a child whose parent is unpublished/hidden — it still shows top-level).
    if (r.parent_id && byId.has(r.parent_id) && !inParentCycle(r.id)) {
      byId.get(r.parent_id)!.children.push(node)
    }
    else {
      roots.push(node)
    }
  }
  return roots
}
