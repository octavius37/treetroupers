import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import feed from '~~/server/api/dashboard/feed.get'
import unlike from '~~/server/api/dashboard/feed/posts/[id]/like.delete'
import like from '~~/server/api/dashboard/feed/posts/[id]/like.post'
import { anonClient, createTestUser, deleteTestUser, serviceClient, signedInClient } from '../helpers/local-supabase'
import { createTestEvent, setQuery, setRouterParams } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// The community feed against the real database: the on_tree_approved_post
// trigger, the feed's community scoping, likes and the tables' RLS.

interface TestUser { authUser: User, profile: Tables<'profiles'> }

let planter: TestUser
let viewer: TestUser
// city ⊃ neighbourhood; elsewhere is unrelated.
let city: string
let neighbourhood: string
let elsewhere: string

async function createCommunity(name: string, parent: string | null = null) {
  const { data, error } = await serviceClient
    .from('communities')
    .insert({ name, slug: `test-${randomUUID()}`, parent_community_id: parent })
    .select('id')
    .single()
  if (error) { throw error }
  return data.id
}

async function logTree(communityId: string | null, source: 'planted' | 'donated' = 'planted') {
  const { data, error } = await serviceClient
    .from('trees')
    .insert({
      planted_by: planter.profile.id,
      community_id: communityId,
      source,
      quantity: source === 'planted' ? 1 : 5,
      location: source === 'planted' ? 'SRID=4326;POINT(5.12 52.09)' : null,
      photo_urls: ['https://example.com/proof.jpg'],
    })
    .select('id')
    .single()
  if (error) { throw error }
  return data.id
}

async function review(treeId: string, decision: 'approved' | 'rejected') {
  const { error } = await serviceClient.from('trees').update({ review_status: decision }).eq('id', treeId)
  if (error) { throw error }
}

async function activityPostsFor(treeId: string) {
  const { data } = await serviceClient.from('feed_posts').select('*').eq('tree_id', treeId)
  return data!
}

async function announce(communityId: string | null, title: string) {
  const { data, error } = await serviceClient
    .from('feed_posts')
    .insert({ kind: 'announcement', category: 'latest_news', title, community_id: communityId })
    .select('id')
    .single()
  if (error) { throw error }
  return data.id
}

function feedFor(user: TestUser, communityId: string) {
  Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(user.authUser.id) })
  setQuery({ community_id: communityId })
  return feed(createTestEvent())
}

beforeAll(async () => {
  planter = await createTestUser()
  viewer = await createTestUser()
  city = await createCommunity('Test City')
  neighbourhood = await createCommunity('Test Neighbourhood', city)
  elsewhere = await createCommunity('Test Elsewhere')

  const { error } = await serviceClient.from('community_members').insert([
    { profile_id: planter.profile.id, community_id: neighbourhood, role: 'member' },
    { profile_id: viewer.profile.id, community_id: city, role: 'member' },
  ])
  if (error) { throw error }
})

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(serviceClient as never)
})

afterAll(async () => {
  await Promise.all([planter, viewer]
    .filter(u => u?.profile)
    .map(u => deleteTestUser(u.authUser.id, u.profile.id)))
  // Deleting a community cascades to its posts and memberships.
  const { error } = await serviceClient.from('communities').delete().in('id', [neighbourhood, city, elsewhere].filter(Boolean))
  if (error) { throw error }
})

describe('activity posts', () => {
  it('posts nothing while a log is pending', async () => {
    const tree = await logTree(neighbourhood)
    expect(await activityPostsFor(tree)).toEqual([])
  })

  it('posts once when a log is approved, in the tree\'s community, as its planter', async () => {
    const tree = await logTree(neighbourhood)
    await review(tree, 'approved')

    expect(await activityPostsFor(tree)).toEqual([
      expect.objectContaining({ kind: 'activity', community_id: neighbourhood, author_id: planter.profile.id }),
    ])
  })

  it('posts nothing for a rejected log', async () => {
    const tree = await logTree(neighbourhood)
    await review(tree, 'rejected')

    expect(await activityPostsFor(tree)).toEqual([])
  })

  it('removes the post, and its likes, when the tree is deleted', async () => {
    const tree = await logTree(neighbourhood)
    await review(tree, 'approved')
    const [post] = await activityPostsFor(tree)
    await serviceClient.from('post_likes').insert({ post_id: post!.id, profile_id: viewer.profile.id })

    await serviceClient.from('trees').delete().eq('id', tree)

    expect(await activityPostsFor(tree)).toEqual([])
    const { count } = await serviceClient.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post!.id)
    expect(count).toBe(0)
  })
})

