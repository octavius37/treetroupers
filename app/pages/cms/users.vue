<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

const profiles = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const error = ref('')

const authUserId = useAuthUserId()
const roleSavingId = ref<string | null>(null)

async function changeRole(profile: any, newRole: string) {
  if (profile.role === newRole) { return }
  roleSavingId.value = profile.id
  error.value = ''
  try {
    await $fetch(`/api/cms/users/${profile.id}/role`, {
      method: 'PUT',
      body: { role: newRole },
    })
    await loadUsers()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to update role'
    // Re-sync the select back to server truth: with :value binding, a rejected
    // change would otherwise leave the dropdown showing the failed selection.
    await loadUsers()
  }
  finally {
    roleSavingId.value = null
  }
}

function isSelf(profile: any) {
  return profile.auth_user_id === authUserId.value
}

const form = reactive({
  display_name: '',
  bio: '',
  total_points: 0,
})

async function loadUsers() {
  loading.value = true
  profiles.value = await $fetch('/api/cms/users')
  loading.value = false
}

function openEdit(profile: any) {
  editingId.value = profile.id
  form.display_name = profile.display_name || ''
  form.bio = profile.bio || ''
  form.total_points = profile.total_points || 0
  showForm.value = true
  error.value = ''
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  error.value = ''
}

async function handleSave() {
  if (!editingId.value) { return }
  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/cms/users/${editingId.value}`, {
      method: 'PUT',
      body: {
        display_name: form.display_name || null,
        bio: form.bio || null,
        total_points: form.total_points,
      },
    })
    closeForm()
    await loadUsers()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to save'
  }
  saving.value = false
}

onMounted(loadUsers)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Users
      </h1>
      <p class="text-gray-600 mt-1">
        View and manage user profiles. Users are created via Supabase Auth signup.
      </p>
    </div>

    <div v-if="error" class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <!-- Edit Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">
            Edit User
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              v-model="form.display_name"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              v-model="form.bio"
              rows="3"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
            <input
              v-model.number="form.total_points"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            >
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              :disabled="saving"
              class="bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Update' }}
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
        Loading users...
      </div>
      <div v-else-if="profiles.length === 0" class="p-6 text-center text-gray-500">
        No users have signed up yet.
      </div>
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-gray-200 text-left">
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Bio
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Points
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Joined
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="profile in profiles" :key="profile.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-xs flex-shrink-0">
                  {{ (profile.display_name || 'U')[0].toUpperCase() }}
                </div>
                <div class="text-sm font-medium text-gray-900">
                  {{ profile.display_name || 'Anonymous' }}
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell max-w-xs truncate">
              {{ profile.bio || '—' }}
            </td>
            <td class="px-6 py-4">
              <span class="text-sm font-semibold text-green-600">{{ profile.total_points || 0 }}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
              {{ new Date(profile.created_at).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4">
              <span
                v-if="isSelf(profile)"
                class="text-sm font-medium text-gray-700 capitalize"
                title="You cannot change your own role"
              >
                {{ profile.role }}
              </span>
              <select
                v-else
                :value="profile.role"
                :disabled="roleSavingId === profile.id"
                :aria-label="`Role for ${profile.display_name || 'user'}`"
                class="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:opacity-50"
                @change="changeRole(profile, ($event.target as HTMLSelectElement).value)"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td class="px-6 py-4 text-right">
              <button class="text-sm text-green-600 hover:text-green-700 font-medium" @click="openEdit(profile)">
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
