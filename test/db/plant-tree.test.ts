import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/trees.post'
import { anonClient, createTestUser, deleteTestUser, serviceClient, signedInClient } from '../helpers/local-supabase'
import { createTestEvent, setRequestBody } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Plants a tree through the real handler and checks what lands in Postgres.
// Unlike test/server/api/trees.post.test.ts, only the auth lookup is mocked: the
// insert goes through PostgREST into Postgres, so column defaults, constraints,
// the generated lat/lng columns and the new-user trigger are all real. The
// handler uses the service role, so RLS is exercised only by the anon reads.

let authUser: User
let profile: Tables<'profiles'>
// A second planter, for the cross-profile and pre-existing-tree cases.
let other: { authUser: User, profile: Tables<'profiles'> }
let speciesId: string
let firstTreeId: string

beforeAll(async () => {
  ;({ authUser, profile } = await createTestUser())
  other = await createTestUser()

  // Own species rather than a seeded one, so the test doesn't depend on seed.sql.
  const { data, error } = await serviceClient
    .from('tree_species')
    .insert({ common_name: 'Test Oak', scientific_name: `Quercus testii ${randomUUID()}` })
    .select('id')
    .single()
  if (error) { throw error }
  speciesId = data.id
})

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(serviceClient as never)
  Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(authUser.id) })
})

afterAll(async () => {
  if (profile) { await deleteTestUser(authUser.id, profile.id) }
  if (other) { await deleteTestUser(other.authUser.id, other.profile.id) }
  if (speciesId) {
    const { error } = await serviceClient.from('tree_species').delete().eq('id', speciesId)
    if (error) { throw error }
  }
})

describe('planting a tree', () => {
  it('gives a new sign-up a profile with zero points', () => {
    expect(profile.auth_user_id).toBe(authUser.id)
    expect(profile.total_points).toBe(0)
  })

  it('stores the tree against the planter\'s profile, with its location', async () => {
    setRequestBody({
      species_id: speciesId,
      lat: 52.3676,
      lng: 4.9041,
      notes: 'Planted by the canal',
      planted_at: '2026-08-11',
    })

    const returned = await handler(createTestEvent())
    firstTreeId = returned.id

    const { data: tree, error } = await serviceClient
      .from('trees')
      .select('*')
      .eq('id', returned.id)
      .single()
    expect(error).toBeNull()
    expect(tree).toMatchObject({
      planted_by: profile.id,
      species_id: speciesId,
      source: 'planted',
      status: 'planted',
      quantity: 1,
      notes: 'Planted by the canal',
    })
    // lat/lng are generated from the PostGIS `location`, so matching values
    // prove the handler wrote the point in (lng lat) order.
    expect(tree!.lat).toBeCloseTo(52.3676, 6)
    expect(tree!.lng).toBeCloseTo(4.9041, 6)
    expect(tree!.planted_at.startsWith('2026-08-11')).toBe(true)
  })

  it('makes the tree publicly readable and counts it on the leaderboard', async () => {
    const anon = anonClient()

    const { data: trees } = await anon.from('trees').select('id').eq('planted_by', profile.id)
    expect(trees).toHaveLength(1)

    const { data: row } = await anon
      .from('leaderboard')
      .select('trees_planted')
      .eq('id', profile.id)
      .single()
    expect(row?.trees_planted).toBe(1)
  })

  it('rejects a planted tree with no location', async () => {
    setRequestBody({ species_id: speciesId, planted_at: '2026-08-11' })

    await expect(handler(createTestEvent())).rejects.toMatchObject({ statusCode: 500 })

    const { count } = await serviceClient
      .from('trees')
      .select('id', { count: 'exact', head: true })
      .eq('planted_by', profile.id)
    expect(count).toBe(1)
  })
})

