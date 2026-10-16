import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/account.delete'
import { createTestUser, deleteTestUser, serviceClient } from '../helpers/local-supabase'
import { createTestEvent, setRequestBody } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Deleting an account against the real schema: what cascades, what is kept
// anonymously. Storage isn't part of CI's trimmed stack, so file removal is
// stubbed here (the unit test covers it).

let authUser: User
let profile: Tables<'profiles'>
let approvedTree: string
let pendingTree: string

beforeAll(async () => {
  ;({ authUser, profile } = await createTestUser())

  const insert = (review_status: string) => serviceClient
    .from('trees')
    .insert({
      planted_by: profile.id,
      location: 'SRID=4326;POINT(5.12 52.09)',
      photo_urls: ['https://example.com/proof.jpg'],
      notes: 'By my front door',
      review_status,
    })
    .select('id')
    .single()
  approvedTree = (await insert('approved')).data!.id
  pendingTree = (await insert('pending')).data!.id

  const storage = { from: () => ({ list: async () => ({ data: [], error: null }), remove: async () => ({ error: null }) }) }
  const client = { from: serviceClient.from.bind(serviceClient), auth: serviceClient.auth, storage }
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(client as never)
  Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(authUser.id) })
  setRequestBody({ confirm: 'DELETE' })

  await handler(createTestEvent())
})

describe('deleting an account', () => {
  it('deletes the auth user and, by cascade, the profile and its points', async () => {
    const { data } = await serviceClient.auth.admin.getUserById(authUser.id)
    expect(data.user).toBeNull()

    const { count: profiles } = await serviceClient.from('profiles').select('*', { count: 'exact', head: true }).eq('id', profile.id)
    const { count: points } = await serviceClient.from('point_events').select('*', { count: 'exact', head: true }).eq('profile_id', profile.id)
    expect(profiles).toBe(0)
    expect(points).toBe(0)
  })

  it('keeps an approved tree for the community totals, without its owner, photo or notes', async () => {
    const { data: tree } = await serviceClient.from('trees').select('planted_by, photo_urls, notes').eq('id', approvedTree).single()
    expect(tree).toEqual({ planted_by: null, photo_urls: [], notes: null })
  })

  it('deletes a pending log outright', async () => {
    const { count } = await serviceClient.from('trees').select('*', { count: 'exact', head: true }).eq('id', pendingTree)
    expect(count).toBe(0)

    // Tidy up the kept tree, which no longer belongs to anyone deleteTestUser would find.
    await serviceClient.from('trees').delete().eq('id', approvedTree)
    await deleteTestUser(authUser.id, profile.id).catch(() => {})
  })
})
