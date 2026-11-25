<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Tree map' })

interface MapTree {
  id: string
  source: string
  quantity: number
  status: string
  reviewStatus: string
  plantedAt: string
  lat: number | null
  lng: number | null
  species: string | null
  plantedById: string | null
  plantedBy: string
  photoUrl: string | null
  isMine: boolean
}

const trees = ref<MapTree[]>([])
const loading = ref(true)
const focus = ref<{ lat: number, lng: number } | null>(null)

// The shape treeLogLabel reads.
function label(t: MapTree) {
  return treeLogLabel({ source: t.source, quantity: t.quantity, tree_species: t.species ? { common_name: t.species } : null })
}

// Donated and earned trees have no location, so only planted ones go on the map.
const mappedTrees = computed(() => trees.value
  .filter(t => t.lat != null && t.lng != null)
  .map(t => ({
    id: t.id,
    lat: Number(t.lat),
    lng: Number(t.lng),
    species: t.species || 'Unknown species',
    plantedBy: t.plantedBy,
    plantedAt: t.plantedAt,
    status: t.status,
    photoUrl: t.photoUrl,
  })))

onMounted(async () => {
  // Pending trees show while they wait for review; rejected ones don't. Photos
  // follow the privacy rules, applied by the endpoint.
  trees.value = await $fetch<MapTree[]>('/api/dashboard/tree-map').catch(() => [])
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
        <div v-for="tree in trees" :key="tree.id" class="px-6 py-4 flex items-center gap-4">
          <img v-if="tree.photoUrl" :src="tree.photoUrl" alt="" loading="lazy" class="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0">
          <div v-else class="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">
            🌳
          </div>
          <button
            type="button"
            class="text-left disabled:cursor-default min-w-0 flex-1"
            :disabled="tree.lat == null || tree.lng == null"
            @click="focus = { lat: Number(tree.lat), lng: Number(tree.lng) }"
          >
            <div class="font-medium text-gray-900">
              {{ label(tree) }}
            </div>
            <div class="text-sm text-gray-500">
              {{ tree.source === 'planted' ? 'Planted' : 'Logged' }} by {{ tree.isMine ? 'you' : tree.plantedBy }} · {{ new Date(tree.plantedAt).toLocaleDateString() }}
              <span v-if="tree.reviewStatus === 'pending'" class="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">Pending review</span>
            </div>
            <div v-if="tree.lat != null && tree.lng != null" class="text-xs text-gray-400 mt-1">
              📍 {{ Number(tree.lat).toFixed(4) }}, {{ Number(tree.lng).toFixed(4) }}
            </div>
          </button>
          <div
            class="ml-auto text-xs px-2 py-1 rounded-full capitalize flex-shrink-0"
            :class="{
              'bg-amber-100 text-amber-700': tree.status === 'planted',
              'bg-blue-100 text-blue-700': tree.status === 'growing',
              'bg-green-100 text-green-700': tree.status === 'mature',
              'bg-red-100 text-red-500': tree.status === 'removed',
            }"
          >
            {{ tree.status }}
          </div>
          <NuxtLink :to="`/dashboard/trees/${tree.id}`" class="ml-3 text-sm text-green-700 hover:text-green-800 flex-shrink-0">
            View →
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
