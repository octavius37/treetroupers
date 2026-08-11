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
  for (const r of rows) {
    byId.set(r.id, { id: r.id, title: r.title, to: `/${r.slug}`, children: [] })
  }

  const roots: NavPageNode[] = []
  for (const r of rows) {
    const node = byId.get(r.id)!
    // Attach to parent if it exists in the visible set, otherwise treat as root
    // (covers a child whose parent is unpublished/hidden — it still shows top-level).
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id)!.children.push(node)
    }
    else {
      roots.push(node)
    }
  }
  return roots
}
