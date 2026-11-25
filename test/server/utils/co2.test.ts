import { describe, expect, it } from 'vitest'
import { co2KgPerYear, co2PerTreeKg, DEFAULT_CO2_KG_PER_YEAR } from '~~/shared/utils/co2'

describe('co2KgPerYear', () => {
  it('adds up the species average of each tree, by quantity', () => {
    expect(co2KgPerYear([
      { quantity: 1, tree_species: { avg_co2_kg_per_year: 22.5 } },
      { quantity: 2, tree_species: { avg_co2_kg_per_year: 10 } },
    ])).toBe(43)
  })

  it('counts donated and earned trees too, at the average when the species is unknown', () => {
    expect(co2KgPerYear([
      { quantity: 10, tree_species: { avg_co2_kg_per_year: 20 } },
      { quantity: 3, tree_species: null },
      { quantity: 1, tree_species: { avg_co2_kg_per_year: null } },
    ])).toBe(200 + 4 * DEFAULT_CO2_KG_PER_YEAR)
  })
})

describe('co2PerTreeKg', () => {
  it('uses the species figure, or 22 kg for an unknown species', () => {
    expect(co2PerTreeKg({ avg_co2_kg_per_year: 15 })).toBe(15)
    expect(co2PerTreeKg(null)).toBe(22)
  })
})
