import type { NavPageRow } from '~/utils/navTree'
import { describe, expect, it } from 'vitest'
import { buildNavTree } from '~/utils/navTree'

function row(id: string, slug: string, parentId: string | null = null, navOrder = 0): NavPageRow {
  return { id, title: slug.replace(/-/g, ' '), slug, parent_id: parentId, nav_order: navOrder }
}

describe('buildNavTree', () => {
  it('returns an empty array for no rows', () => {
    expect(buildNavTree([])).toEqual([])
  })

  it('maps a flat list to roots with a leading-slash path', () => {
    const tree = buildNavTree([row('1', 'about'), row('2', 'contact')])

    expect(tree).toEqual([
      { id: '1', title: 'about', to: '/about', children: [] },
      { id: '2', title: 'contact', to: '/contact', children: [] },
    ])
  })

  it('nests children under their parent', () => {
    const tree = buildNavTree([
      row('parent', 'resources'),
      row('child-a', 'guides', 'parent'),
      row('child-b', 'faq', 'parent'),
    ])

    expect(tree).toHaveLength(1)
    expect(tree[0]!.to).toBe('/resources')
    expect(tree[0]!.children.map(c => c.to)).toEqual(['/guides', '/faq'])
  })

  it('promotes a child to root when its parent is not in the visible set', () => {
    // The API only returns published, nav-visible pages. A child whose parent was
    // unpublished must still appear in the header rather than vanish.
    const tree = buildNavTree([row('child', 'guides', 'unpublished-parent')])

    expect(tree.map(n => n.to)).toEqual(['/guides'])
    expect(tree[0]!.children).toEqual([])
  })

  it('preserves the order the rows arrived in', () => {
    // Ordering is the API's job (nav_order); the tree builder must not re-sort.
    const tree = buildNavTree([row('1', 'zebra', null, 99), row('2', 'apple', null, 1)])

    expect(tree.map(n => n.to)).toEqual(['/zebra', '/apple'])
  })

  it('nests grandchildren, so depth is not capped at two levels', () => {
    const tree = buildNavTree([
      row('a', 'top'),
      row('b', 'middle', 'a'),
      row('c', 'bottom', 'b'),
    ])

    expect(tree[0]!.children[0]!.children.map(n => n.to)).toEqual(['/bottom'])
  })
})
