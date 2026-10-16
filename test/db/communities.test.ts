import type { User } from '@supabase/supabase-js'
import type { Tables } from '~/types/database.types'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import setRole from '~~/server/api/cms/communities/[id]/members/[profileId].put'
import decideRequest from '~~/server/api/cms/community-requests/[id].put'
import requestCommunity from '~~/server/api/dashboard/community-requests.post'
import feed from '~~/server/api/dashboard/feed.get'
import post from '~~/server/api/dashboard/feed/posts.post'
import removePost from '~~/server/api/dashboard/feed/posts/[id].delete'
import member from '~~/server/api/dashboard/members/[id].get'
import { createTestUser, deleteTestUser, serviceClient, signedInClient } from '../helpers/local-supabase'
import { createTestEvent, setQuery, setRequestBody, setRouterParams } from '../helpers/nitro'
import { serverSupabaseServiceRole } from '../mocks/supabase-server'

// Community admins, community requests and member profiles against the real
// schema, including the RLS fix that stops members granting themselves a role.

interface TestUser { authUser: User, profile: Tables<'profiles'> }

let organiser: TestUser
let member1: TestUser
let community: string
const created: string[] = []

function as(user: TestUser) {
  Object.assign(globalThis, {
    authUserId: vi.fn().mockResolvedValue(user.authUser.id),
    // Stands in for a site admin in the CMS endpoints.
    requireAdmin: vi.fn().mockResolvedValue({ user: {}, profile: { id: user.profile.id, role: 'admin' } }),
  })
}

function call<T>(handler: (e: ReturnType<typeof createTestEvent>) => Promise<T>, params: Record<string, string> = {}, body?: unknown) {
  setRouterParams(params)
  if (body !== undefined) { setRequestBody(body) }
  return handler(createTestEvent())
}

const NEWS = { category: 'latest_news', title: 'Spades have arrived', body: 'Pick them up on Saturday.' }

beforeAll(async () => {
  organiser = await createTestUser()
  member1 = await createTestUser()
  const { data } = await serviceClient.from('communities').insert({ name: 'Test Troupe', slug: `test-${randomUUID()}` }).select('id').single()
  community = data!.id
  created.push(community)
  await serviceClient.from('community_members').insert([
    { profile_id: organiser.profile.id, community_id: community },
    { profile_id: member1.profile.id, community_id: community },
  ])
})

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(serviceClient as never)
})

afterAll(async () => {
  await Promise.all([organiser, member1].filter(u => u?.profile).map(u => deleteTestUser(u.authUser.id, u.profile.id)))
  await serviceClient.from('communities').delete().in('id', created)
})

describe('community roles', () => {
  // The baseline policy let a member insert their own membership with any role.
  it('stops a member joining a community as its admin through the REST API', async () => {
    const { data } = await serviceClient.from('communities').insert({ name: 'Other', slug: `test-${randomUUID()}` }).select('id').single()
    created.push(data!.id)
    const client = await signedInClient(member1.authUser.email!)

    const asAdmin = await client.from('community_members').insert({ profile_id: member1.profile.id, community_id: data!.id, role: 'admin' })
    expect(asAdmin.error?.code).toBe('42501')

    const asMember = await client.from('community_members').insert({ profile_id: member1.profile.id, community_id: data!.id })
    expect(asMember.error).toBeNull()
  })

  it('refuses a plain member posting to the community feed', async () => {
    as(member1)
    await expect(call(post, {}, { ...NEWS, community_id: community })).rejects.toMatchObject({ statusCode: 403 })
  })

  it('lets a site admin make someone a community admin, who can then post and delete', async () => {
    as(organiser)
    await call(setRole, { id: community, profileId: organiser.profile.id }, { role: 'admin' })

    // requireViewer reads the real profile, whose site role is 'user'.
    const { id } = await call(post, {}, { ...NEWS, community_id: community })

    setQuery({ community_id: community })
    const asOrganiser = await call(feed)
    expect(asOrganiser.community?.canPost).toBe(true)
    expect(asOrganiser.posts.find(p => p.id === id)).toMatchObject({ title: 'Spades have arrived', canDelete: true })

    as(member1)
    const asMember = await call(feed)
    expect(asMember.community?.canPost).toBe(false)
    expect(asMember.posts.find(p => p.id === id)?.canDelete).toBe(false)
    await expect(call(removePost, { id })).rejects.toMatchObject({ statusCode: 403 })

    as(organiser)
    await call(removePost, { id })
    const { count } = await serviceClient.from('feed_posts').select('*', { count: 'exact', head: true }).eq('id', id)
    expect(count).toBe(0)
  })
})

describe('community requests', () => {
  it('creates the community on approval, with the requester as its admin', async () => {
    as(member1)
    const { id } = await call(requestCommunity, {}, { name: 'Test Request Troupe', area: 'Testville', parent_community_id: community })

    const result = await call(decideRequest, { id }, { decision: 'approved' })
    created.push(result.communityId!)

    const { data: newCommunity } = await serviceClient.from('communities').select('name, slug, parent_community_id').eq('id', result.communityId!).single()
    expect(newCommunity).toMatchObject({ name: 'Test Request Troupe', parent_community_id: community })
    expect(newCommunity!.slug).toMatch(/^test-request-troupe/)

    const { data: membership } = await serviceClient.from('community_members').select('role').eq('community_id', result.communityId!).eq('profile_id', member1.profile.id).single()
    expect(membership!.role).toBe('admin')

    await expect(call(decideRequest, { id }, { decision: 'declined' })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('lets a requester see their own requests, and nobody else\'s', async () => {
    as(organiser)
    const { id } = await call(requestCommunity, {}, { name: 'Private Plans' })

    const own = await (await signedInClient(organiser.authUser.email!)).from('community_requests').select('id').eq('id', id)
    const others = await (await signedInClient(member1.authUser.email!)).from('community_requests').select('id').eq('id', id)
    expect(own.data).toHaveLength(1)
    expect(others.data).toHaveLength(0)
  })
})

describe('member profiles', () => {
  it('shows a member\'s public details and communities, without their email', async () => {
    as(organiser)
    const profile = await call(member, { id: member1.profile.id })

    const { data: stored } = await serviceClient.from('profiles').select('total_points').eq('id', member1.profile.id).single()
    // Joining communities earns points, so this is no longer 0.
    expect(profile).toMatchObject({ id: member1.profile.id, isMe: false, points: stored!.total_points })
    expect(profile.points).toBeGreaterThan(0)
    expect(profile.communities.map((c: any) => c.id)).toContain(community)
    expect(JSON.stringify(profile)).not.toContain(member1.authUser.email!)
  })
})
