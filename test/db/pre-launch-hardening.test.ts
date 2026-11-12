import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonClient, createTestUser, deleteTestUser, serviceClient, signedInClient } from '../helpers/local-supabase'

// 20261112100000_pre_launch_hardening.sql against the real schema.

interface TestUser { authUser: User, profile: Tables<'profiles'> }

let planter: TestUser
let other: TestUser

const PHOTO = 'https://example.com/storage/v1/object/public/tree-photos/someone/proof.jpg'

async function points(profileId: string) {
  const { data } = await serviceClient.from('profiles').select('total_points').eq('id', profileId).single()
  return data!.total_points ?? 0
}

async function logTree(user: TestUser, fields: Record<string, unknown>) {
  const { data, error } = await serviceClient
    .from('trees')
    .insert({ planted_by: user.profile.id, photo_urls: [PHOTO], ...fields } as never)
    .select('id')
    .single()
  if (error) { throw error }
  return data!.id
}

function findTree(rows: unknown, id: string) {
  return (rows as { id: string, photoUrl: string | null }[]).find(t => t.id === id)!
}

async function approve(id: string) {
  const { error } = await serviceClient.from('trees').update({ review_status: 'approved' }).eq('id', id)
  if (error) { throw error }
}

beforeAll(async () => {
  planter = await createTestUser()
  other = await createTestUser()
})

afterAll(async () => {
  await Promise.all([planter, other].filter(u => u?.profile).map(u => deleteTestUser(u.authUser.id, u.profile.id)))
})

describe('deleting a tree', () => {
  it('takes back the points it paid, first-tree bonus included', async () => {
    const before = await points(planter.profile.id)
    const tree = await logTree(planter, { location: 'SRID=4326;POINT(5.12 52.09)', review_status: 'pending' })
    await approve(tree)
    expect(await points(planter.profile.id)).toBe(before + 70)

    const { error } = await serviceClient.from('trees').delete().eq('id', tree)
    expect(error).toBeNull()
    expect(await points(planter.profile.id)).toBe(before)

    // As reversing entries, so the ledger keeps the history.
    const { data: events } = await serviceClient.from('point_events').select('action_type, points').eq('reference_id', tree)
    expect(events).toEqual(expect.arrayContaining([
      { action_type: 'plant_tree', points: 20 },
      { action_type: 'plant_tree', points: -20 },
      { action_type: 'first_tree', points: 50 },
      { action_type: 'first_tree', points: -50 },
    ]))
  })

  it('takes back a donation\'s points by quantity', async () => {
    const before = await points(planter.profile.id)
    const tree = await logTree(planter, { source: 'donated', quantity: 4, review_status: 'pending' })
    await approve(tree)
    expect(await points(planter.profile.id)).toBe(before + 20)

    await serviceClient.from('trees').delete().eq('id', tree)
    expect(await points(planter.profile.id)).toBe(before)
  })

  it('changes nothing for a log that never paid', async () => {
    const before = await points(planter.profile.id)
    const tree = await logTree(planter, { location: 'SRID=4326;POINT(5.12 52.09)', review_status: 'pending' })

    await serviceClient.from('trees').delete().eq('id', tree)

    expect(await points(planter.profile.id)).toBe(before)
    const { count } = await serviceClient.from('point_events').select('*', { count: 'exact', head: true }).eq('reference_id', tree)
    expect(count).toBe(0)
  })
})

