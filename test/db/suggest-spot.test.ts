import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import create from '~~/server/api/dashboard/planting-suggestions.post'
import { createTestUser, deleteTestUser, serviceClient } from '../helpers/local-supabase'
import { createTestEvent, setRequestBody } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Suggests a spot through the real handler and checks the point it awards.
// Mirrors test/db/plant-tree.test.ts: only the auth lookup is mocked, so the
// on_planting_suggestion_created trigger and sync_total_points both run for real.

let authUser: User
let profile: Tables<'profiles'>

beforeAll(async () => {
  ;({ authUser, profile } = await createTestUser())
})

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(serviceClient as never)
  Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(authUser.id) })
})

afterAll(async () => {
  if (profile) { await deleteTestUser(authUser.id, profile.id) }
})

async function totalPoints() {
  const { data } = await serviceClient.from('profiles').select('total_points').eq('id', profile.id).single()
  return data!.total_points
}

describe('points for suggesting a planting spot', () => {
  it('awards 1 point per suggestion', async () => {
    setRequestBody({ lat: 52.3676, lng: 4.9041, notes: 'Empty verge' })
    const suggestion = await create(createTestEvent())

    const { data: events } = await serviceClient
      .from('point_events')
      .select('action_type, points, reference_id, reference_type')
      .eq('profile_id', profile.id)
    expect(events).toEqual([
      { action_type: 'suggest_spot', points: 1, reference_id: suggestion.id, reference_type: 'planting_suggestion' },
    ])
    expect(await totalPoints()).toBe(1)
  })

  it('awards another point for a second suggestion', async () => {
    setRequestBody({ lat: 52.09, lng: 5.12 })
    await create(createTestEvent())

    expect(await totalPoints()).toBe(2)
  })
})
