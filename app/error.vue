<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)

useHead({ title: notFound.value ? 'Page not found' : 'Something went wrong' })
</script>

<template>
  <NaiveConfig>
    <NuxtLayout name="default">
      <section class="min-h-[60vh] flex items-center justify-center px-4 py-20">
        <div class="max-w-lg text-center">
          <div class="text-6xl mb-6" aria-hidden="true">
            {{ notFound ? '🌱' : '🍂' }}
          </div>
          <p class="text-sm font-semibold uppercase tracking-wider text-green-600 mb-2">
            {{ error.statusCode }}
          </p>
          <h1 class="text-3xl font-bold text-gray-900 mb-3">
            {{ notFound ? 'This page hasn\'t taken root' : 'Something went wrong' }}
          </h1>
          <p class="text-gray-600 mb-8">
            {{ notFound
              ? 'The page you\'re looking for doesn\'t exist or has moved.'
              : 'Sorry, we hit a problem loading this page. Please try again in a moment.' }}
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              class="bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
              @click="clearError({ redirect: '/' })"
            >
              Back to the homepage
            </button>
            <button
              type="button"
              class="border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
              @click="clearError({ redirect: '/dashboard' })"
            >
              My Tree Troupe
            </button>
          </div>
        </div>
      </section>
    </NuxtLayout>
  </NaiveConfig>
</template>