describe('tree photos', () => {
  let donated: string
  let planted: string

  beforeAll(async () => {
    donated = await logTree(planter, { source: 'donated', quantity: 1, review_status: 'pending' })
    await approve(donated)
    planted = await logTree(planter, { location: 'SRID=4326;POINT(5.12 52.09)', review_status: 'pending' })
    await approve(planted)
  })

  it('are not readable by members over the REST API; other columns are', async () => {
    const client = await signedInClient(other.authUser.email!)

    const photos = await client.from('trees').select('photo_urls').eq('id', donated)
    expect(photos.error?.code).toBe('42501')

    const rest = await client.from('trees').select('id, source, quantity, lat, lng, notes').eq('id', planted).single()
    expect(rest.error).toBeNull()
    expect(rest.data!.id).toBe(planted)
  })

  it('show on the member map only where the privacy rules allow', async () => {
    const asOther = await serviceClient.rpc('member_tree_map', { p_viewer: other.profile.id })
    const asPlanter = await serviceClient.rpc('member_tree_map', { p_viewer: planter.profile.id })

    // Someone else's approved planted tree: shown.
    expect(findTree(asOther.data, planted).photoUrl).toBe(PHOTO)
    // Someone else's donation proof: hidden.
    expect(findTree(asOther.data, donated).photoUrl).toBeNull()
    // Your own: always shown.
    expect(findTree(asPlanter.data, donated).photoUrl).toBe(PHOTO)
  })

  it('member_tree_map is not callable by members', async () => {
    const client = await signedInClient(other.authUser.email!)
    const { error } = await client.rpc('member_tree_map', { p_viewer: other.profile.id })
    expect(error?.code).toBe('42501')
  })

  it('finds uploads that nothing references, and leaves referenced ones alone', async (ctx) => {
    const bucket = serviceClient.storage.from('tree-photos')
    const folder = `db-test-${randomUUID()}`
    const orphan = `${folder}/orphan.jpg`
    const kept = `${folder}/kept.jpg`
    const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10])

    await serviceClient.storage.createBucket('tree-photos', { public: true }).catch(() => {})
    const upload = await bucket.upload(orphan, jpeg, { contentType: 'image/jpeg' })
    // CI's database runs without the Storage service.
    if (upload.error) { return ctx.skip() }
    await bucket.upload(kept, jpeg, { contentType: 'image/jpeg' })
    const tree = await logTree(planter, { source: 'earned', quantity: 1, photo_urls: [bucket.getPublicUrl(kept).data.publicUrl] })

    try {
      const { data, error } = await serviceClient.rpc('orphaned_tree_photos', { p_older_than_hours: 0, p_limit: 1000 })
      expect(error).toBeNull()
      expect(data).toContain(orphan)
      expect(data).not.toContain(kept)

      // Too young to count as abandoned.
      const { data: recent } = await serviceClient.rpc('orphaned_tree_photos', { p_older_than_hours: 24, p_limit: 1000 })
      expect(recent).not.toContain(orphan)
    }
    finally {
      await serviceClient.from('trees').delete().eq('id', tree)
      await bucket.remove([orphan, kept])
    }
  })
})

describe('rate limits', () => {
  it('allow up to the limit, then refuse', async () => {
    const key = `test:${randomUUID()}`
    const results = []
    for (let i = 0; i < 4; i++) {
      // oxlint-disable-next-line no-await-in-loop -- each call depends on the last
      const { data } = await serviceClient.rpc('hit_rate_limit', { p_key: key, p_limit: 3, p_window_seconds: 60 })
      results.push(data)
    }
    expect(results).toEqual([true, true, true, false])
    await serviceClient.from('rate_limit_hits').delete().eq('key', key)
  })

  it('are invisible and uncallable for anonymous and signed-in users', async () => {
    const client = await signedInClient(other.authUser.email!)
    for (const c of [anonClient(), client]) {
      // oxlint-disable-next-line no-await-in-loop
      const call = await c.rpc('hit_rate_limit', { p_key: 'x', p_limit: 1, p_window_seconds: 1 })
      expect(call.error?.code).toBe('42501')
      // oxlint-disable-next-line no-await-in-loop
      const read = await c.from('rate_limit_hits').select('key')
      expect(read.error?.code).toBe('42501')
    }
  })
})

describe('handle_new_user', () => {
  it('is not callable over the REST API', async () => {
    const { error } = await anonClient().rpc('handle_new_user' as never)
    expect(error).not.toBeNull()
    // Signing up still creates a profile through the trigger (createTestUser
    // checks that it exists).
    expect(planter.profile.id).toBeTruthy()
  })
})
