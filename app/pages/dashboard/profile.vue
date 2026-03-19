<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const profile = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const saved = ref(false)

const form = reactive({
  display_name: '',
  bio: '',
})

onMounted(async () => {
  if (!user.value?.id) { return }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.value.id)
    .single()

  profile.value = data
  if (data) {
    form.display_name = data.display_name || ''
    form.bio = data.bio || ''
  }
  loading.value = false
})

async function handleSave() {
  if (!profile.value) { return }
  saving.value = true
  saved.value = false

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: form.display_name,
      bio: form.bio,
    })
    .eq('id', profile.value.id)

  if (!error) {
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  }
  saving.value = false
}

async function handleLogout() {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Profile
      </h1>
      <p class="text-gray-600 mt-1">
        Manage your account and preferences.
      </p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      Loading...
    </div>

    <div v-else class="max-w-lg space-y-8">
      <!-- Avatar -->
      <div class="flex items-center gap-4">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-2xl">
          {{ (form.display_name || user?.email || 'U').charAt(0).toUpperCase() }}
        </div>
        <div>
          <div class="font-medium text-gray-900">
            {{ user?.email }}
          </div>
          <div class="text-sm text-gray-500">
            Member since {{ profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A' }}
          </div>
          <div class="text-sm text-green-600 font-medium mt-1">
            {{ profile?.total_points || 0 }} points
          </div>
        </div>
      </div>

      <!-- Form -->
      <form class="space-y-5" @submit.prevent="handleSave">
        <div>
          <label for="profile-name" class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            id="profile-name"
            v-model="form.display_name"
            type="text"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          >
        </div>

        <div>
          <label for="profile-bio" class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            id="profile-bio"
            v-model="form.bio"
            rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="bg-green-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <span v-if="saved" class="text-sm text-green-600">Saved!</span>
        </div>
      </form>

      <!-- Sign out -->
      <div class="border-t border-gray-200 pt-6">
        <button
          class="text-sm text-red-600 hover:text-red-700 font-medium"
          @click="handleLogout"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
</template>
