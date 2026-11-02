<script setup lang="ts">
import type { FeedPost } from '~/components/FeedPostCard.vue'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Community feed' })

interface Feed {
  communities: { id: string, name: string }[]
  community: { id: string, name: string, description: string | null, isMember: boolean, canPost: boolean } | null
  stats: { trees: number, treesThisMonth: number, members: number, co2KgPerYear: number } | null
  events: FeedPost[]
  posts: FeedPost[]
  topPlanters: { name: string, avatarUrl: string | null, trees: number }[]
}

type Filter = 'all' | 'activity' | 'latest_news' | 'upcoming_events'

const FILTERS: { value: Filter, label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'activity', label: 'Trees' },
  { value: 'latest_news', label: 'News' },
  { value: 'upcoming_events', label: 'Events' },
]

const route = useRoute()
const router = useRouter()

const feed = ref<Feed | null>(null)
const loading = ref(true)
const error = ref('')
const filter = ref<Filter>('all')

const selectedId = computed(() => typeof route.query.community === 'string' ? route.query.community : undefined)

async function loadFeed() {
  loading.value = true
  error.value = ''
  try {
    feed.value = await $fetch<Feed>('/api/dashboard/feed', { query: { community_id: selectedId.value } })
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Could not load the feed'
  }
  loading.value = false
}

function selectCommunity(id: string) {
  router.replace({ query: { ...route.query, community: id } })
}

const visiblePosts = computed(() => {
  const posts = feed.value?.posts ?? []
  if (filter.value === 'all') { return posts }
  if (filter.value === 'activity') { return posts.filter(p => p.kind === 'activity') }
  return posts.filter(p => p.category === filter.value)
})

// Optimistic: flip it straight away, put it back if the request fails. Events
// and posts are separate objects, so update every copy of the post.
async function toggleLike(post: FeedPost) {
  const liking = !post.likedByMe
  const copies = [...(feed.value?.posts ?? []), ...(feed.value?.events ?? [])].filter(p => p.id === post.id)
  const apply = (liked: boolean) => {
    for (const p of copies) {
      p.likedByMe = liked
      p.likeCount += liked ? 1 : -1
    }
  }
  apply(liking)
  try {
    await $fetch(`/api/dashboard/feed/posts/${post.id}/like`, { method: liking ? 'POST' : 'DELETE' })
  }
  catch {
    apply(!liking)
  }
}

// Community admins and moderators post announcements from here.
const composing = ref(false)
const posting = ref(false)
const postError = ref('')
const draft = reactive({ category: 'latest_news', title: '', body: '', event_at: '' })

async function publish() {
  if (!feed.value?.community) { return }
  posting.value = true
  postError.value = ''
  try {
    await $fetch('/api/dashboard/feed/posts', {
      method: 'POST',
      body: {
        community_id: feed.value.community.id,
        category: draft.category,
        title: draft.title,
        body: draft.body,
        // datetime-local has no timezone; read it as the poster's local time.
        event_at: draft.category === 'upcoming_events' && draft.event_at ? new Date(draft.event_at).toISOString() : null,
      },
    })
    Object.assign(draft, { category: 'latest_news', title: '', body: '', event_at: '' })
    composing.value = false
    await loadFeed()
  }
  catch (e: any) {
    postError.value = e.data?.message || e.message || 'Could not publish'
  }
  posting.value = false
}

async function deletePost(post: FeedPost) {
  // eslint-disable-next-line no-alert -- deleting a post needs confirmation
  if (!confirm('Delete this post?')) { return }
  try {
    await $fetch(`/api/dashboard/feed/posts/${post.id}`, { method: 'DELETE' })
    await loadFeed()
  }
  catch (e: any) {
    error.value = e.data?.message || 'Could not delete the post'
  }
}

function eventDay(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric' })
}
function eventMonth(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short' })
}
function eventTime(date: string) {
  return new Date(date).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })
}

watch(selectedId, loadFeed)
onMounted(loadFeed)
</script>

