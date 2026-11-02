<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Choose a new password' })

// Reached from the link in a password-reset email. Supabase signs the user in
// from the link before this page renders, so updateUser can set the password.
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function handleSubmit() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'Your password needs at least 6 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'The passwords don\'t match.'
    return
  }
  loading.value = true
  const { error: err } = await supabase.auth.updateUser({ password: password.value })
  if (err) { error.value = err.message }
  else { done.value = true }
  loading.value = false
}
</script>

<template>
  <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Choose a new password
        </h1>
      </div>

      <div v-if="done" class="text-center">
        <p class="bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl text-sm mb-6">
          Your password has been changed.
        </p>
        <NuxtLink to="/dashboard" class="bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">
          Go to my dashboard
        </NuxtLink>
      </div>

      <div v-else-if="!user" class="text-center text-gray-600">
        <p class="mb-2">
          This reset link has expired, has already been used, or was opened in a different browser.
        </p>
        <p class="mb-4 text-sm">
          Open the link in the same browser you requested it from.
        </p>
        <NuxtLink to="/forgot-password" class="text-green-600 hover:text-green-700 font-medium">
          Send a new link
        </NuxtLink>
      </div>

      <form v-else class="space-y-5" @submit.prevent="handleSubmit">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <div>
          <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            id="new-password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            placeholder="At least 6 characters"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          >
        </div>
        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
          <input
            id="confirm-password"
            v-model="confirm"
            type="password"
            required
            autocomplete="new-password"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          >
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Saving...' : 'Save new password' }}
        </button>
      </form>
    </div>
  </div>
</template>
