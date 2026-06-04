<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

const species = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const error = ref('')

const form = reactive({
  common_name: '',
  scientific_name: '',
  description: '',
  avg_co2_kg_per_year: null as number | null,
})

async function loadSpecies() {
  loading.value = true
  species.value = await $fetch('/api/cms/tree-species')
  loading.value = false
}

function openCreate() {
  editingId.value = null
  form.common_name = ''
  form.scientific_name = ''
  form.description = ''
  form.avg_co2_kg_per_year = null
  showForm.value = true
  error.value = ''
}

function openEdit(sp: any) {
  editingId.value = sp.id
  form.common_name = sp.common_name
  form.scientific_name = sp.scientific_name
  form.description = sp.description || ''
  form.avg_co2_kg_per_year = sp.avg_co2_kg_per_year
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
    common_name: form.common_name,
    scientific_name: form.scientific_name,
    description: form.description || null,
    avg_co2_kg_per_year: form.avg_co2_kg_per_year,
  }
  try {
    if (editingId.value) {
      await $fetch(`/api/cms/tree-species/${editingId.value}`, { method: 'PUT', body: payload })
    }
    else {
      await $fetch('/api/cms/tree-species', { method: 'POST', body: payload })
    }
    closeForm()
    await loadSpecies()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to save'
  }
  saving.value = false
}

async function handleDelete(id: string) {
  // eslint-disable-next-line no-alert -- admin action requires user confirmation
  if (!confirm('Delete this species? Trees referencing it will keep their existing species_id.')) { return }
  try {
    await $fetch(`/api/cms/tree-species/${id}`, { method: 'DELETE' })
    await loadSpecies()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to delete'
  }
}

onMounted(loadSpecies)
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Tree Species
        </h1>
        <p class="text-gray-600 mt-1">
          Manage the tree species database.
        </p>
      </div>
      <button
        class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
        @click="openCreate"
      >
        + New Species
      </button>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">
            {{ editingId ? 'Edit Species' : 'New Species' }}
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Common Name</label>
            <input
              v-model="form.common_name"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. English Oak"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Scientific Name</label>
            <input
              v-model="form.scientific_name"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. Quercus robur"
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Avg CO₂ per year (kg)</label>
            <input
              v-model.number="form.avg_co2_kg_per_year"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. 22.5"
            >
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
        Loading species...
      </div>
      <div v-else-if="species.length === 0" class="p-6 text-center text-gray-500">
        <p>No tree species in the database yet.</p>
        <button class="text-green-600 hover:text-green-700 font-medium mt-2" @click="openCreate">
          Add the first species →
        </button>
      </div>
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-gray-200 text-left">
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Common Name
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Scientific Name
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              CO₂/yr (kg)
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="sp in species" :key="sp.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">
              {{ sp.common_name }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 italic hidden sm:table-cell">
              {{ sp.scientific_name }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
              {{ sp.avg_co2_kg_per_year != null ? sp.avg_co2_kg_per_year : '—' }}
            </td>
            <td class="px-6 py-4 text-right space-x-3">
              <button class="text-sm text-green-600 hover:text-green-700 font-medium" @click="openEdit(sp)">
                Edit
              </button>
              <button class="text-sm text-red-500 hover:text-red-600 font-medium" @click="handleDelete(sp.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
