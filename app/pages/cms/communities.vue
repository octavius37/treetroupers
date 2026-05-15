<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

const communities = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  slug: '',
  description: '',
  parent_community_id: '',
})

async function loadCommunities() {
  loading.value = true
  communities.value = await $fetch('/api/cms/communities')
  loading.value = false
}

function openCreate() {
  editingId.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.parent_community_id = ''
  showForm.value = true
  error.value = ''
}

function openEdit(community: any) {
  editingId.value = community.id
  form.name = community.name
  form.slug = community.slug
  form.description = community.description || ''
  form.parent_community_id = community.parent_community_id || ''
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
    name: form.name,
    slug: form.slug,
    description: form.description || null,
    parent_community_id: form.parent_community_id || null,
  }
  try {
    if (editingId.value) {
      await $fetch(`/api/cms/communities/${editingId.value}`, { method: 'PUT', body: payload })
    }
    else {
      await $fetch('/api/cms/communities', { method: 'POST', body: payload })
    }
    closeForm()
    await loadCommunities()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to save'
  }
  saving.value = false
}

async function handleDelete(id: string) {
  // eslint-disable-next-line no-alert -- admin action requires user confirmation
  if (!confirm('Are you sure you want to delete this community? This will also remove all member associations.')) { return }
  try {
    await $fetch(`/api/cms/communities/${id}`, { method: 'DELETE' })
    await loadCommunities()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to delete'
  }
}

onMounted(loadCommunities)
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Communities
        </h1>
        <p class="text-gray-600 mt-1">
          Manage tree troupe communities.
        </p>
      </div>
      <button
        class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
        @click="openCreate"
      >
        + New Community
      </button>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">
            {{ editingId ? 'Edit Community' : 'New Community' }}
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              v-model="form.slug"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. london-central"
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Community</label>
            <select
              v-model="form.parent_community_id"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
            >
              <option value="">
                None (top-level)
              </option>
              <option
                v-for="c in communities.filter(c => c.id !== editingId)"
                :key="c.id"
                :value="c.id"
              >
                {{ c.name }}
              </option>
            </select>
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
        Loading communities...
      </div>
      <div v-else-if="communities.length === 0" class="p-6 text-center text-gray-500">
        <p>No communities yet.</p>
        <button class="text-green-600 hover:text-green-700 font-medium mt-2" @click="openCreate">
          Create the first community →
        </button>
      </div>
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-gray-200 text-left">
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Slug
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Description
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="community in communities" :key="community.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">
              {{ community.name }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
              {{ community.slug }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell max-w-xs truncate">
              {{ community.description || '—' }}
            </td>
            <td class="px-6 py-4 text-right space-x-3">
              <button class="text-sm text-green-600 hover:text-green-700 font-medium" @click="openEdit(community)">
                Edit
              </button>
              <button class="text-sm text-red-500 hover:text-red-600 font-medium" @click="handleDelete(community.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
