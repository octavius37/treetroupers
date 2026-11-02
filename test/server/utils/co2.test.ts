import { describe, expect, it } from 'vitest'
import { co2KgPerYear } from '~~/shared/utils/co2'

describe('co2KgPerYear', () => {
  it('adds up the species average of each planted tree', () => {
    expect(co2KgPerYear([
      { source: 'planted', quantity: 1, tree_species: { avg_co2_kg_per_year: 22.5 } },
      { source: 'planted', quantity: 2, tree_species: { avg_co2_kg_per_year: 10 } },
    ])).toBe(43)
  })

  it('leaves out donated and earned trees, and trees with no species', () => {
    expect(co2KgPerYear([
      { source: 'donated', quantity: 10, tree_species: { avg_co2_kg_per_year: 20 } },
      { source: 'earned', quantity: 3, tree_species: null },
      { source: 'planted', quantity: 1, tree_species: null },
    ])).toBe(0)
  })
})
