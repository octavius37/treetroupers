<script setup lang="ts">
interface Community {
  name: string
  slug: string
  description: string | null
}

// Was a `data-block="communities-carousel"` marker resolved server-side by
// resolveSmartBlocks(). Vue interpolation escapes name/description, so the
// manual escapeHtml() that version needed is gone.
const { data: communities } = await useFetch<Community[]>('/api/public/communities', {
  default: () => [],
})
</script>

<template>
  <section v-if="communities.length === 0" class="py-12 px-4">
    <div class="max-w-5xl mx-auto text-center text-gray-500">
      No communities yet.
    </div>
  </section>
  <section v-else class="py-16 px-4 bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">
        Active Communities
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="community in communities"
          :key="community.slug"
          class="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ community.name }}
          </h3>
          <p class="text-sm text-gray-600 line-clamp-3">
            {{ community.description || '' }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
