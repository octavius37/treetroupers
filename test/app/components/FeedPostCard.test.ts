import type { FeedPost } from '~/components/FeedPostCard.vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import FeedPostCard from '~/components/FeedPostCard.vue'

function post(overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    id: 'post-1',
    kind: 'activity',
    category: null,
    title: null,
    body: null,
    photoUrl: null,
    eventAt: null,
    createdAt: new Date().toISOString(),
    communityName: 'Lombok',
    author: { name: 'Ada', avatarUrl: null },
    tree: { source: 'planted', quantity: 1, species: 'English Oak', photoUrl: null },
    isMine: false,
    likeCount: 0,
    likedByMe: false,
    likers: [],
    ...overrides,
  }
}

async function mount(p: FeedPost) {
  return mountSuspended(FeedPostCard, { props: { post: p } })
}

describe('FeedPostCard', () => {
  it.each([
    [{ source: 'planted', quantity: 1, species: 'English Oak', photoUrl: null }, 'Ada just planted an English Oak!'],
    [{ source: 'planted', quantity: 1, species: 'Silver Birch', photoUrl: null }, 'Ada just planted a Silver Birch!'],
    [{ source: 'planted', quantity: 1, species: null, photoUrl: null }, 'Ada just planted a tree!'],
    [{ source: 'donated', quantity: 10, species: null, photoUrl: null }, 'Ada just donated 10 trees!'],
    [{ source: 'earned', quantity: 1, species: null, photoUrl: null }, 'Ada just earned a tree!'],
  ])('announces %o', async (tree, text) => {
    const wrapper = await mount(post({ tree }))
    expect(wrapper.text().replace(/\s+/g, ' ')).toContain(text)
  })

  it('emits toggleLike from the congratulate button', async () => {
    const p = post()
    const wrapper = await mount(p)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('toggleLike')).toEqual([[p]])
  })

  it('has no congratulate button on your own achievement, but shows who congratulated you', async () => {
    const wrapper = await mount(post({ isMine: true, likeCount: 3, likers: ['Bo', 'Cy', 'Di'] }))

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).toContain('You just planted')
    expect(wrapper.text()).toContain('Bo, Cy and 1 other congratulated you')
  })

  it('puts you first in the list of likers', async () => {
    const wrapper = await mount(post({ kind: 'announcement', category: 'latest_news', title: 'News', tree: null, likedByMe: true, likeCount: 2, likers: ['Bo'] }))

    expect(wrapper.text()).toContain('You and Bo liked this')
    expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')
  })

  it('shows an event\'s heading and date', async () => {
    const wrapper = await mount(post({
      kind: 'announcement',
      category: 'upcoming_events',
      title: 'Planting day',
      eventAt: '2026-10-28T10:00:00Z',
      communityName: null,
      tree: null,
    }))

    expect(wrapper.text()).toContain('Upcoming events')
    expect(wrapper.text()).toContain('Planting day')
    expect(wrapper.text()).toContain('All communities')
    expect(wrapper.text()).toContain('📅')
  })
})