<template>
  <div>
    <div v-if="loading && !feed" class="text-center py-12 text-gray-500">
      Loading your community...
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <!-- Not in any community yet -->
    <div v-else-if="feed && !feed.community" class="max-w-lg mx-auto text-center py-16">
      <div class="text-5xl mb-4" aria-hidden="true">
        🌍
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        Find your troupe
      </h1>
      <p class="text-gray-600 mb-6">
        Join a community to see its events, news and everyone's latest trees.
      </p>
      <NuxtLink to="/dashboard/communities" class="bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">
        Browse communities
      </NuxtLink>
    </div>

    <template v-else-if="feed?.community">
      <!-- Community switcher -->
      <div v-if="feed.communities.length > 1" class="flex gap-2 flex-wrap mb-4">
        <button
          v-for="c in feed.communities"
          :key="c.id"
          type="button"
          class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="c.id === feed.community.id ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'"
          @click="selectCommunity(c.id)"
        >
          {{ c.name }}
        </button>
      </div>

      <!-- Hero -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white p-6 sm:p-10 mb-8">
        <div class="absolute -right-10 -top-10 text-[12rem] leading-none opacity-10 select-none" aria-hidden="true">
          🌳
        </div>
        <p class="text-green-100 text-sm font-medium uppercase tracking-wider mb-1">
          Your troupe
        </p>
        <h1 class="text-3xl sm:text-4xl font-bold mb-2">
          {{ feed.community.name }}
        </h1>
        <p v-if="feed.community.description" class="text-green-50 max-w-2xl">
          {{ feed.community.description }}
        </p>

        <dl v-if="feed.stats" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mt-8 max-w-3xl">
          <div class="bg-white/15 backdrop-blur rounded-2xl px-4 py-3">
            <dt class="text-xs sm:text-sm text-green-50">
              Trees
            </dt>
            <dd class="text-2xl sm:text-3xl font-bold">
              {{ feed.stats.trees.toLocaleString() }}
            </dd>
          </div>
          <div class="bg-white/15 backdrop-blur rounded-2xl px-4 py-3">
            <dt class="text-xs sm:text-sm text-green-50">
              This month
            </dt>
            <dd class="text-2xl sm:text-3xl font-bold">
              {{ feed.stats.treesThisMonth.toLocaleString() }}
            </dd>
          </div>
          <div class="bg-white/15 backdrop-blur rounded-2xl px-4 py-3">
            <dt class="text-xs sm:text-sm text-green-50">
              Members
            </dt>
            <dd class="text-2xl sm:text-3xl font-bold">
              {{ feed.stats.members.toLocaleString() }}
            </dd>
          </div>
          <div class="bg-white/15 backdrop-blur rounded-2xl px-4 py-3" title="An estimate from each planted tree's species">
            <dt class="text-xs sm:text-sm text-green-50">
              CO₂ absorbed / year
            </dt>
            <dd class="text-2xl sm:text-3xl font-bold">
              {{ formatCo2(feed.stats.co2KgPerYear) }}
            </dd>
          </div>
        </dl>

        <div class="flex flex-wrap gap-3 mt-8">
          <NuxtLink to="/dashboard/plant" class="bg-white text-green-700 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-green-50 transition-colors">
            🌱 Plant a tree
          </NuxtLink>
          <NuxtLink to="/dashboard/map" class="bg-white/15 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/25 transition-colors">
            See the map
          </NuxtLink>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Feed -->
        <div class="lg:col-span-2 order-2 lg:order-1">
          <div class="flex gap-2 flex-wrap mb-4">
            <button
              v-for="f in FILTERS"
              :key="f.value"
              type="button"
              class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              :class="filter === f.value ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'"
              @click="filter = f.value"
            >
              {{ f.label }}
            </button>
          </div>

          <!-- Community admins post here -->
          <div v-if="feed.community.canPost" class="mb-4">
            <button
              v-if="!composing"
              type="button"
              class="w-full text-left bg-white rounded-2xl border border-dashed border-green-300 px-5 py-4 text-green-700 font-medium hover:bg-green-50"
              @click="composing = true"
            >
              ＋ Post news or an event to {{ feed.community.name }}
            </button>
            <form v-else class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4" @submit.prevent="publish">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="post-category" class="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                  <select id="post-category" v-model="draft.category" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white">
                    <option v-for="(label, value) in FEED_CATEGORY_LABELS" :key="value" :value="value">
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div v-if="draft.category === 'upcoming_events'">
                  <label for="post-event-at" class="block text-sm font-medium text-gray-700 mb-1">Date and time</label>
                  <input id="post-event-at" v-model="draft.event_at" type="datetime-local" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
                </div>
              </div>
              <div>
                <label for="post-title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input id="post-title" v-model="draft.title" type="text" required maxlength="120" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
              </div>
              <div>
                <label for="post-body" class="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea id="post-body" v-model="draft.body" rows="3" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-y" />
              </div>
              <p v-if="postError" class="text-sm text-red-600">
                {{ postError }}
              </p>
              <div class="flex gap-3">
                <button type="submit" :disabled="posting" class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {{ posting ? 'Publishing...' : 'Publish' }}
                </button>
                <button type="button" class="text-sm text-gray-600" @click="composing = false">
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div v-if="visiblePosts.length === 0" class="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p class="text-gray-500 mb-2">
              Nothing here yet.
            </p>
            <NuxtLink to="/dashboard/plant" class="text-green-600 hover:text-green-700 font-medium">
              Log a tree and be the first →
            </NuxtLink>
          </div>

          <div v-else class="space-y-4">
            <FeedPostCard v-for="post in visiblePosts" :key="post.id" :post="post" @toggle-like="toggleLike" @delete="deletePost" />
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-6 order-1 lg:order-2">
          <section class="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 class="font-semibold text-gray-900 mb-4">
              Upcoming events
            </h2>
            <p v-if="feed.events.length === 0" class="text-sm text-gray-500">
              No events planned yet. Check back soon!
            </p>
            <ul v-else class="space-y-4">
              <li v-for="ev in feed.events" :key="ev.id" class="flex gap-3">
                <div class="w-12 h-14 rounded-xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center flex-shrink-0">
                  <span class="text-xs font-semibold uppercase text-sky-600">{{ eventMonth(ev.eventAt!) }}</span>
                  <span class="text-lg font-bold text-sky-900 leading-none">{{ eventDay(ev.eventAt!) }}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 leading-snug">
                    {{ ev.title }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ eventTime(ev.eventAt!) }} · {{ ev.communityName || 'All communities' }}
                  </p>
                  <button
                    type="button"
                    class="text-xs font-medium mt-1"
                    :class="ev.likedByMe ? 'text-green-700' : 'text-gray-500 hover:text-green-700'"
                    @click="toggleLike(ev)"
                  >
                    {{ ev.likedByMe ? '✓ Interested' : '+ I\'m interested' }}<template v-if="ev.likeCount">
                      · {{ ev.likeCount }}
                    </template>
                  </button>
                </div>
              </li>
            </ul>
          </section>

          <section class="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 class="font-semibold text-gray-900 mb-4">
              Top planters
            </h2>
            <p v-if="feed.topPlanters.length === 0" class="text-sm text-gray-500">
              No approved trees yet.
            </p>
            <ol v-else class="space-y-3">
              <li v-for="(planter, i) in feed.topPlanters" :key="planter.name + i" class="flex items-center gap-3">
                <span class="w-6 text-center text-lg" aria-hidden="true">{{ ['🥇', '🥈', '🥉'][i] ?? '' }}</span>
                <UserAvatar :name="planter.name" :url="planter.avatarUrl" size="sm" />
                <span class="flex-1 text-sm text-gray-900 truncate">{{ planter.name }}</span>
                <span class="text-sm font-semibold text-green-700">{{ planter.trees }}</span>
              </li>
            </ol>
            <NuxtLink to="/dashboard/leaderboard" class="block text-sm text-green-600 hover:text-green-700 font-medium mt-4">
              Full leaderboard →
            </NuxtLink>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
