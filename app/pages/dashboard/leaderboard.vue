<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Leaderboard' })

interface LeaderRow {
  id: string
  name: string
  avatarUrl: string | null
  points: number
  rank: number
  isMe: boolean
}

const supabase = useSupabaseClient()
const authUserId = useAuthUserId()

const period = ref<'all' | 'month'>('all')
const communityId = ref('')
const communities = ref<{ id: string, name: string }[]>([])
const rows = ref<LeaderRow[]>([])
const me = ref<LeaderRow | null>(null)
const loading = ref(true)
const error = ref('')

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await $fetch<{ rows: LeaderRow[], me: LeaderRow | null }>('/api/dashboard/leaderboard', {
      query: { period: period.value, community_id: communityId.value || undefined },
    })
    rows.value = result.rows
    me.value = result.me
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Could not load the leaderboard'
  }
  loading.value = false
}

onMounted(async () => {
  if (authUserId.value) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', authUserId.value).single()
    if (profile) {
      const { data } = await supabase.from('community_members').select('communities(id, name)').eq('profile_id', profile.id)
      communities.value = (data ?? []).map((m: any) => m.communities).filter(Boolean)
    }
  }
  await load()
})

watch([period, communityId], load)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Leaderboard
      </h1>
      <p class="text-gray-600 mt-1">
        Top tree planters.
        <span v-if="me" class="text-green-600 font-medium">You're #{{ me.rank }} with {{ me.points }} points!</span>
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <button
        v-for="p in ([['all', 'All time'], ['month', 'This month']] as const)"
        :key="p[0]"
        type="button"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="period === p[0] ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'"
        @click="period = p[0]"
      >
        {{ p[1] }}
      </button>
      <select
        v-model="communityId"
        aria-label="Community"
        class="ml-auto px-4 py-1.5 border border-gray-300 rounded-full text-sm bg-white text-gray-700"
      >
        <option value="">
          Everyone
        </option>
        <option v-for="c in communities" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>
    </div>

    <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading leaderboard...
      </div>
      <div v-else-if="rows.length === 0" class="p-6 text-center text-gray-500">
        {{ period === 'month' ? 'Nobody has scored this month yet. Be the first!' : 'No rankings yet. Plant a tree to get started!' }}
      </div>
      <div v-else class="divide-y divide-gray-100">
        <NuxtLink
          v-for="leader in rows"
          :key="leader.id"
          :to="`/dashboard/members/${leader.id}`"
          class="px-6 py-4 flex items-center gap-4 hover:bg-gray-50"
          :class="leader.isMe ? 'bg-green-50' : ''"
        >
          <div class="w-8 text-center flex-shrink-0">
            <span v-if="MEDALS[leader.rank]" class="text-2xl" :aria-label="`Rank ${leader.rank}`">{{ MEDALS[leader.rank] }}</span>
            <span v-else class="text-sm font-medium text-gray-500">{{ leader.rank }}</span>
          </div>

          <UserAvatar :name="leader.name" :url="leader.avatarUrl" />

          <div class="flex-1 min-w-0 font-medium text-gray-900 truncate">
            {{ leader.name }}
            <span v-if="leader.isMe" class="text-xs text-green-600 font-normal">(you)</span>
          </div>

          <div class="text-right flex-shrink-0">
            <div class="font-bold text-green-600">
              {{ leader.points }}
            </div>
            <div class="text-xs text-gray-500">
              points
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <p v-if="me && !rows.some(r => r.isMe)" class="mt-3 text-sm text-gray-600 text-center">
      You're #{{ me.rank }} with {{ me.points }} points. Keep planting to climb into the top {{ rows.length }}!
    </p>
  </div>
</template>
