import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import deleteAccount from '~~/server/api/dashboard/account.delete'
import rewards from '~~/server/api/dashboard/rewards.get'
import claim from '~~/server/api/dashboard/rewards/[id]/claim.post'
import { createTestUser, deleteTestUser, serviceClient, signedInClient } from '../helpers/local-supabase'
import { createTestEvent, setRequestBody, setRouterParams } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Points for joining communities, the streak bonus, and claiming rewards,
// against the real triggers and policies.

interface TestUser { authUser: User, profile: Tables<'profiles'> }

let user: TestUser
let community: string
const rewardIds: string[] = []

async function points(profileId = user.profile.id) {
  const { data } = await serviceClient.from('profiles').select('total_points').eq('id', profileId).single()
  return data!.total_points
}

async function events(action: string, profileId = user.profile.id) {
  const { data } = await serviceClient.from('point_events').select('points').eq('profile_id', profileId).eq('action_type', action)
  return data!.map(e => e.points)
}

async function createReward(pointsRequired: number, type: 'badge' | 'physical') {
  const { data } = await serviceClient
    .from('rewards')
    .insert({ title: `Test ${type} ${randomUUID()}`, points_required: pointsRequired, type })
    .select('id')
    .single()
  rewardIds.push(data!.id)
  return data!.id
}

beforeAll(async () => {
  user = await createTestUser()
  const { data } = await serviceClient.from('communities').insert({ name: 'Points Troupe', slug: `test-${randomUUID()}` }).select('id').single()
  community = data!.id
})

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(serviceClient as never)
  Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(user.authUser.id) })
})

afterAll(async () => {
  if (user?.profile) { await deleteTestUser(user.authUser.id, user.profile.id).catch(() => {}) }
  await serviceClient.from('communities').delete().eq('id', community)
  await serviceClient.from('rewards').delete().in('id', rewardIds)
})

describe('points for joining a community', () => {
  it('pays 10 for joining and takes them back on leaving', async () => {
    const client = await signedInClient(user.authUser.email!)

    await client.from('community_members').insert({ profile_id: user.profile.id, community_id: community })
    expect(await points()).toBe(10)

    await client.from('community_members').delete().eq('profile_id', user.profile.id).eq('community_id', community)
    expect(await points()).toBe(0)
    expect(await events('join_community')).toEqual(expect.arrayContaining([10, -10]))
  })
})

describe('the streak bonus', () => {
  async function approvedLogWeeksAgo(weeks: number) {
    const { error } = await serviceClient.from('trees').insert({
      planted_by: user.profile.id,
      location: 'SRID=4326;POINT(5.12 52.09)',
      photo_urls: ['https://example.com/proof.jpg'],
      review_status: 'approved',
      created_at: new Date(Date.now() - weeks * 7 * 86_400_000).toISOString(),
    })
    if (error) { throw error }
  }

  it('pays nothing for three weeks in a row', async () => {
    await approvedLogWeeksAgo(3)
    await approvedLogWeeksAgo(2)
    await approvedLogWeeksAgo(1)
    expect(await events('streak_bonus')).toEqual([])
  })

  it('pays 25 for the fourth week in a row', async () => {
    await approvedLogWeeksAgo(0)
    expect(await events('streak_bonus')).toEqual([25])
  })

  it('pays it at most once every four weeks', async () => {
    await approvedLogWeeksAgo(0)
    expect(await events('streak_bonus')).toEqual([25])
  })
})

describe('rewards', () => {
  it('shows a reward as unlocked once the member\'s points reach it', async () => {
    const reachable = await createReward(1, 'badge')
    const tooFar = await createReward(1_000_000, 'physical')

    const { rewards: list } = await rewards(createTestEvent())

    expect(list.find(r => r.id === reachable)).toMatchObject({ unlocked: true, claimable: false })
    expect(list.find(r => r.id === tooFar)).toMatchObject({ unlocked: false, claimable: true, claim: null })
  })

  it('lets a member claim an unlocked reward once, without spending points', async () => {
    const id = await createReward(1, 'physical')
    const before = await points()
    setRouterParams({ id })

    await claim(createTestEvent())
    await expect(claim(createTestEvent())).rejects.toMatchObject({ statusCode: 409 })

    expect(await points()).toBe(before)
    const { rewards: list } = await rewards(createTestEvent())
    expect(list.find(r => r.id === id)?.claim).toBe('pending')
  })

  it('refuses a claim the member hasn\'t earned', async () => {
    const id = await createReward(1_000_000, 'physical')
    setRouterParams({ id })

    await expect(claim(createTestEvent())).rejects.toMatchObject({ statusCode: 403 })
  })

  // The baseline's own-insert policy let anyone claim any reward directly.
  it('refuses a claim inserted directly through the REST API', async () => {
    const id = await createReward(1_000_000, 'physical')
    const client = await signedInClient(user.authUser.email!)

    const { error } = await client.from('reward_redemptions').insert({ profile_id: user.profile.id, reward_id: id })

    expect(error?.code).toBe('42501')
  })
})

describe('deleting an account with memberships', () => {
  // Deleting the profile cascades to its memberships; taking back the joining
  // points for a profile that is being deleted would fail its foreign key.
  it('still deletes the account', async () => {
    await serviceClient.from('community_members').insert({ profile_id: user.profile.id, community_id: community })
    // The streak tests' trees outlive the account, unowned; remember them to tidy up.
    const { data: trees } = await serviceClient.from('trees').select('id').eq('planted_by', user.profile.id)
    const storage = { from: () => ({ list: async () => ({ data: [], error: null }), remove: async () => ({ error: null }) }) }
    vi.mocked(serverSupabaseServiceRole).mockReturnValue({ from: serviceClient.from.bind(serviceClient), auth: serviceClient.auth, storage } as never)
    setRequestBody({ confirm: 'DELETE' })

    await expect(deleteAccount(createTestEvent())).resolves.toEqual({ deleted: true })

    const { count } = await serviceClient.from('profiles').select('*', { count: 'exact', head: true }).eq('id', user.profile.id)
    expect(count).toBe(0)
    await serviceClient.from('trees').delete().in('id', trees!.map(t => t.id))
  })
})
