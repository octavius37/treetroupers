<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

type ReviewFilter = 'pending' | 'approved' | 'rejected' | 'all'

const trees = ref<any[]>([])
const loading = ref(true)
const filterReview = ref<ReviewFilter>('pending')
const filterStatus = ref<'all' | 'planted' | 'growing' | 'mature' | 'removed'>('all')
const reviewing = ref<string | null>(null)
// The log being rejected, while the admin writes the reason for the member.
const rejecting = ref<string | null>(null)
const rejectNote = ref('')
const error = ref('')

const REVIEW_FILTERS: { value: ReviewFilter, label: string }[] = [
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

async function loadTrees() {
  loading.value = true
  trees.value = await $fetch('/api/cms/trees', {
    query: { filter: filterStatus.value, review: filterReview.value },
  })
  loading.value = false
}

const STATUS_CYCLE: Record<string, string> = {
  planted: 'growing',
  growing: 'mature',
  mature: 'removed',
  removed: 'planted',
}

async function cycleStatus(tree: any) {
  const next = STATUS_CYCLE[tree.status] ?? 'planted'
  try {
    await $fetch(`/api/cms/trees/${tree.id}`, { method: 'PATCH', body: { status: next } })
    tree.status = next
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to update'
  }
}

async function review(tree: any, decision: 'approved' | 'rejected', note = '') {
  error.value = ''
  reviewing.value = tree.id
  try {
    await $fetch(`/api/cms/trees/${tree.id}/review`, { method: 'PUT', body: { decision, note } })
    rejecting.value = null
    rejectNote.value = ''
    await loadTrees()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to review'
  }
  reviewing.value = null
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

watch([filterStatus, filterReview], () => loadTrees())
onMounted(loadTrees)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Trees
      </h1>
      <p class="text-gray-600 mt-1">
        Review logged trees against their photo. Points are paid when you approve a log:
        20 for a planted tree (+50 for someone's first), 5 per donated tree and 2 per earned tree.
      </p>
    </div>

    <div class="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="f in REVIEW_FILTERS"
          :key="f.value"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="filterReview === f.value ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'"
          @click="filterReview = f.value"
        >
          {{ f.label }}
        </button>
      </div>
      <select
        v-model="filterStatus"
        aria-label="Tree status"
        class="px-4 py-2 border border-gray-300 rounded-full text-sm bg-white text-gray-700 capitalize"
      >
        <option v-for="f in (['all', 'planted', 'growing', 'mature', 'removed'] as const)" :key="f" :value="f">
          {{ f === 'all' ? 'Any status' : f }}
        </option>
      </select>
    </div>

    <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading trees...
      </div>
      <div v-else-if="trees.length === 0" class="p-6 text-center text-gray-500">
        {{ filterReview === 'pending' ? 'Nothing waiting for review.' : 'No trees found.' }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 text-left">
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Photo
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Log
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Logged By
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Community
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Location
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Review
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Status
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="tree in trees" :key="tree.id" class="hover:bg-gray-50 align-top">
              <td class="px-4 py-4">
                <a v-if="tree.photo_urls?.[0]" :href="tree.photo_urls[0]" target="_blank" rel="noopener">
                  <img :src="tree.photo_urls[0]" alt="Proof photo" class="w-20 h-20 object-cover rounded-lg border border-gray-200">
                </a>
                <div v-else class="w-20 h-20 rounded-lg bg-gray-100 text-xs text-gray-400 flex items-center justify-center">
                  No photo
                </div>
              </td>
              <td class="px-4 py-4 text-sm">
                <div class="font-medium text-gray-900">
                  <template v-if="tree.source === 'planted'">
                    Planted:
                  </template>
                  {{ treeLogLabel(tree) }}
                </div>
                <div v-if="tree.donation_project || tree.earned_activity" class="text-gray-600">
                  {{ tree.donation_project || tree.earned_activity }}
                </div>
                <div v-if="tree.notes" class="text-gray-500 mt-1 max-w-xs">
                  {{ tree.notes }}
                </div>
                <div v-if="tree.review_note" class="text-xs text-red-600 mt-1 max-w-xs">
                  Note: {{ tree.review_note }}
                </div>
                <NuxtLink :to="`/dashboard/trees/${tree.id}`" class="text-xs text-green-700 hover:text-green-800">
                  Open tree page →
                </NuxtLink>
                <div class="text-xs text-gray-400 mt-1">
                  {{ new Date(tree.planted_at).toLocaleDateString() }}
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500 hidden sm:table-cell">
                {{ tree.profiles?.display_name || 'Unknown' }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                {{ tree.communities?.name || '—' }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                <a
                  v-if="tree.lat != null && tree.lng != null"
                  :href="`https://www.openstreetmap.org/?mlat=${tree.lat}&mlon=${tree.lng}#map=18/${tree.lat}/${tree.lng}`"
                  target="_blank"
                  rel="noopener"
                  class="text-green-600 hover:text-green-700"
                >
                  {{ Number(tree.lat).toFixed(3) }}, {{ Number(tree.lng).toFixed(3) }}
                </a>
                <template v-else>
                  —
                </template>
              </td>
              <td class="px-4 py-4">
                <form
                  v-if="tree.review_status === 'pending' && rejecting === tree.id"
                  class="flex flex-col gap-2 w-56"
                  @submit.prevent="review(tree, 'rejected', rejectNote)"
                >
                  <label :for="`reason-${tree.id}`" class="text-xs text-gray-600">Reason, shown to the member</label>
                  <textarea
                    :id="`reason-${tree.id}`"
                    v-model="rejectNote"
                    rows="3"
                    maxlength="500"
                    placeholder="e.g. The tree isn't visible in the photo"
                    class="text-sm px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  />
                  <button
                    type="submit"
                    class="text-xs px-3 py-1.5 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    :disabled="reviewing === tree.id"
                  >
                    Reject log
                  </button>
                  <button type="button" class="text-xs text-gray-500" @click="rejecting = null">
                    Cancel
                  </button>
                </form>
                <div v-else-if="tree.review_status === 'pending'" class="flex flex-col gap-2">
                  <button
                    class="text-xs px-3 py-1.5 rounded-full font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    :disabled="reviewing === tree.id"
                    @click="review(tree, 'approved')"
                  >
                    Approve
                  </button>
                  <button
                    class="text-xs px-3 py-1.5 rounded-full font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    :disabled="reviewing === tree.id"
                    @click="rejecting = tree.id; rejectNote = ''"
                  >
                    Reject
                  </button>
                </div>
                <span
                  v-else
                  class="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                  :class="tree.review_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                >
                  {{ tree.review_status }}
                </span>
              </td>
              <td class="px-4 py-4 hidden sm:table-cell">
                <span v-if="tree.source !== 'planted'" class="text-xs text-gray-400">—</span>
                <button
                  v-else
                  class="text-xs px-2.5 py-1 rounded-full font-medium transition-colors capitalize"
                  :class="{
                    'bg-amber-100 text-amber-700 hover:bg-amber-200': tree.status === 'planted',
                    'bg-blue-100 text-blue-700 hover:bg-blue-200': tree.status === 'growing',
                    'bg-green-100 text-green-700 hover:bg-green-200': tree.status === 'mature',
                    'bg-red-100 text-red-700 hover:bg-red-200': tree.status === 'removed',
                  }"
                  @click="cycleStatus(tree)"
                >
                  {{ tree.status }}
                </button>
              </td>
              <td class="px-4 py-4 text-right">
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
