<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const authUserId = useAuthUserId()

const profile = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const saved = ref(false)

const form = reactive({
  display_name: '',
  bio: '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref('')
const passwordSaving = ref(false)
const passwordSaved = ref(false)

onMounted(async () => {
  if (!authUserId.value) { return }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId.value)
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

  try {
    await $fetch('/api/dashboard/profile', {
      method: 'PUT',
      body: { display_name: form.display_name, bio: form.bio },
    })
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  }
  catch {}
  saving.value = false
}

async function handleChangePassword() {
  passwordError.value = ''
  passwordSaved.value = false

  if (passwordForm.newPassword.length < 6) {
    passwordError.value = 'New password must be at least 6 characters'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'New passwords do not match'
    return
  }
  if (!user.value?.email) {
    passwordError.value = 'Unable to verify your account. Please try again.'
    return
  }

  passwordSaving.value = true

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.value.email,
    password: passwordForm.currentPassword,
  })

  if (signInError) {
    passwordError.value = 'Current password is incorrect'
    passwordSaving.value = false
    return
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: passwordForm.newPassword,
  })

  if (updateError) {
    passwordError.value = updateError.message
  }
  else {
    passwordSaved.value = true
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    setTimeout(() => passwordSaved.value = false, 3000)
  }

  passwordSaving.value = false
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

      <!-- Change Password -->
      <div class="border-t border-gray-200 pt-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h2>
        <form class="space-y-5" @submit.prevent="handleChangePassword">
          <div v-if="passwordError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ passwordError }}
          </div>

          <div>
            <label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              id="current-password"
              v-model="passwordForm.currentPassword"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            >
          </div>

          <div>
            <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              id="new-password"
              v-model="passwordForm.newPassword"
              type="password"
              required
              autocomplete="new-password"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="At least 6 characters"
            >
          </div>

          <div>
            <label for="confirm-new-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              id="confirm-new-password"
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="Repeat your new password"
            >
          </div>

          <div class="flex items-center gap-3">
            <button
              type="submit"
              :disabled="passwordSaving"
              class="bg-green-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {{ passwordSaving ? 'Updating...' : 'Update Password' }}
            </button>
            <span v-if="passwordSaved" class="text-sm text-green-600">Password updated!</span>
          </div>
        </form>
      </div>

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
