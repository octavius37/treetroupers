<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const trees = ref<any[]>([])
const loading = ref(true)
const focus = ref<{ lat: number, lng: number } | null>(null)

// Donated and earned trees have no location, so only planted ones go on the map.
const mappedTrees = computed(() => trees.value
  .filter(t => t.lat != null && t.lng != null)
  .map(t => ({
    id: t.id as string,
    lat: Number(t.lat),
    lng: Number(t.lng),
    species: t.tree_species?.common_name || 'Unknown species',
    plantedBy: t.profiles?.display_name || 'Unknown',
    plantedAt: t.planted_at as string,
    status: t.status as string,
  })))

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

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="h-[500px] relative z-0">
        <ClientOnly>
          <TreeMap :trees="mappedTrees" :focus="focus" />
          <template #fallback>
            <div class="h-full flex items-center justify-center bg-green-50 text-gray-500">
              Loading map...
            </div>
          </template>
        </ClientOnly>
      </div>

      <div class="px-6 py-3 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500" /> Planted</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500" /> Growing</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-600" /> Mature</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500" /> Removed</span>
        <span class="ml-auto">{{ mappedTrees.length }} of {{ trees.length }} trees have a location</span>
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
          <button
            type="button"
            class="text-left disabled:cursor-default"
            :disabled="tree.lat == null || tree.lng == null"
            @click="focus = { lat: Number(tree.lat), lng: Number(tree.lng) }"
          >
            <div class="font-medium text-gray-900">
              {{ tree.tree_species?.common_name || 'Unknown species' }}
            </div>
            <div class="text-sm text-gray-500">
              Planted by {{ tree.profiles?.display_name || 'Unknown' }} · {{ new Date(tree.planted_at).toLocaleDateString() }}
            </div>
            <div v-if="tree.lat != null && tree.lng != null" class="text-xs text-gray-400 mt-1">
              📍 {{ Number(tree.lat).toFixed(4) }}, {{ Number(tree.lng).toFixed(4) }}
            </div>
          </button>
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
