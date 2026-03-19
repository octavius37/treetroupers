<script setup lang="ts">
definePageMeta({ layout: 'default' })

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const submitted = ref(false)
const submitting = ref(false)

async function handleSubmit() {
  submitting.value = true
  // TODO: Connect to email service or Supabase function
  await new Promise(resolve => setTimeout(resolve, 1000))
  submitted.value = true
  submitting.value = false
}
</script>

<template>
  <div>
    <section class="relative h-[300px] overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-green-700 to-teal-600" />
      <div class="relative z-10 flex items-center justify-center h-full px-6">
        <h1 class="text-4xl md:text-5xl text-white text-center font-bold">
          Contact Us
        </h1>
      </div>
    </section>

    <section class="py-16 px-4">
      <div class="max-w-2xl mx-auto">
        <p class="text-center text-gray-600 mb-10">
          Have a question or want to get involved? We'd love to hear from you.
        </p>

        <div v-if="submitted" class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            Message Sent!
          </h3>
          <p class="text-gray-600">
            Thank you for reaching out. We'll get back to you as soon as we can.
          </p>
        </div>

        <form v-else class="space-y-6" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              >
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              >
            </div>
          </div>
          <div>
            <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              id="subject"
              v-model="form.subject"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            >
          </div>
          <div>
            <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              id="message"
              v-model="form.message"
              rows="5"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
            />
          </div>
          <div class="text-center">
            <button
              type="submit"
              :disabled="submitting"
              class="bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {{ submitting ? 'Sending...' : 'Send Message' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>
