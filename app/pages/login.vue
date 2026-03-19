<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

watch(user, (val) => {
  if (val) { navigateTo('/dashboard') }
}, { immediate: true })

async function handleLogin() {
  error.value = ''
  loading.value = true
  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  if (err) {
    error.value = err.message
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Welcome back
        </h1>
        <p class="text-gray-600 mt-2">
          Sign in to your Tree Troupe account
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="handleLogin">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <div>
          <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="you@example.com"
          >
        </div>

        <div>
          <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="••••••••"
          >
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-600 mt-6">
        Don't have an account?
        <NuxtLink to="/register" class="text-green-600 hover:text-green-700 font-medium">
          Sign up
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
