import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import member from '~~/server/api/dashboard/members/[id].get'
import rewards from '~~/server/api/dashboard/rewards.get'
import { createTestUser, deleteTestUser, serviceClient } from '../helpers/local-supabase'
import { createTestEvent, setRouterParams } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Achievement badges, counted live by badge_progress(), against the badges the
// 20261125140000 migration adds.

let user: { authUser: User, profile: Tables<'profiles'> }
const speciesIds: string[] = []
let donatedTree: string

beforeAll(async () => {
  user = await createTestUser()
  for (const name of ['Badge Oak', 'Badge Elm']) {
    // oxlint-disable-next-line no-await-in-loop
    const { data } = await serviceClient.from('tree_species').insert({ common_name: `${name} ${randomUUID()}`, scientific_name: `Testus ${randomUUID()}`, avg_co2_kg_per_year: 10 }).select('id').single()
    speciesIds.push(data!.id)
  }
  const base = { planted_by: user.profile.id, photo_urls: ['https://example.com/p.jpg'], review_status: 'approved' }
  const { error } = await serviceClient.from('trees').insert(speciesIds.map(id => ({ ...base, source: 'planted', quantity: 1, location: 'SRID=4326;POINT(5.12 52.09)', species_id: id })) as never)
  if (error) { throw error }
  const { data } = await serviceClient.from('trees').insert({ ...base, source: 'donated', quantity: 8 } as never).select('id').single()
  donatedTree = data!.id
})

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(serviceClient as never)
  Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(user.authUser.id) })
})

afterAll(async () => {
  if (user?.profile) { await deleteTestUser(user.authUser.id, user.profile.id) }
  await serviceClient.from('tree_species').delete().in('id', speciesIds)
})

async function myRewards() {
  const result = await rewards(createTestEvent())
  return Object.fromEntries(result.rewards.map(r => [r.title, r]))
}

describe('achievement badges', () => {
  it('counts what the member has done', async () => {
    const { data } = await serviceClient.rpc('badge_progress', { p_profile_id: user.profile.id })
    expect(data).toMatchObject({ planted_trees: 2, trees: 10, donated_trees: 1, earned_trees: 0, species: 2, suggestions: 0 })
  })

  it('unlocks the badges reached and shows progress on the rest', async () => {
    const r = await myRewards()
    expect(r['First Roots']).toMatchObject({ unlocked: true })
    expect(r['Ten Trees']).toMatchObject({ unlocked: true, achievement: { current: 10, target: 10, label: 'trees' } })
    expect(r['Generous Donor']).toMatchObject({ unlocked: true })
    expect(r['Everyday Earner']).toMatchObject({ unlocked: false, achievement: { current: 0, target: 1 } })
    expect(r['Species Collector']).toMatchObject({ unlocked: false, achievement: { current: 2, target: 5, label: 'species planted' } })
  })

  it('shows unlocked badges on the member\'s profile', async () => {
    setRouterParams({ id: user.profile.id })
    const profile = await member(createTestEvent())
    const titles = profile.badges.map((b: { title: string }) => b.title)
    expect(titles).toEqual(expect.arrayContaining(['First Roots', 'Ten Trees', 'Generous Donor']))
    expect(titles).not.toContain('Species Collector')
  })

  it('takes a badge back when what earned it is deleted', async () => {
    await serviceClient.from('trees').delete().eq('id', donatedTree)
    const r = await myRewards()
    expect(r['Ten Trees']).toMatchObject({ unlocked: false, achievement: { current: 2 } })
    expect(r['Generous Donor']).toMatchObject({ unlocked: false })
  })

  it('no longer offers partner discounts', async () => {
    const r = await myRewards()
    expect(Object.values(r).some((reward: { type: string }) => reward.type === 'discount')).toBe(false)
  })
})
