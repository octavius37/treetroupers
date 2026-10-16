import { describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/public/trees.get'
import { createTestEvent } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

describe('GET /api/public/trees', () => {
  it('lists only approved trees, planted ones on the map, at about 100 m precision and without names', async () => {
    const supabase = createSupabaseMock({
      trees: { data: [
        { id: 't1', source: 'planted', quantity: 1, status: 'growing', planted_at: '2026-01-01', lat: 52.093_456, lng: 5.108_049, tree_species: { common_name: 'English Oak', avg_co2_kg_per_year: 22.5 } },
        { id: 't2', source: 'donated', quantity: 10, status: 'planted', planted_at: '2026-01-02', lat: null, lng: null, tree_species: null },
      ] },
      communities: { data: null, count: 3 },
    })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)

    const result = await handler(createTestEvent())

    expect(supabase.callFor('trees').filters).toEqual([{ method: 'eq', column: 'review_status', value: 'approved' }])
    expect(result.totals).toEqual({ trees: 11, communities: 3, co2KgPerYear: 23 })
    expect(result.trees).toEqual([
      { id: 't1', species: 'English Oak', status: 'growing', plantedAt: '2026-01-01', lat: 52.093, lng: 5.108 },
    ])
    expect(supabase.callFor('trees').columns).not.toMatch(/profiles|planted_by|photo|notes/)
  })
})
