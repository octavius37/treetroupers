/**
 * CO₂ a typical mature tree absorbs in a year, used for any tree whose species
 * isn't known (most donated and earned trees). 22 kg is the figure commonly
 * quoted for an average mature tree, and close to the mean of the species
 * table (about 23 kg). Mirrored in the tree_stats SQL function.
 */
export const DEFAULT_CO2_KG_PER_YEAR = 22

interface TreeForCo2 {
  quantity: number
  tree_species: { avg_co2_kg_per_year: number | null } | null
}

/** A year's CO₂ for one tree of this species, or of an average tree. */
export function co2PerTreeKg(species: { avg_co2_kg_per_year: number | null } | null): number {
  return Number(species?.avg_co2_kg_per_year ?? DEFAULT_CO2_KG_PER_YEAR)
}

/**
 * Roughly how much CO₂ a set of tree logs absorbs a year once grown: every
 * planted, donated or earned tree counts, by quantity, at its species' average
 * or, when the species isn't known, at DEFAULT_CO2_KG_PER_YEAR.
 */
export function co2KgPerYear(trees: TreeForCo2[]): number {
  let total = 0
  for (const tree of trees) {
    total += co2PerTreeKg(tree.tree_species) * tree.quantity
  }
  return Math.round(total)
}