describe('a community\'s feed', () => {
  let neighbourhoodTree: string
  let unassignedTree: string
  let elsewhereTree: string

  beforeAll(async () => {
    neighbourhoodTree = await logTree(neighbourhood)
    unassignedTree = await logTree(null, 'donated')
    elsewhereTree = await logTree(elsewhere)
    await Promise.all([neighbourhoodTree, unassignedTree, elsewhereTree].map(id => review(id, 'approved')))
  })

  it('shows activity from the communities inside it, and from its members\' unassigned logs', async () => {
    const { posts } = await feedFor(viewer, city)
    const treeIds = (await Promise.all(posts.filter(p => p.kind === 'activity').map(p => serviceClient
      .from('feed_posts')
      .select('tree_id')
      .eq('id', p.id)
      .single()))).map(r => r.data!.tree_id)

    expect(treeIds).toContain(neighbourhoodTree)
    expect(treeIds).toContain(unassignedTree)
    expect(treeIds).not.toContain(elsewhereTree)
  })

  it('shows announcements for it, the communities containing it and everyone, but not for those inside it', async () => {
    const forCity = await announce(city, 'City news')
    const forNeighbourhood = await announce(neighbourhood, 'Neighbourhood news')
    const forEveryone = await announce(null, 'Everyone news')
    const forElsewhere = await announce(elsewhere, 'Elsewhere news')

    const cityIds = (await feedFor(viewer, city)).posts.map(p => p.id)
    expect(cityIds).toEqual(expect.arrayContaining([forCity, forEveryone]))
    expect(cityIds).not.toContain(forNeighbourhood)
    expect(cityIds).not.toContain(forElsewhere)

    const neighbourhoodIds = (await feedFor(planter, neighbourhood)).posts.map(p => p.id)
    expect(neighbourhoodIds).toEqual(expect.arrayContaining([forCity, forNeighbourhood, forEveryone]))
    expect(neighbourhoodIds).not.toContain(forElsewhere)
  })

  it('counts approved trees from inside the community', async () => {
    const { stats, topPlanters } = await feedFor(viewer, city)

    // One planted tree from the approved-log test above, plus neighbourhoodTree.
    expect(stats!.trees).toBe(2)
    expect(stats!.members).toBe(2)
    expect(topPlanters[0]).toMatchObject({ trees: 2 })
  })

  it('lists only future events, soonest first', async () => {
    const insert = (title: string, offsetDays: number) => serviceClient.from('feed_posts').insert({
      kind: 'announcement',
      category: 'upcoming_events',
      title,
      community_id: city,
      event_at: new Date(Date.now() + offsetDays * 86_400_000).toISOString(),
    })
    await Promise.all([insert('Later', 10), insert('Sooner', 2), insert('Past', -2)])

    const { events } = await feedFor(viewer, city)

    expect(events.map(e => e.title)).toEqual(['Sooner', 'Later'])
  })
})

describe('likes', () => {
  let postId: string

  beforeAll(async () => {
    const tree = await logTree(neighbourhood)
    await review(tree, 'approved')
    postId = (await activityPostsFor(tree))[0]!.id
  })

  async function likes() {
    const { data } = await serviceClient.from('post_likes').select('profile_id').eq('post_id', postId)
    return data!.map(l => l.profile_id)
  }

  it('records a like once, however often it is sent', async () => {
    Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(viewer.authUser.id) })
    setRouterParams({ id: postId })

    await like(createTestEvent())
    await like(createTestEvent())

    expect(await likes()).toEqual([viewer.profile.id])
  })

  it('shows the like on the feed', async () => {
    const { posts } = await feedFor(planter, neighbourhood)
    const post = posts.find(p => p.id === postId)!

    expect(post).toMatchObject({ isMine: true, likeCount: 1, likedByMe: false })
    expect(post.likers).toHaveLength(1)
  })

  it('removes the caller\'s like', async () => {
    Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(viewer.authUser.id) })
    setRouterParams({ id: postId })

    await unlike(createTestEvent())

    expect(await likes()).toEqual([])
  })

  it('answers 404 for a post that does not exist', async () => {
    Object.assign(globalThis, { authUserId: vi.fn().mockResolvedValue(viewer.authUser.id) })
    setRouterParams({ id: randomUUID() })

    await expect(like(createTestEvent())).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('access', () => {
  it('lets anyone read posts and likes', async () => {
    const { error: postsError } = await anonClient().from('feed_posts').select('id').limit(1)
    const { error: likesError } = await anonClient().from('post_likes').select('post_id').limit(1)
    expect(postsError).toBeNull()
    expect(likesError).toBeNull()
  })

  // Writes go through the endpoints, which check who is asking.
  it('refuses direct writes from a signed-in member', async () => {
    const client = await signedInClient(viewer.authUser.email!)

    const { error: postError } = await client.from('feed_posts').insert({
      kind: 'announcement',
      category: 'latest_news',
      title: 'Self-published',
      author_id: viewer.profile.id,
    })
    expect(postError?.code).toBe('42501')

    const { data: anyPost } = await serviceClient.from('feed_posts').select('id').limit(1).single()
    const { error: likeError } = await client.from('post_likes').insert({ post_id: anyPost!.id, profile_id: viewer.profile.id })
    expect(likeError?.code).toBe('42501')
  })
})
