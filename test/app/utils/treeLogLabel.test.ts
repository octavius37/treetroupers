import { describe, expect, it } from 'vitest'
import { treeLogLabel } from '~/utils/treeLogLabel'

describe('treeLogLabel', () => {
  it.each([
    [{ source: 'donated', quantity: 1 }, 'Donated 1 tree'],
    [{ source: 'donated', quantity: 10 }, 'Donated 10 trees'],
    [{ source: 'earned', quantity: 3 }, 'Earned 3 trees'],
    [{ source: 'planted', quantity: 1, tree_species: { common_name: 'English Oak' } }, 'English Oak'],
    [{ source: 'planted', quantity: 1, tree_species: null }, 'Unknown species'],
  ])('labels %o as %s', (tree, label) => {
    expect(treeLogLabel(tree)).toBe(label)
  })
})
