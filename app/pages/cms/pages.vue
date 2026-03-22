<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

const pages = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  slug: '',
  content: '',
  status: 'draft',
})

async function loadPages() {
  loading.value = true
  try {
    const data = await $fetch('/api/payload/pages', { query: { limit: 100 } })
    pages.value = (data as any).docs || []
  }
  catch { pages.value = [] }
  loading.value = false
}

function openCreate() {
  editingId.value = null
  form.title = ''
  form.slug = ''
  form.content = ''
  form.status = 'draft'
  showForm.value = true
  error.value = ''
}

function openEdit(page: any) {
  editingId.value = page.id
  form.title = page.title
  form.slug = page.slug
  form.content = page.content || ''
  form.status = page.status || 'draft'
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
  try {
    if (editingId.value) {
      await $fetch(`/api/payload/pages/${editingId.value}`, {
        method: 'PATCH',
        body: { title: form.title, slug: form.slug, content: form.content, status: form.status },
      })
    }
    else {
      await $fetch('/api/payload/pages', {
        method: 'POST',
        body: { title: form.title, slug: form.slug, content: form.content, status: form.status },
      })
    }
    closeForm()
    await loadPages()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to save'
  }
  saving.value = false
}

async function handleDelete(id: string) {
  // eslint-disable-next-line no-alert -- admin action requires user confirmation
  if (!confirm('Are you sure you want to delete this page?')) { return }
  try {
    await $fetch(`/api/payload/pages/${id}`, { method: 'DELETE' })
    await loadPages()
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to delete'
  }
}

onMounted(loadPages)
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Pages
        </h1>
        <p class="text-gray-600 mt-1">
          Manage CMS-driven content pages.
        </p>
      </div>
      <button
        class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
        @click="openCreate"
      >
        + New Page
      </button>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">
            {{ editingId ? 'Edit Page' : 'New Page' }}
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
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              v-model="form.slug"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. about-us"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              v-model="form.content"
              rows="6"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="form.status"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
            >
              <option value="draft">
                Draft
              </option>
              <option value="published">
                Published
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
        Loading pages...
      </div>
      <div v-else-if="pages.length === 0" class="p-6 text-center text-gray-500">
        <p>No pages yet.</p>
        <button class="text-green-600 hover:text-green-700 font-medium mt-2" @click="openCreate">
          Create your first page →
        </button>
      </div>
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-gray-200 text-left">
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Slug
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
          <tr v-for="page in pages" :key="page.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">
              {{ page.title }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
              /{{ page.slug }}
            </td>
            <td class="px-6 py-4">
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
              >
                {{ page.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-right space-x-3">
              <button class="text-sm text-green-600 hover:text-green-700 font-medium" @click="openEdit(page)">
                Edit
              </button>
              <button class="text-sm text-red-500 hover:text-red-600 font-medium" @click="handleDelete(page.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
