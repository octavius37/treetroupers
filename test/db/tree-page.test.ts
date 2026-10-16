import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import review from '~~/server/api/cms/trees/[id]/review.put'
import remove from '~~/server/api/dashboard/trees/[id].delete'
import read from '~~/server/api/dashboard/trees/[id].get'
import edit from '~~/server/api/dashboard/trees/[id].patch'
import postUpdate from '~~/server/api/dashboard/trees/[id]/updates.post'
import { createTestUser, deleteTestUser, serviceClient, signedInClient } from '../helpers/local-supabase'
import { createTestEvent, setRequestBody, setRouterParams } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// The tree page endpoints against the real schema: who sees what, what the
// planter can change, and the review note.

interface TestUser { authUser: User, profile: Tables<'profiles'> }

let planter: TestUser
let other: TestUser

function photo(user: User, name = 'proof.jpg') {
  return serviceClient.storage.from('tree-photos').getPublicUrl(`${user.id}/${name}`).data.publicUrl
}

async function logTree(source: 'planted' | 'donated' = 'planted') {
  const { data, error } = await serviceClient
    .from('trees')
    .insert({
      planted_by: planter.profile.id,
      source,
      quantity: source === 'planted' ? 1 : 3,
      location: source === 'planted' ? 'SRID=4326;POINT(5.12 52.09)' : null,
      photo_urls: [photo(planter.authUser)],
      notes: 'By the canal',
    })
    .select('id')
    .single()
  if (error) { throw error }
  return data.id
}

function as(user: TestUser) {
  Object.assign(globalThis, {
    authUserId: vi.fn().mockResolvedValue(user.authUser.id),
    requireAdmin: vi.fn().mockResolvedValue({ user: { sub: other.authUser.id }, profile: other.profile }),
  })
}

function call<T>(handler: (e: ReturnType<typeof createTestEvent>) => Promise<T>, id: string, body?: unknown) {
  setRouterParams({ id })
  if (body !== undefined) { setRequestBody(body) }
  return handler(createTestEvent())
}

beforeAll(async () => {
  planter = await createTestUser()
  other = await createTestUser()
})

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(serviceClient as never)
})

afterAll(async () => {
  await Promise.all([planter, other].filter(u => u?.profile).map(u => deleteTestUser(u.authUser.id, u.profile.id)))
})

describe('reading a tree', () => {
  it('shows a pending planted tree to others, but not its photo yet', async () => {
    const id = await logTree()
    as(other)

    const tree = await call(read, id)

    expect(tree).toMatchObject({ reviewStatus: 'pending', isMine: false, photoUrl: null })
    expect(tree.planter?.id).toBe(planter.profile.id)
  })

  it('shows an approved planted tree\'s photo to everyone', async () => {
    const id = await logTree()
    as(other)
    await call(review, id, { decision: 'approved' })

    expect((await call(read, id)).photoUrl).toBe(photo(planter.authUser))
  })

  it('never shows a donation\'s proof to anyone but the planter', async () => {
    const id = await logTree('donated')
    as(other)
    await call(review, id, { decision: 'approved' })
    expect((await call(read, id)).photoUrl).toBeNull()

    as(planter)
    expect((await call(read, id)).photoUrl).toBe(photo(planter.authUser))
  })

  it('shows a rejected log, with the reviewer\'s note, only to its planter', async () => {
    const id = await logTree()
    as(other)
    await call(review, id, { decision: 'rejected', note: 'Photo too dark' })

    await expect(call(read, id)).rejects.toMatchObject({ statusCode: 404 })

    as(planter)
    expect(await call(read, id)).toMatchObject({ reviewStatus: 'rejected', reviewNote: 'Photo too dark' })
  })
})

describe('changing a tree', () => {
  it('lets the planter edit notes and status', async () => {
    const id = await logTree()
    as(planter)

    await call(edit, id, { notes: '  Doing well  ', status: 'growing' })

    const { data } = await serviceClient.from('trees').select('notes, status').eq('id', id).single()
    expect(data).toEqual({ notes: 'Doing well', status: 'growing' })
  })

  it('refuses edits from anyone else', async () => {
    const id = await logTree()
    as(other)

    await expect(call(edit, id, { notes: 'Mine now' })).rejects.toMatchObject({ statusCode: 404 })
  })

  it('lets the planter delete a pending log, but not an approved one', async () => {
    const pending = await logTree()
    const approved = await logTree()
    as(other)
    await call(review, approved, { decision: 'approved' })

    as(planter)
    await call(remove, pending)
    await expect(call(remove, approved)).rejects.toMatchObject({ statusCode: 409 })

    const { data } = await serviceClient.from('trees').select('id').in('id', [pending, approved])
    expect(data!.map(t => t.id)).toEqual([approved])
  })
})

describe('tree updates', () => {
  it('lets the planter post an update, shown on the tree', async () => {
    const id = await logTree()
    as(planter)

    await call(postUpdate, id, { content: 'First leaves!', photo_url: photo(planter.authUser, 'leaves.jpg') })

    const tree = await call(read, id)
    expect(tree.updates).toEqual([expect.objectContaining({ content: 'First leaves!', photoUrl: photo(planter.authUser, 'leaves.jpg') })])
  })

  it('refuses an update on someone else\'s tree', async () => {
    const id = await logTree()
    as(other)

    await expect(call(postUpdate, id, { content: 'Hello' })).rejects.toMatchObject({ statusCode: 404 })
  })

  // The old policy let any signed-in user post as anyone on any tree.
  it('refuses a direct insert on someone else\'s tree, under RLS', async () => {
    const id = await logTree()
    const client = await signedInClient(other.authUser.email!)

    const { error } = await client.from('tree_updates').insert({ tree_id: id, author_id: other.profile.id, content: 'Hi' })

    expect(error?.code).toBe('42501')
  })
})

describe('the review note', () => {
  it('can\'t be written by the planter directly', async () => {
    const id = await logTree()
    const client = await signedInClient(planter.authUser.email!)

    const { error } = await client.from('trees').update({ review_note: 'Looks great!' }).eq('id', id)

    expect(error?.code).toBe('42501')
  })
})
