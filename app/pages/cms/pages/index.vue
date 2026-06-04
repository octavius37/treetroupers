<script setup lang="ts">
definePageMeta({ middleware: 'cms-auth' })
</script>

<template>
  <div class="h-full flex items-center justify-center bg-gray-50 px-6">
    <div class="text-center max-w-md">
      <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 13.5h6m-6 3h6m-7.5-9V3m0 0L4.5 6m1.5-3l1.5 3M15 6V3m0 0l-1.5 3M15 3l1.5 3M3 21h18M5 21V8.5h14V21" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        Select a page to edit
      </h2>
      <p class="text-gray-600 mb-6">
        Choose a page from the sidebar, or create a new one from scratch.
      </p>
      <NuxtLink
        to="/cms/pages/new"
        class="inline-block bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
      >
        + New page
      </NuxtLink>
    </div>
  </div>
</template>
