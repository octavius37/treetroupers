interface TreeLog {
  source: string
  quantity: number
  tree_species?: { common_name: string } | null
}

/**
 * "Donated 3 trees", "Earned 1 tree (English Oak)" when the kind is known, or
 * the planted tree's species.
 */
export function treeLogLabel(tree: TreeLog): string {
  const trees = tree.quantity === 1 ? 'tree' : 'trees'
  const kind = tree.tree_species?.common_name ? ` (${tree.tree_species.common_name})` : ''
  if (tree.source === 'donated') { return `Donated ${tree.quantity} ${trees}${kind}` }
  if (tree.source === 'earned') { return `Earned ${tree.quantity} ${trees}${kind}` }
  return tree.tree_species?.common_name || 'Unknown species'
}
