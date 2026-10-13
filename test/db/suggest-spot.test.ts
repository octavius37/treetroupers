import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import create from '~~/server/api/dashboard/planting-suggestions.post'
import remove from '~~/server/api/dashboard/planting-suggestions/[id].delete'
import { createTestUser, deleteTestUser, serviceClient } from '../helpers/local-supabase'
import { createTestEvent, setRequestBody, setRouterParams } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Suggests a spot through the real handler and checks the point it awards.
// Mirrors test/db/plant-tree.test.ts: only the auth lookup is mocked, so the
// planting_suggestions triggers and sync_total_points all run for real.

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

async function suggest(lat: number, lng: number) {
  setRequestBody({ lat, lng })
  return create(createTestEvent())
}

describe('points for suggesting a planting spot', () => {
  it('awards 1 point per suggestion', async () => {
    const before = await totalPoints()
    const suggestion = await suggest(52.3676, 4.9041)

    const { data: events } = await serviceClient
      .from('point_events')
      .select('action_type, points, reference_type')
      .eq('reference_id', suggestion.id)
    expect(events).toEqual([
      { action_type: 'suggest_spot', points: 1, reference_type: 'planting_suggestion' },
    ])
    expect(await totalPoints()).toBe(before + 1)
  })

  it('awards another point for a second suggestion', async () => {
    const before = await totalPoints()
    await suggest(52.09, 5.12)

    expect(await totalPoints()).toBe(before + 1)
  })

  it('takes the point back when the suggestion is deleted', async () => {
    // Otherwise suggest-then-remove, repeated, adds points with nothing left on
    // the map to show for them.
    const before = await totalPoints()
    const suggestion = await suggest(51.92, 4.48)
    setRouterParams({ id: suggestion.id })
    await remove(createTestEvent())

    const { data: events } = await serviceClient
      .from('point_events')
      .select('action_type, points')
      .eq('reference_id', suggestion.id)
      .order('points', { ascending: false })
    expect(events).toEqual([
      { action_type: 'suggest_spot', points: 1 },
      { action_type: 'suggest_spot', points: -1 },
    ])
    expect(await totalPoints()).toBe(before)
  })

  it('still lets an account with suggestions be deleted', async () => {
    // Deleting a profile cascades to its suggestions, which fires the reversal
    // trigger mid-delete. Whatever it finds, it must not block the delete.
    const other = await createTestUser()
    Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(other.authUser.id) })
    await suggest(53.22, 6.57)

    const { error } = await serviceClient.auth.admin.deleteUser(other.authUser.id)

    expect(error).toBeNull()
    const { data } = await serviceClient.from('profiles').select('id').eq('id', other.profile.id)
    expect(data).toEqual([])
  })
})
