<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'The tree map' })
useSeoMeta({ description: 'Every tree planted by the Tree Troupe community, on one map.' })

interface PublicTree { id: string, species: string, status: string, plantedAt: string, lat: number, lng: number }

const user = useSupabaseUser()
const { data } = await useFetch<{ totals: { trees: number, communities: number, co2KgPerYear: number }, trees: PublicTree[] }>('/api/public/trees')
</script>

<template>
  <div>
    <section class="bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white px-4 py-12">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl sm:text-4xl font-bold mb-2">
          The tree map
        </h1>
        <p class="text-green-50 max-w-2xl">
          Every tree planted by the Tree Troupe community. Locations are shown approximately, to respect planters' privacy.
        </p>
        <dl v-if="data" class="grid grid-cols-3 gap-3 sm:gap-6 mt-8 max-w-2xl">
          <div class="bg-white/15 rounded-2xl px-4 py-3">
            <dt class="text-xs sm:text-sm text-green-50">
              Trees
            </dt>
            <dd class="text-2xl sm:text-3xl font-bold">
              {{ data.totals.trees.toLocaleString() }}
            </dd>
          </div>
          <div class="bg-white/15 rounded-2xl px-4 py-3">
            <dt class="text-xs sm:text-sm text-green-50">
              Communities
            </dt>
            <dd class="text-2xl sm:text-3xl font-bold">
              {{ data.totals.communities.toLocaleString() }}
            </dd>
          </div>
          <div class="bg-white/15 rounded-2xl px-4 py-3">
            <dt class="text-xs sm:text-sm text-green-50">
              CO₂ absorbed / year
            </dt>
            <dd class="text-2xl sm:text-3xl font-bold">
              {{ formatCo2(data.totals.co2KgPerYear) }}
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-4 py-8">
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <ClientOnly>
          <div class="h-[500px]">
            <TreeMap :trees="data?.trees ?? []" :focus="null" public-view />
          </div>
          <template #fallback>
            <div class="h-[500px] flex items-center justify-center text-gray-400">
              Loading map...
            </div>
          </template>
        </ClientOnly>
      </div>

      <div class="mt-8 text-center">
        <p class="text-gray-700 mb-4">
          {{ user ? 'Add your trees to the map.' : 'Want your trees on the map too?' }}
        </p>
        <NuxtLink
          :to="user ? '/dashboard/plant' : '/register'"
          class="bg-green-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
        >
          {{ user ? 'Log a tree' : 'Join for free' }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
