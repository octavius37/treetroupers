import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import create from '~~/server/api/cms/feed-posts.post'
import remove from '~~/server/api/cms/feed-posts/[id].delete'
import { captureError, createTestEvent, setRequestBody, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const requireAdmin = vi.fn()

const NEWS = { category: 'latest_news', title: '  New spots  ', body: 'Fifteen of them', community_id: 'utrecht' }

function withPosts(config: TableConfig = { data: { id: 'post-1' } }) {
  const supabase = createSupabaseMock({ feed_posts: config })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  requireAdmin.mockReset().mockResolvedValue({ user: { sub: 'auth-1' }, profile: { id: 'profile-admin', role: 'admin' } })
  Object.assign(globalThis, { requireAdmin })
  setRequestBody({ ...NEWS })
  setRouterParams({ id: 'post-1' })
})

describe('POST /api/cms/feed-posts', () => {
  it('requires an admin before doing anything else', async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    const supabase = withPosts()

    const error = await captureError(() => create(createTestEvent()))

    expect(error.statusCode).toBe(403)
    expect(supabase.calls).toHaveLength(0)
  })

  it('publishes an announcement as the admin', async () => {
    const supabase = withPosts()

    await create(createTestEvent())

    expect(supabase.callFor('feed_posts').payload).toEqual({
      kind: 'announcement',
      community_id: 'utrecht',
      author_id: 'profile-admin',
      category: 'latest_news',
      title: 'New spots',
      body: 'Fifteen of them',
      photo_url: null,
      event_at: null,
    })
  })

  it('posts to everyone when no community is chosen', async () => {
    setRequestBody({ ...NEWS, community_id: '' })
    const supabase = withPosts()

    await create(createTestEvent())

    expect((supabase.callFor('feed_posts').payload as { community_id: unknown }).community_id).toBeNull()
  })

  it('stores an event\'s date', async () => {
    setRequestBody({ ...NEWS, category: 'upcoming_events', event_at: '2026-11-02T13:00:00.000Z' })
    const supabase = withPosts()

    await create(createTestEvent())

    expect((supabase.callFor('feed_posts').payload as { event_at: unknown }).event_at).toBe('2026-11-02T13:00:00.000Z')
  })

  it('drops a date sent with a news post', async () => {
    setRequestBody({ ...NEWS, event_at: '2026-11-02T13:00:00.000Z' })
    const supabase = withPosts()

    await create(createTestEvent())

    expect((supabase.callFor('feed_posts').payload as { event_at: unknown }).event_at).toBeNull()
  })

  it.each([
    ['an unknown heading', { ...NEWS, category: 'gossip' }],
    ['no title', { ...NEWS, title: '   ' }],
    ['an event with no date', { ...NEWS, category: 'upcoming_events' }],
    ['an event with a nonsense date', { ...NEWS, category: 'upcoming_events', event_at: 'soon' }],
    ['a null body', null],
  ])('throws 400 for %s', async (_label, body) => {
    setRequestBody(body)
    const supabase = withPosts()

    const error = await captureError(() => create(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(supabase.calls).toHaveLength(0)
  })
})

describe('DELETE /api/cms/feed-posts/:id', () => {
  it('requires an admin before doing anything else', async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    const supabase = withPosts()

    const error = await captureError(() => remove(createTestEvent()))

    expect(error.statusCode).toBe(403)
    expect(supabase.calls).toHaveLength(0)
  })

  it('deletes the post', async () => {
    const supabase = withPosts({ data: null })

    await expect(remove(createTestEvent())).resolves.toEqual({ success: true })

    const call = supabase.callFor('feed_posts')
    expect(call.operation).toBe('delete')
    expect(call.filters).toEqual([{ method: 'eq', column: 'id', value: 'post-1' }])
  })
})
