<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()

const updates = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await supabase
    .from('tree_updates')
    .select('*, trees(*, tree_species(common_name)), profiles!author_id(*)')
    .order('created_at', { ascending: false })
    .limit(50)
  updates.value = data || []
  loading.value = false
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Community Feed
      </h1>
      <p class="text-gray-600 mt-1">
        Updates from your tree troupe communities.
      </p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      Loading feed...
    </div>

    <div v-else-if="updates.length === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </div>
      <p class="text-gray-500">
        No updates yet. Be the first to post!
      </p>
      <NuxtLink to="/dashboard/plant" class="text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
        Plant a tree to get started →
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <div v-for="update in updates" :key="update.id" class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-sm">
            {{ (update.profiles?.display_name || 'U')[0].toUpperCase() }}
          </div>
          <div>
            <div class="font-medium text-gray-900">
              {{ update.profiles?.display_name || 'Anonymous' }}
            </div>
            <div class="text-xs text-gray-500">
              {{ new Date(update.created_at).toLocaleDateString() }}
            </div>
          </div>
        </div>

        <p class="text-gray-700 mb-3">
          {{ update.content }}
        </p>

        <div v-if="update.photo_urls?.length" class="mb-3">
          <div class="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            [Update photo placeholder]
          </div>
        </div>

        <div v-if="update.trees" class="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 inline-block">
          🌳 {{ update.trees.tree_species?.common_name || 'Tree' }}
        </div>
      </div>
    </div>
  </div>
</template>
