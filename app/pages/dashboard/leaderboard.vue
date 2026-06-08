<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const authUserId = useAuthUserId()

const leaders = ref<any[]>([])
const loading = ref(true)
const currentUserRank = ref<number | null>(null)

onMounted(async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(50)
  leaders.value = data || []

  if (authUserId.value) {
    const idx = leaders.value.findIndex(l => l.auth_user_id === authUserId.value)
    if (idx >= 0) { currentUserRank.value = idx + 1 }
  }

  loading.value = false
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Leaderboard
      </h1>
      <p class="text-gray-600 mt-1">
        Top tree planters in the community.
        <span v-if="currentUserRank" class="text-green-600 font-medium">You're #{{ currentUserRank }}!</span>
      </p>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading leaderboard...
      </div>
      <div v-else-if="leaders.length === 0" class="p-6 text-center text-gray-500">
        No rankings yet. Plant a tree to get started!
      </div>
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="(leader, index) in leaders"
          :key="leader.id"
          class="px-6 py-4 flex items-center gap-4"
          :class="leader.auth_user_id === authUserId ? 'bg-green-50' : ''"
        >
          <!-- Rank -->
          <div class="w-8 text-center flex-shrink-0">
            <span v-if="index === 0" class="text-2xl">🥇</span>
            <span v-else-if="index === 1" class="text-2xl">🥈</span>
            <span v-else-if="index === 2" class="text-2xl">🥉</span>
            <span v-else class="text-sm font-medium text-gray-500">{{ index + 1 }}</span>
          </div>

          <!-- Avatar -->
          <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
            {{ (leader.display_name || 'U')[0].toUpperCase() }}
          </div>

          <!-- Name -->
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 truncate">
              {{ leader.display_name || 'Anonymous' }}
              <span v-if="leader.auth_user_id === authUserId" class="text-xs text-green-600 font-normal">(you)</span>
            </div>
          </div>

          <!-- Points -->
          <div class="text-right flex-shrink-0">
            <div class="font-bold text-green-600">
              {{ leader.total_points || 0 }}
            </div>
            <div class="text-xs text-gray-500">
              points
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
