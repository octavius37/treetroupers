interface TreeForCo2 {
  source: string
  quantity: number
  tree_species: { avg_co2_kg_per_year: number | null } | null
}

/**
 * Roughly how much CO₂ a set of trees absorbs a year, from each species'
 * average. Only planted trees with a known species count: donated and earned
 * trees have no species, so there is nothing to base an estimate on.
 */
export function co2KgPerYear(trees: TreeForCo2[]): number {
  let total = 0
  for (const tree of trees) {
    if (tree.source !== 'planted') { continue }
    total += Number(tree.tree_species?.avg_co2_kg_per_year ?? 0) * tree.quantity
  }
  return Math.round(total)
}
