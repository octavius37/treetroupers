import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import leaderboard from '~~/server/api/dashboard/leaderboard.get'
import publicStats from '~~/server/api/public/stats.get'
import publicTrees from '~~/server/api/public/trees.get'
import { createTestUser, deleteTestUser, serviceClient } from '../helpers/local-supabase'
import { createTestEvent, setQuery } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Totals are summed in SQL. PostgREST cuts any row list off at max_rows (1000)
// without an error, so totals added up from fetched rows would silently stop
// growing; these log more than that.

const MANY = 1100

let user: { authUser: User, profile: Tables<'profiles'> }

beforeAll(async () => {
  user = await createTestUser()
  const rows = Array.from({ length: MANY }, (_, i) => ({
    planted_by: user.profile.id,
    location: `SRID=4326;POINT(${5 + i / 10_000} 52.09)`,
    photo_urls: ['https://example.com/proof.jpg'],
    review_status: 'approved',
  }))
  const { error } = await serviceClient.from('trees').insert(rows)
  if (error) { throw error }
  // And one donation of 50 trees.
  await serviceClient.from('trees').insert({
    planted_by: user.profile.id,
    source: 'donated',
    quantity: 50,
    photo_urls: ['https://example.com/receipt.jpg'],
    review_status: 'approved',
  })
}, 60_000)

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(serviceClient as never)
  Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(user.authUser.id) })
  setQuery({})
})

afterAll(async () => {
  if (user?.profile) { await deleteTestUser(user.authUser.id, user.profile.id) }
}, 60_000)

describe('totals beyond 1000 trees', () => {
  it('puts every planted tree on the public map, and counts trees the same as the homepage', async () => {
    const map = await publicTrees(createTestEvent())
    const stats = await publicStats(createTestEvent())

    expect(map.trees.length).toBeGreaterThan(MANY)
    // A tree is counted by quantity everywhere: the donation counts as 50.
    expect(map.totals.trees).toBeGreaterThanOrEqual(MANY + 50)
    expect(stats.trees).toBe(map.totals.trees)
  })

  it('pays and ranks every point on the leaderboard', async () => {
    const { me } = await leaderboard(createTestEvent())

    // 20 per planted tree, 50 for the first, 5 per donated tree.
    expect(me?.points).toBe(MANY * 20 + 50 + 50 * 5)
    expect(me?.rank).toBe(1)
  })
})
