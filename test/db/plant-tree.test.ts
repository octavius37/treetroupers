import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import review from '~~/server/api/cms/trees/[id]/review.put'
import handler from '~~/server/api/dashboard/trees.post'
import { anonClient, createTestUser, deleteTestUser, serviceClient, signedInClient } from '../helpers/local-supabase'
import { createTestEvent, setRequestBody, setRouterParams } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Logs trees through the real handlers and checks what lands in Postgres.
// Unlike test/server/api/trees.post.test.ts, only the auth lookups are mocked:
// writes go through PostgREST into Postgres, so column defaults, constraints,
// the generated lat/lng columns and the triggers are all real. The handlers use
// the service role, so RLS is exercised only by the anon and signed-in clients.

let authUser: User
let profile: Tables<'profiles'>
// A second planter, for the cross-profile and pre-existing-tree cases.
let other: { authUser: User, profile: Tables<'profiles'> }
// Reviews logs. Any profile will do: requireAdmin is stubbed to return it.
let admin: { authUser: User, profile: Tables<'profiles'> }
let speciesId: string
let firstTreeId: string

// Photos have to be the user's own uploads; the handler builds this prefix the
// same way, and nothing fetches the file, so it needn't exist in Storage.
function photoFor(user: User) {
  return serviceClient.storage.from('tree-photos').getPublicUrl(`${user.id}/${randomUUID()}.jpg`).data.publicUrl
}

function logAs(user: User, body: Record<string, unknown>) {
  Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(user.id) })
  setRequestBody({ photo_url: photoFor(user), planted_at: '2026-08-11', ...body })
  return handler(createTestEvent())
}

function plant(user = authUser, lng = 5.12, lat = 52.09) {
  return logAs(user, { species_id: speciesId, lat, lng })
}

function reviewTree(id: string, decision: 'approved' | 'rejected') {
  setRouterParams({ id })
  setRequestBody({ decision })
  return review(createTestEvent())
}

beforeAll(async () => {
  ;({ authUser, profile } = await createTestUser())
  other = await createTestUser()
  admin = await createTestUser()

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
  Object.assign(globalThis, {
    authUserId: vi.fn().mockResolvedValue(authUser.id),
    requireAdmin: vi.fn().mockResolvedValue({ user: { sub: admin.authUser.id }, profile: admin.profile }),
  })
})

afterAll(async () => {
  await Promise.all([{ authUser, profile }, other, admin]
    .filter(u => u?.profile)
    .map(u => deleteTestUser(u.authUser.id, u.profile.id)))
  if (speciesId) {
    const { error } = await serviceClient.from('tree_species').delete().eq('id', speciesId)
    if (error) { throw error }
  }
})

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

async function leaderboardTrees(profileId = profile.id) {
  const { data } = await anonClient().from('leaderboard').select('trees_planted').eq('id', profileId).single()
  return data!.trees_planted
}

describe('logging a planted tree', () => {
  it('gives a new sign-up a profile with zero points', () => {
    expect(profile.auth_user_id).toBe(authUser.id)
    expect(profile.total_points).toBe(0)
  })

  it('stores the tree against the planter\'s profile, with its location and photo, pending review', async () => {
    const photo = photoFor(authUser)
    Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(authUser.id) })
    setRequestBody({
      species_id: speciesId,
      lat: 52.3676,
      lng: 4.9041,
      notes: 'Planted by the canal',
      planted_at: '2026-08-11',
      photo_url: photo,
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
      review_status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      quantity: 1,
      notes: 'Planted by the canal',
      photo_urls: [photo],
    })
    // lat/lng are generated from the PostGIS `location`, so matching values
    // prove the handler wrote the point in (lng lat) order.
    expect(tree!.lat).toBeCloseTo(52.3676, 6)
    expect(tree!.lng).toBeCloseTo(4.9041, 6)
    expect(tree!.planted_at.startsWith('2026-08-11')).toBe(true)
  })

  it('makes the tree publicly readable, but leaves it off the leaderboard until approved', async () => {
    const { data: trees } = await anonClient().from('trees').select('id').eq('planted_by', profile.id)
    expect(trees).toHaveLength(1)
    expect(await leaderboardTrees()).toBe(0)
  })

  it('finds the tree by distance with trees_near_point', async () => {
    const { data, error } = await anonClient()
      .rpc('trees_near_point', { p_lat: 52.3676, p_lng: 4.9041, p_metres: 10 })
    expect(error).toBeNull()
    expect(data?.map(tree => tree.id)).toContain(firstTreeId)
  })

  it('rejects a planted tree with no location', async () => {
    await expect(logAs(authUser, { species_id: speciesId })).rejects.toMatchObject({ statusCode: 500 })

    const { count } = await serviceClient
      .from('trees')
      .select('id', { count: 'exact', head: true })
      .eq('planted_by', profile.id)
    expect(count).toBe(1)
  })
})

