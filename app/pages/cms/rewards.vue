<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

const rewards = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  points_required: 100,
  active: true,
})

async function loadRewards() {
  loading.value = true
  rewards.value = await $fetch('/api/cms/rewards')
  loading.value = false
}

function openCreate() {
  editingId.value = null
  form.title = ''
  form.description = ''
  form.points_required = 100
  form.active = true
  showForm.value = true
  error.value = ''
}

function openEdit(reward: any) {
  editingId.value = reward.id
  form.title = reward.title
  form.description = reward.description || ''
  form.points_required = reward.points_required
  form.active = reward.active
  showForm.value = true
  error.value = ''
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  error.value = ''
}

async function handleSave() {
  saving.value = true
  error.value = ''
  const payload = {
    title: form.title,
    description: form.description || null,
    points_required: form.points_required,
    active: form.active,
  }
  try {
    if (editingId.value) {
      await $fetch(`/api/cms/rewards/${editingId.value}`, { method: 'PUT', body: payload })
    }
    else {
      await $fetch('/api/cms/rewards', { method: 'POST', body: payload })
    }
    closeForm()
    await loadRewards()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to save'
  }
  saving.value = false
}

async function handleDelete(id: string) {
  // eslint-disable-next-line no-alert -- admin action requires user confirmation
  if (!confirm('Delete this reward?')) { return }
  try {
    await $fetch(`/api/cms/rewards/${id}`, { method: 'DELETE' })
    await loadRewards()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to delete'
  }
}

async function toggleActive(reward: any) {
  try {
    await $fetch(`/api/cms/rewards/${reward.id}`, { method: 'PATCH', body: { active: !reward.active } })
    reward.active = !reward.active
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to update'
  }
}

// Members claim unlocked (non-badge) rewards; an admin sends them and marks
// the claim done here.
const claims = ref<any[]>([])

async function loadClaims() {
  claims.value = await $fetch('/api/cms/reward-claims')
}

async function settleClaim(claim: any, status: 'fulfilled' | 'cancelled') {
  error.value = ''
  try {
    await $fetch(`/api/cms/reward-claims/${claim.id}`, { method: 'PUT', body: { status } })
    await loadClaims()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to update the claim'
  }
}

onMounted(() => Promise.all([loadRewards(), loadClaims()]))
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Rewards
        </h1>
        <p class="text-gray-600 mt-1">
          Rewards unlock when a member's points reach the threshold; points are never spent. Badges
          show on profiles; other rewards are claimed by the member and sent by you.
        </p>
      </div>
      <button
        class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
        @click="openCreate"
      >
        + New Reward
      </button>
    </div>

    <div v-if="error && !showForm" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <section v-if="claims.length" class="mb-8 bg-white rounded-xl border border-gray-200">
      <h2 class="px-6 py-4 border-b border-gray-200 font-semibold text-gray-900">
        Claims
      </h2>
      <ul class="divide-y divide-gray-100">
        <li v-for="c in claims" :key="c.id" class="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
          <div class="flex-1">
            <div class="font-medium text-gray-900">
              {{ c.reward }}
            </div>
            <div class="text-gray-600">
              {{ c.member.name }}<template v-if="c.member.email">
                · <a :href="`mailto:${c.member.email}`" class="text-green-700 hover:text-green-800">{{ c.member.email }}</a>
              </template>
              · claimed {{ new Date(c.claimedAt).toLocaleDateString() }}
            </div>
          </div>
          <div v-if="c.status === 'pending'" class="flex gap-2">
            <button class="text-xs px-3 py-1.5 rounded-full font-medium bg-green-600 text-white hover:bg-green-700" @click="settleClaim(c, 'fulfilled')">
              Mark as sent
            </button>
            <button class="text-xs px-3 py-1.5 rounded-full font-medium border border-gray-300 text-gray-700 hover:bg-gray-50" @click="settleClaim(c, 'cancelled')">
              Cancel
            </button>
          </div>
          <span v-else class="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            Sent {{ c.fulfilledAt ? new Date(c.fulfilledAt).toLocaleDateString() : '' }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">
            {{ editingId ? 'Edit Reward' : 'New Reward' }}
          </h2>
          <button class="text-gray-400 hover:text-gray-600" @click="closeForm">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form class="p-6 space-y-4" @submit.prevent="handleSave">
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ error }}
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. Seedling Badge"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Points Required</label>
            <input
              v-model.number="form.points_required"
              type="number"
              min="0"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            >
          </div>
          <div class="flex items-center gap-3">
            <input
              id="reward-active"
              v-model="form.active"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            >
            <label for="reward-active" class="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              :disabled="saving"
              class="bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
            </button>
            <button
              type="button"
              class="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
              @click="closeForm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading rewards...
      </div>
      <div v-else-if="rewards.length === 0" class="p-6 text-center text-gray-500">
        <p>No rewards configured yet.</p>
        <button class="text-green-600 hover:text-green-700 font-medium mt-2" @click="openCreate">
          Create the first reward →
        </button>
      </div>
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-gray-200 text-left">
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Description
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Points
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="reward in rewards" :key="reward.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">
              {{ reward.title }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell max-w-xs truncate">
              {{ reward.description || '—' }}
            </td>
            <td class="px-6 py-4">
              <span class="text-sm font-semibold text-green-600">{{ reward.points_required }}</span>
            </td>
            <td class="px-6 py-4">
              <button
                class="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                :class="reward.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
                @click="toggleActive(reward)"
              >
                {{ reward.active ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="px-6 py-4 text-right space-x-3">
              <button class="text-sm text-green-600 hover:text-green-700 font-medium" @click="openEdit(reward)">
                Edit
              </button>
              <button class="text-sm text-red-500 hover:text-red-600 font-medium" @click="handleDelete(reward.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
