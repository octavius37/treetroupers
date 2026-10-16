<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Reset your password' })

const supabase = useSupabaseClient()

const email = ref('')
const error = ref('')
const sent = ref(false)
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  // The link in the email signs the user in and lands on /reset-password. The
  // URL must be in Supabase's Auth → URL Configuration → Redirect URLs.
  const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (err) { error.value = err.message }
  else { sent.value = true }
  loading.value = false
}
</script>

<template>
  <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Forgot your password?
        </h1>
        <p class="text-gray-600 mt-2">
          Enter your email and we'll send you a link to choose a new one.
        </p>
      </div>

      <div v-if="sent" class="bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl text-sm">
        If an account exists for <strong>{{ email }}</strong>, a reset link is on its way. Check your inbox (and spam folder).
      </div>

      <form v-else class="space-y-5" @submit.prevent="handleSubmit">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <div>
          <label for="reset-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="reset-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="you@example.com"
          >
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Sending...' : 'Send reset link' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-600 mt-6">
        Remembered it?
        <NuxtLink to="/login" class="text-green-600 hover:text-green-700 font-medium">
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
