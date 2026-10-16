import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/feed.get'
import { captureError, createTestEvent, setQuery } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

// Utrecht contains Lombok. The viewer (profile-me) is a Lombok member.
const COMMUNITIES = [
  { id: 'utrecht', name: 'Utrecht', description: 'The city', parent_community_id: null },
  { id: 'lombok', name: 'Lombok', description: 'A neighbourhood', parent_community_id: 'utrecht' },
]

function activityRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    kind: 'activity',
    category: null,
    title: null,
    body: null,
    photo_url: null,
    event_at: null,
    created_at: '2026-10-16T10:00:00Z',
    author_id: 'profile-other',
    communities: { name: 'Lombok' },
    profiles: { display_name: 'Ada', avatar_url: null },
    trees: { id: 'tree-1', source: 'planted', quantity: 1, photo_urls: ['https://photos/oak.jpg'], tree_species: { common_name: 'English Oak' } },
    post_likes: [],
    ...overrides,
  }
}

function withTables(tables: Record<string, TableConfig> = {}) {
  const supabase = createSupabaseMock({
    profiles: { data: { id: 'profile-me' } },
    // Answers both membership queries: the viewer's own, and the community's.
    community_members: { data: [{ community_id: 'lombok', profile_id: 'profile-me' }] },
    communities: { data: COMMUNITIES },
    feed_posts: { data: [activityRow()] },
    trees: { data: [] },
    ...tables,
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('GET /api/dashboard/feed', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    authUserId.mockReset().mockResolvedValue('auth-user-1')
    // Nitro auto-imports these from server/utils; they have their own tests.
    Object.assign(globalThis, { authUserId })
    setQuery({})
  })

  it('throws 401 without an authenticated user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withTables()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 404 when the user has no profile', async () => {
    withTables({ profiles: { data: null } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(404)
  })

  it('returns no community when the user has joined none', async () => {
    const supabase = withTables({ community_members: { data: [] } })

    const feed = await handler(createTestEvent())

    expect(feed.community).toBeNull()
    expect(feed.posts).toEqual([])
    expect(supabase.callsFor('feed_posts')).toHaveLength(0)
  })

  it('defaults to one of the user\'s own communities', async () => {
    withTables()

    const feed = await handler(createTestEvent())

    expect(feed.community).toMatchObject({ id: 'lombok', name: 'Lombok', isMember: true })
    expect(feed.communities).toEqual([{ id: 'lombok', name: 'Lombok' }])
  })

  it('opens the requested community, even one the user hasn\'t joined', async () => {
    setQuery({ community_id: 'utrecht' })
    withTables()

    const feed = await handler(createTestEvent())

    expect(feed.community).toMatchObject({ id: 'utrecht', isMember: false })
  })

  it('reads announcements from the community and those containing it, and activity from it and those inside it', async () => {
    setQuery({ community_id: 'utrecht' })
    const supabase = withTables()

    await handler(createTestEvent())

    const [posts, events] = supabase.callsFor('feed_posts')
    const filter = posts!.filters.find(f => f.method === 'or')!.value as string
    expect(filter).toContain('and(kind.eq.announcement,community_id.is.null)')
    expect(filter).toContain('and(kind.eq.announcement,community_id.in.(utrecht))')
    expect(filter).toContain('and(kind.eq.activity,community_id.in.(utrecht,lombok))')
    // Logs with no community show in their planter's communities.
    expect(filter).toContain('and(kind.eq.activity,community_id.is.null,author_id.in.(profile-me))')

    expect(events!.filters).toContainEqual({ method: 'eq', column: 'category', value: 'upcoming_events' })
    expect(events!.filters.find(f => f.method === 'or')!.value).not.toContain('kind.eq.activity')
    expect(supabase.callFor('trees').filters).toEqual([
      { method: 'in', column: 'community_id', value: ['utrecht', 'lombok'] },
      { method: 'eq', column: 'review_status', value: 'approved' },
    ])
  })

  it('includes announcements from communities containing a neighbourhood', async () => {
    setQuery({ community_id: 'lombok' })
    const supabase = withTables()

    await handler(createTestEvent())

    const filter = supabase.callsFor('feed_posts')[0]!.filters.find(f => f.method === 'or')!.value as string
    expect(filter).toContain('and(kind.eq.announcement,community_id.in.(lombok,utrecht))')
    expect(filter).toContain('and(kind.eq.activity,community_id.in.(lombok))')
  })

  it('shapes an activity post with its likes', async () => {
    withTables({
      feed_posts: {
        data: [activityRow({
          post_likes: [
            { profile_id: 'profile-me', profiles: { display_name: 'Me' } },
            { profile_id: 'profile-3', profiles: { display_name: 'Bo' } },
          ],
        })],
      },
    })

    const { posts } = await handler(createTestEvent())

    expect(posts[0]).toMatchObject({
      kind: 'activity',
      author: { name: 'Ada' },
      tree: { id: 'tree-1', source: 'planted', quantity: 1, species: 'English Oak', photoUrl: 'https://photos/oak.jpg' },
      isMine: false,
      likeCount: 2,
      likedByMe: true,
      likers: ['Bo'],
    })
  })

  // Donation and earning proofs are often receipts or screenshots.
  it.each(['donated', 'earned'])('does not expose the proof photo of a %s log', async (source) => {
    withTables({
      feed_posts: { data: [activityRow({ trees: { source, quantity: 5, photo_urls: ['https://photos/receipt.jpg'], tree_species: null } })] },
    })

    const { posts } = await handler(createTestEvent())

    expect(posts[0]!.tree).toMatchObject({ source, quantity: 5, photoUrl: null })
  })

  it('marks the viewer\'s own posts', async () => {
    withTables({ feed_posts: { data: [activityRow({ author_id: 'profile-me' })] } })

    const { posts } = await handler(createTestEvent())

    expect(posts[0]!.isMine).toBe(true)
  })

  it('totals approved trees and ranks planters by trees', async () => {
    const thisMonth = new Date().toISOString()
    withTables({
      trees: {
        data: [
          { planted_by: 'p-1', source: 'planted', quantity: 1, planted_at: '2020-01-01T00:00:00Z', profiles: { display_name: 'Ada', avatar_url: null }, tree_species: { avg_co2_kg_per_year: 22.5 } },
          { planted_by: 'p-2', source: 'donated', quantity: 10, planted_at: thisMonth, profiles: { display_name: 'Bo', avatar_url: null }, tree_species: null },
          { planted_by: 'p-1', source: 'planted', quantity: 1, planted_at: thisMonth, profiles: { display_name: 'Ada', avatar_url: null }, tree_species: { avg_co2_kg_per_year: 10 } },
        ],
      },
    })

    const feed = await handler(createTestEvent())

    // CO₂ counts only the planted trees with a species: 22.5 + 10, rounded.
    expect(feed.stats).toEqual({ trees: 12, treesThisMonth: 11, members: 1, co2KgPerYear: 33 })
    expect(feed.topPlanters).toEqual([
      { name: 'Bo', avatarUrl: null, trees: 10 },
      { name: 'Ada', avatarUrl: null, trees: 2 },
    ])
  })

  it('throws 500 when the posts query fails', async () => {
    withTables({ feed_posts: { data: null, error: { message: 'boom' } } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('boom')
  })
})