// Runs after the block above, so the profile has exactly one pending tree.
describe('points on approval', () => {
  it('pays nothing while a log is pending', async () => {
    expect(await events()).toEqual([])
    expect(await totalPoints()).toBe(0)
  })

  it('pays 20 points plus a 50-point first-tree bonus when the first tree is approved', async () => {
    await reviewTree(firstTreeId, 'approved')

    expect(await events()).toEqual([
      { action_type: 'plant_tree', points: 20, reference_id: firstTreeId, reference_type: 'tree' },
      { action_type: 'first_tree', points: 50, reference_id: firstTreeId, reference_type: 'tree' },
    ])
    expect(await totalPoints()).toBe(70)
    expect(await leaderboardTrees()).toBe(1)

    const { data: tree } = await serviceClient.from('trees').select('reviewed_by, reviewed_at').eq('id', firstTreeId).single()
    expect(tree!.reviewed_by).toBe(admin.profile.id)
    expect(tree!.reviewed_at).not.toBeNull()
  })

  it('refuses to review the same log twice, so it can\'t be paid twice', async () => {
    await expect(reviewTree(firstTreeId, 'approved')).rejects.toMatchObject({ statusCode: 409 })
    expect(await totalPoints()).toBe(70)
  })

  it('refuses to un-approve a log, even through the service role', async () => {
    const { error } = await serviceClient.from('trees').update({ review_status: 'rejected' }).eq('id', firstTreeId)
    expect(error?.code).toBe('23514') // check_violation
  })

  it('pays 20 points for a later planted tree, with no second bonus', async () => {
    const tree = await plant()
    await reviewTree(tree.id, 'approved')

    expect(await totalPoints()).toBe(90)
    expect((await events()).filter(e => e.action_type === 'first_tree')).toHaveLength(1)
  })

  it('pays 5 points per donated tree and 2 per earned tree', async () => {
    const donated = await logAs(authUser, { source: 'donated', quantity: 10, donation_project: 'Test project' })
    const earned = await logAs(authUser, { source: 'earned', quantity: 3, earned_activity: 'Test activity' })
    expect(await totalPoints()).toBe(90)

    await reviewTree(donated.id, 'approved')
    await reviewTree(earned.id, 'approved')

    const paid = await events()
    expect(paid).toContainEqual({ action_type: 'donate_tree', points: 50, reference_id: donated.id, reference_type: 'tree' })
    expect(paid).toContainEqual({ action_type: 'earn_tree', points: 6, reference_id: earned.id, reference_type: 'tree' })
    expect(await totalPoints()).toBe(146)
  })

  it('pays nothing for a rejected log', async () => {
    const tree = await plant()
    await reviewTree(tree.id, 'rejected')

    expect(await totalPoints()).toBe(146)
    const { data } = await anonClient().from('trees').select('review_status').eq('id', tree.id).single()
    expect(data!.review_status).toBe('rejected')
  })

  it('counts only approved trees on the leaderboard', async () => {
    // Two approved planted trees, one donated and one earned log; one rejected.
    expect(await leaderboardTrees()).toBe(4)
  })

  // Row triggers fire after the whole statement, so each row of a multi-row
  // approval sees the others.
  it('pays exactly one first-tree bonus when first trees are approved together', async () => {
    const a = await plant(other.authUser, 5.12, 52.09)
    const b = await plant(other.authUser, 5.13, 52.10)

    const { error } = await serviceClient.from('trees').update({ review_status: 'approved' }).in('id', [a.id, b.id])
    expect(error).toBeNull()

    const paid = await events(other.profile.id)
    expect(paid.filter(e => e.action_type === 'plant_tree')).toHaveLength(2)
    expect(paid.filter(e => e.action_type === 'first_tree')).toHaveLength(1)
    expect([a.id, b.id]).toContain(paid.find(e => e.action_type === 'first_tree')!.reference_id)
    expect(await totalPoints(other.profile.id)).toBe(90)
  })

  // Trees logged before review existed are approved with no point events. The
  // bonus is for a first tree, so those planters must not get it on their next.
  it('pays no first-tree bonus to someone whose earlier trees predate points', async () => {
    // Recreate that state: `other` has approved trees from the test above; drop their events.
    const { error: deleteError } = await serviceClient.from('point_events').delete().eq('profile_id', other.profile.id)
    expect(deleteError).toBeNull()

    const tree = await plant(other.authUser, 5.14, 52.11)
    await reviewTree(tree.id, 'approved')

    expect(await events(other.profile.id)).toEqual([
      { action_type: 'plant_tree', points: 20, reference_id: tree.id, reference_type: 'tree' },
    ])
  })
})

describe('members can\'t approve their own logs', () => {
  it('stores a direct insert as pending even when it asks to be approved', async () => {
    const before = await totalPoints()
    const client = await signedInClient(authUser.email!)

    const { data, error } = await client
      .from('trees')
      .insert({
        planted_by: profile.id,
        location: 'SRID=4326;POINT(5.12 52.09)',
        photo_urls: [photoFor(authUser)],
        review_status: 'approved',
        reviewed_by: profile.id,
      })
      .select('id, review_status, reviewed_by')
      .single()

    expect(error).toBeNull()
    expect(data).toMatchObject({ review_status: 'pending', reviewed_by: null })
    expect(await totalPoints()).toBe(before)
  })

  it('refuses a member\'s update to their own log\'s review status', async () => {
    const before = await totalPoints()
    const tree = await plant()
    const client = await signedInClient(authUser.email!)

    const { error } = await client.from('trees').update({ review_status: 'approved' }).eq('id', tree.id)

    expect(error?.code).toBe('42501') // insufficient_privilege, raised by guard_tree_review
    expect(await totalPoints()).toBe(before)
  })

  it('refuses a log with no photo, however it is inserted', async () => {
    const client = await signedInClient(authUser.email!)

    const { error } = await client.from('trees').insert({
      planted_by: profile.id,
      location: 'SRID=4326;POINT(5.12 52.09)',
    })

    expect(error?.code).toBe('23514') // trees_photo_required_for_review
  })

  // Without an ownership check on insert, a signed-in user could log trees, and
  // so points, against anyone's profile.
  it('refuses a direct insert that credits another profile', async () => {
    const client = await signedInClient(authUser.email!)

    const { error } = await client.from('trees').insert({
      planted_by: other.profile.id,
      location: 'SRID=4326;POINT(5.12 52.09)',
      photo_urls: [photoFor(authUser)],
    })

    expect(error?.code).toBe('42501') // insufficient_privilege: RLS rejected the row
  })
})
