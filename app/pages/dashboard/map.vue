<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const trees = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await supabase
    .from('trees')
    .select('*, tree_species(common_name), profiles!planted_by(display_name)')
    .order('planted_at', { ascending: false })
  trees.value = data || []
  loading.value = false
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Tree Map
      </h1>
      <p class="text-gray-600 mt-1">
        Explore all trees planted by the community.
      </p>
    </div>

    <!-- Map placeholder -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="h-[500px] bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center relative">
        <div
          class="absolute inset-0 opacity-10"
          style="background-image: repeating-linear-gradient(0deg, #16a34a 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #16a34a 0px, transparent 1px, transparent 40px);"
        />
        <div class="text-center z-10">
          <svg class="w-16 h-16 text-green-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          <p class="text-gray-500 text-lg font-medium">
            Map View
          </p>
          <p class="text-gray-400 text-sm mt-1">
            Connect Mapbox to see trees on an interactive map
          </p>
          <p class="text-gray-400 text-xs mt-2">
            {{ trees.length }} trees logged
          </p>
        </div>
      </div>
    </div>

    <!-- Tree list -->
    <div class="mt-6 bg-white rounded-xl border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="font-semibold text-gray-900">
          All Trees ({{ trees.length }})
        </h2>
      </div>
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading...
      </div>
      <div v-else-if="trees.length === 0" class="p-6 text-center text-gray-500">
        No trees have been planted yet.
      </div>
      <div v-else class="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        <div v-for="tree in trees" :key="tree.id" class="px-6 py-4 flex items-center justify-between">
          <div>
            <div class="font-medium text-gray-900">
              {{ tree.tree_species?.common_name || 'Unknown species' }}
            </div>
            <div class="text-sm text-gray-500">
              Planted by {{ tree.profiles?.display_name || 'Unknown' }} · {{ new Date(tree.planted_at).toLocaleDateString() }}
            </div>
            <div v-if="tree.lat != null && tree.lng != null" class="text-xs text-gray-400 mt-1">
              📍 {{ Number(tree.lat).toFixed(4) }}, {{ Number(tree.lng).toFixed(4) }}
            </div>
          </div>
          <div
            class="text-xs px-2 py-1 rounded-full capitalize flex-shrink-0"
            :class="{
              'bg-amber-100 text-amber-700': tree.status === 'planted',
              'bg-blue-100 text-blue-700': tree.status === 'growing',
              'bg-green-100 text-green-700': tree.status === 'mature',
              'bg-red-100 text-red-500': tree.status === 'removed',
            }"
          >
            {{ tree.status }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
