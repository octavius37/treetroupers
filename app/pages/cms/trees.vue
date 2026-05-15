<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

const trees = ref<any[]>([])
const loading = ref(true)
const filterVerified = ref<'all' | 'verified' | 'pending'>('all')
const error = ref('')

async function loadTrees() {
  loading.value = true
  trees.value = await $fetch('/api/cms/trees', { query: { filter: filterVerified.value } })
  loading.value = false
}

async function toggleVerified(tree: any) {
  try {
    await $fetch(`/api/cms/trees/${tree.id}`, { method: 'PATCH', body: { verified: !tree.verified } })
    tree.verified = !tree.verified
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to update'
  }
}

async function handleDelete(id: string) {
  // eslint-disable-next-line no-alert -- admin action requires user confirmation
  if (!confirm('Delete this tree record permanently?')) { return }
  try {
    await $fetch(`/api/cms/trees/${id}`, { method: 'DELETE' })
    await loadTrees()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to delete'
  }
}

watch(filterVerified, () => loadTrees())
onMounted(loadTrees)
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Trees
        </h1>
        <p class="text-gray-600 mt-1">
          View, verify, and manage planted trees.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="f in (['all', 'pending', 'verified'] as const)"
          :key="f"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="filterVerified === f ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'"
          @click="filterVerified = f"
        >
          {{ f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Verified' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading trees...
      </div>
      <div v-else-if="trees.length === 0" class="p-6 text-center text-gray-500">
        No trees found.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 text-left">
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Species
              </th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Planted By
              </th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Community
              </th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Location
              </th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Date
              </th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="tree in trees" :key="tree.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">
                {{ tree.tree_species?.common_name || 'Unknown' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                {{ tree.profiles?.display_name || 'Unknown' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                {{ tree.communities?.name || '—' }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                <template v-if="tree.lat && tree.lng">
                  {{ Number(tree.lat).toFixed(3) }}, {{ Number(tree.lng).toFixed(3) }}
                </template>
                <template v-else>
                  —
                </template>
              </td>
              <td class="px-6 py-4">
                <button
                  class="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                  :class="tree.verified ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'"
                  @click="toggleVerified(tree)"
                >
                  {{ tree.verified ? 'Verified ✓' : 'Pending' }}
                </button>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                {{ new Date(tree.planted_at).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 text-right">
                <button class="text-sm text-red-500 hover:text-red-600 font-medium" @click="handleDelete(tree.id)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