// Runs after the block above, so the profile already has exactly one tree.
describe('points for planting', () => {
  async function totalPoints(profileId = profile.id) {
    const { data } = await serviceClient.from('profiles').select('total_points').eq('id', profileId).single()
    return data!.total_points
  }

  async function events(profileId = profile.id) {
    const { data } = await serviceClient
      .from('point_events')
      .select('action_type, points, reference_id, reference_type')
      .eq('profile_id', profileId)
      .order('points')
    return data!
  }

  it('awards 20 points plus a 50-point first-tree bonus for the first tree', async () => {
    expect(await events()).toEqual([
      { action_type: 'plant_tree', points: 20, reference_id: firstTreeId, reference_type: 'tree' },
      { action_type: 'first_tree', points: 50, reference_id: firstTreeId, reference_type: 'tree' },
    ])
    expect(await totalPoints()).toBe(70)
  })

  it('awards 20 points for a later tree, with no second bonus', async () => {
    setRequestBody({ species_id: speciesId, lat: 52.09, lng: 5.12, planted_at: '2026-08-12' })

    await handler(createTestEvent())

    expect(await totalPoints()).toBe(90)
    expect((await events()).filter(e => e.action_type === 'first_tree')).toHaveLength(1)
  })

  it('awards nothing for donated or earned trees', async () => {
    setRequestBody({ source: 'donated', quantity: 10, donation_project: 'Test project', planted_at: '2026-08-12' })
    await handler(createTestEvent())
    setRequestBody({ source: 'earned', quantity: 3, earned_activity: 'Test activity', planted_at: '2026-08-12' })
    await handler(createTestEvent())

    expect(await totalPoints()).toBe(90)
  })

  // The trigger has to write point_events, which has no insert policy. This is
  // the path that fails if the trigger function stops being SECURITY DEFINER.
  it('awards points when the user inserts a tree directly, under RLS', async () => {
    const client = await signedInClient(authUser.email!)

    const { error } = await client.from('trees').insert({
      planted_by: profile.id,
      location: 'SRID=4326;POINT(5.12 52.09)',
    })

    expect(error).toBeNull()
    expect(await totalPoints()).toBe(110)
  })

  // Without an ownership check on insert, a signed-in user could log trees, and
  // so points, against anyone's profile.
  it('refuses a direct insert that credits another profile', async () => {
    const client = await signedInClient(authUser.email!)

    const { error } = await client.from('trees').insert({
      planted_by: other.profile.id,
      location: 'SRID=4326;POINT(5.12 52.09)',
    })

    expect(error?.code).toBe('42501') // insufficient_privilege: RLS rejected the row
    expect(await totalPoints(other.profile.id)).toBe(0)
  })

  // Row triggers fire after the whole statement, so each row of a multi-row
  // insert sees the others. seed.sql inserts trees this way.
  it('awards exactly one first-tree bonus when first trees arrive in one insert', async () => {
    const { data: trees, error } = await serviceClient
      .from('trees')
      .insert([
        { planted_by: other.profile.id, location: 'SRID=4326;POINT(5.12 52.09)' },
        { planted_by: other.profile.id, location: 'SRID=4326;POINT(5.13 52.10)' },
      ])
      .select('id')
    expect(error).toBeNull()

    const awarded = await events(other.profile.id)
    expect(awarded.filter(e => e.action_type === 'plant_tree')).toHaveLength(2)
    expect(awarded.filter(e => e.action_type === 'first_tree')).toHaveLength(1)
    expect(trees!.map(t => t.id)).toContain(awarded.find(e => e.action_type === 'first_tree')!.reference_id)
    expect(await totalPoints(other.profile.id)).toBe(90)
  })

  // Trees logged before the trigger existed have no point events. The bonus is
  // for a first tree, so those planters must not get it on their next one.
  it('gives no first-tree bonus to someone who planted before points existed', async () => {
    // Recreate that state: `other` has trees from the test above; drop their events.
    const { error: deleteError } = await serviceClient.from('point_events').delete().eq('profile_id', other.profile.id)
    expect(deleteError).toBeNull()

    Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(other.authUser.id) })
    setRequestBody({ species_id: speciesId, lat: 52.11, lng: 5.14, planted_at: '2026-08-13' })
    const tree = await handler(createTestEvent())

    expect(await events(other.profile.id)).toEqual([
      { action_type: 'plant_tree', points: 20, reference_id: tree.id, reference_type: 'tree' },
    ])
  })
})
