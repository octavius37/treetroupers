<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const error = ref('')
const loading = ref(false)
const success = ref(false)

watch(user, (val) => {
  if (val) { navigateTo('/dashboard') }
}, { immediate: true })

async function handleRegister() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true
  const { error: err } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        display_name: displayName.value,
      },
    },
  })

  if (err) {
    error.value = err.message
  }
  else {
    success.value = true
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Join Tree Troupe
        </h1>
        <p class="text-gray-600 mt-2">
          Create your account and start planting
        </p>
      </div>

      <div v-if="success" class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">
          Check your email
        </h3>
        <p class="text-gray-600">
          We've sent you a confirmation link. Please check your inbox to activate your account.
        </p>
      </div>

      <form v-else class="space-y-5" @submit.prevent="handleRegister">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <div>
          <label for="reg-name" class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            id="reg-name"
            v-model="displayName"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="Your name"
          >
        </div>

        <div>
          <label for="reg-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="you@example.com"
          >
        </div>

        <div>
          <label for="reg-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="At least 6 characters"
          >
        </div>

        <div>
          <label for="reg-confirm" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            id="reg-confirm"
            v-model="confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="Repeat your password"
          >
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-600 mt-6">
        Already have an account?
        <NuxtLink to="/login" class="text-green-600 hover:text-green-700 font-medium">
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
