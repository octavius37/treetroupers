import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_CO2_KG_PER_YEAR } from '~~/shared/utils/co2'
import { createTestUser, deleteTestUser, serviceClient } from '../helpers/local-supabase'

// tree_stats counts CO₂ for every approved tree: planted, donated and earned,
// by quantity, at the species' figure or, unknown, at an average tree's.

let user: { authUser: User, profile: Tables<'profiles'> }
let community: string
let speciesId: string

beforeAll(async () => {
  user = await createTestUser()
  const { data: c } = await serviceClient.from('communities').insert({ name: 'CO2 Troupe', slug: `test-${randomUUID()}` }).select('id').single()
  community = c!.id
  const { data: s } = await serviceClient.from('tree_species').insert({ common_name: `Test Ash ${randomUUID()}`, scientific_name: 'Fraxinus testii', avg_co2_kg_per_year: 10 }).select('id').single()
  speciesId = s!.id

  const base = { planted_by: user.profile.id, community_id: community, photo_urls: ['https://example.com/p.jpg'], review_status: 'approved' }
  const { error } = await serviceClient.from('trees').insert([
    { ...base, source: 'planted', quantity: 1, location: 'SRID=4326;POINT(5.12 52.09)', species_id: speciesId },
    { ...base, source: 'donated', quantity: 3, species_id: speciesId },
    { ...base, source: 'earned', quantity: 2, species_id: null },
  ] as never)
  if (error) { throw error }
})

afterAll(async () => {
  if (user?.profile) { await deleteTestUser(user.authUser.id, user.profile.id) }
  await serviceClient.from('communities').delete().eq('id', community)
  await serviceClient.from('tree_species').delete().eq('id', speciesId)
})

describe('tree_stats CO₂', () => {
  it('counts planted, donated and earned trees, unknown species at the average', async () => {
    const { data, error } = await serviceClient.rpc('tree_stats', { p_community_ids: [community], p_top: 5 })
    expect(error).toBeNull()
    const stats = data as { trees: number, co2KgPerYear: number, topPlanters: { name: string }[] }

    // 1 planted ash (10) + 3 donated ash (30) + 2 earned, species unknown (2 × 22).
    expect(Number(stats.co2KgPerYear)).toBe(10 + 30 + 2 * DEFAULT_CO2_KG_PER_YEAR)
    expect(Number(stats.trees)).toBe(6)
  })

  it('names a member without a display name "A tree trouper"', async () => {
    await serviceClient.from('profiles').update({ display_name: null }).eq('id', user.profile.id)
    const { data } = await serviceClient.rpc('tree_stats', { p_community_ids: [community], p_top: 5 })
    expect((data as { topPlanters: { name: string }[] }).topPlanters[0]!.name).toBe('A tree trouper')
  })
})
