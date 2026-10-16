<script setup lang="ts">
// One post in the community feed: an admin announcement or an automatic
// "just planted/donated/earned" post, with its like (congratulate) button.
export interface FeedPost {
  id: string
  kind: 'announcement' | 'activity'
  category: string | null
  title: string | null
  body: string | null
  photoUrl: string | null
  eventAt: string | null
  createdAt: string
  communityName: string | null
  author: { name: string, avatarUrl: string | null }
  tree: { source: string, quantity: number, species: string | null, photoUrl: string | null } | null
  isMine: boolean
  likeCount: number
  likedByMe: boolean
  likers: string[]
}

const props = defineProps<{ post: FeedPost }>()
const emit = defineEmits<{ toggleLike: [post: FeedPost] }>()

const ACTIVITY = {
  planted: { emoji: '🌳', ring: 'bg-green-100' },
  donated: { emoji: '💚', ring: 'bg-emerald-100' },
  earned: { emoji: '✨', ring: 'bg-amber-100' },
} as Record<string, { emoji: string, ring: string }>

const activity = computed(() => ACTIVITY[props.post.tree?.source ?? 'planted'] ?? ACTIVITY.planted!)

const achievement = computed(() => {
  const tree = props.post.tree
  if (!tree) { return '' }
  const trees = tree.quantity === 1 ? 'a tree' : `${tree.quantity} trees`
  if (tree.source === 'donated') { return `donated ${trees}` }
  if (tree.source === 'earned') { return `earned ${trees}` }
  const species = tree.species
  return species ? `planted ${/^[aeiou]/i.test(species) ? 'an' : 'a'} ${species}` : 'planted a tree'
})

const likeSummary = computed(() => {
  const { likers, likedByMe, isMine, kind } = props.post
  const names = likedByMe ? ['You', ...likers] : likers
  if (!names.length) { return '' }

  let who = names.join(' and ')
  if (names.length > 2) {
    const rest = names.length - 2
    who = `${names[0]}, ${names[1]} and ${rest} ${rest === 1 ? 'other' : 'others'}`
  }
  return isMine && kind === 'activity' ? `${who} congratulated you` : `${who} liked this`
})

const likeLabel = computed(() => {
  if (props.post.kind === 'activity') { return props.post.likedByMe ? 'Congratulated' : 'Congratulate' }
  return props.post.likedByMe ? 'Liked' : 'Like'
})

const eventDate = computed(() => props.post.eventAt
  ? new Date(props.post.eventAt).toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
  : '')
</script>

<template>
  <article class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <!-- Activity: X just planted/donated/earned -->
    <template v-if="post.kind === 'activity'">
      <div class="p-5 flex items-start gap-4">
        <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" :class="activity.ring" aria-hidden="true">
          {{ activity.emoji }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-gray-900">
            <span class="font-semibold">{{ post.isMine ? 'You' : post.author.name }}</span>
            just {{ achievement }}!
          </p>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ timeAgo(post.createdAt) }}<template v-if="post.communityName">
              · {{ post.communityName }}
            </template>
          </p>
        </div>
      </div>
      <img v-if="post.tree?.photoUrl" :src="post.tree.photoUrl" :alt="`${post.author.name}'s ${post.tree.species || 'tree'}`" class="w-full max-h-96 object-cover">
    </template>

    <!-- Announcement from an admin -->
    <template v-else>
      <img v-if="post.photoUrl" :src="post.photoUrl" alt="" class="w-full max-h-80 object-cover">
      <div class="p-5">
        <div class="flex items-center gap-2 mb-2">
          <span
            class="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
            :class="post.category === 'upcoming_events' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'"
          >
            {{ FEED_CATEGORY_LABELS[post.category ?? ''] ?? 'News' }}
          </span>
          <span class="text-xs text-gray-500">
            {{ timeAgo(post.createdAt) }} · {{ post.communityName || 'All communities' }}
          </span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900">
          {{ post.title }}
        </h3>
        <p v-if="eventDate" class="text-sm font-medium text-sky-700 mt-1">
          📅 {{ eventDate }}
        </p>
        <p v-if="post.body" class="text-gray-700 mt-2 whitespace-pre-line">
          {{ post.body }}
        </p>
      </div>
    </template>

    <footer v-if="!post.isMine || post.kind !== 'activity' || likeSummary" class="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
      <button
        v-if="!(post.isMine && post.kind === 'activity')"
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="post.likedByMe ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'"
        :aria-pressed="post.likedByMe"
        @click="emit('toggleLike', post)"
      >
        <span aria-hidden="true">{{ post.kind === 'activity' ? '🎉' : '👍' }}</span>
        {{ likeLabel }}
      </button>
      <span v-if="likeSummary" class="text-sm text-gray-500">
        {{ likeSummary }}
      </span>
    </footer>
  </article>
</template>
