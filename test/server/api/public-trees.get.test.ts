import { describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/public/trees.get'
import { createTestEvent } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

describe('GET /api/public/trees', () => {
  it('returns the map and totals from the SQL functions, which can\'t be cut off at 1000 rows', async () => {
    const supabase = createSupabaseMock({
      'rpc:tree_stats': { data: { trees: 11, treesThisMonth: 0, co2KgPerYear: 23, topPlanters: [] } },
      'rpc:public_tree_map': { data: [{ id: 't1', species: 'English Oak', status: 'growing', plantedAt: '2026-01-01', lat: 52.093, lng: 5.108 }] },
      'communities': { data: null, count: 3 },
    })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)

    const result = await handler(createTestEvent())

    expect(result.totals).toEqual({ trees: 11, communities: 3, co2KgPerYear: 23 })
    expect(result.trees).toHaveLength(1)
    // No top planters for an anonymous endpoint.
    expect(supabase.callFor('rpc:tree_stats').payload).toEqual({ p_top: 0 })
    expect(supabase.callsFor('trees')).toHaveLength(0)
  })
})
