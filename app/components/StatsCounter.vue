<script setup lang="ts">
interface Stats {
  trees: number
  communities: number
  members: number
}

// Was a `data-block="stats-counter"` marker resolved server-side by
// resolveSmartBlocks(); now a real component so the counts stay live after the
// pages moved into code. `default` keeps the zeros fallback the old
// `n ?? 0` rendering gave when a count came back null.
const { data: stats } = await useFetch<Stats>('/api/public/stats', {
  default: () => ({ trees: 0, communities: 0, members: 0 }),
})

const cells = computed(() => [
  { value: stats.value.trees, label: 'Trees Planted' },
  { value: stats.value.communities, label: 'Communities' },
  { value: stats.value.members, label: 'Active Members' },
])
</script>

<template>
  <section class="py-20 px-4">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        <div v-for="cell in cells" :key="cell.label">
          <div class="text-4xl font-bold text-green-600 mb-2">
            {{ cell.value }}
          </div>
          <div class="text-gray-600">
            {{ cell.label }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
