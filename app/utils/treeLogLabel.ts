interface TreeLog {
  source: string
  quantity: number
  tree_species?: { common_name: string } | null
}

/** "Donated 3 trees", "Earned 1 tree", or the planted tree's species. */
export function treeLogLabel(tree: TreeLog): string {
  const trees = tree.quantity === 1 ? 'tree' : 'trees'
  if (tree.source === 'donated') { return `Donated ${tree.quantity} ${trees}` }
  if (tree.source === 'earned') { return `Earned ${tree.quantity} ${trees}` }
  return tree.tree_species?.common_name || 'Unknown species'
}
