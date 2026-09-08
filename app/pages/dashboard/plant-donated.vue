<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Log a Donated Tree
      </h1>
      <p class="text-gray-600 mt-1">
        Track a tree you've had planted on your behalf through a donation.
      </p>
    </div>

    <div class="max-w-lg bg-white border border-gray-200 rounded-xl p-8 text-center">
      <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        Coming soon
      </h3>
      <p class="text-gray-600 mb-6">
        We're building support for logging trees donated on your behalf. Check back soon!
      </p>
      <NuxtLink to="/dashboard" class="inline-block border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
        Back to Dashboard
      </NuxtLink>
    </div>
  </div>
</template>
