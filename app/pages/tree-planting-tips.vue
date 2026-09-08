<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Tree Planting Tips' })

const { data: posts, pending } = useBlogPosts('tree-planting-tips')
</script>

<template>
  <div>
    <section class="py-16 px-4 bg-gray-200">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Tree Planting Tips
        </h1>
        <p class="text-green-700 leading-relaxed max-w-3xl">
          Practical, seasonal advice for planting and caring for trees in your own garden — new tips added regularly.
        </p>
      </div>
    </section>

    <section class="py-16 px-4 bg-white">
      <div class="max-w-4xl mx-auto">
        <p v-if="pending" class="text-gray-500 text-center">
          Loading tips…
        </p>
        <p v-else-if="!posts?.length" class="text-gray-500 text-center">
          No tips have been posted yet — check back soon!
        </p>
        <div v-else class="space-y-10">
          <article v-for="post in posts" :key="post.id" class="border-b border-gray-200 pb-10 last:border-b-0 last:pb-0">
            <time :datetime="post.createdAt" class="text-sm text-green-600 font-medium">
              {{ new Date(post.createdAt).toLocaleDateString() }}
            </time>
            <h2 class="text-2xl font-bold text-gray-900 mt-2 mb-3">
              <NuxtLink :to="`/${post.slug}`" class="hover:text-green-700">
                {{ post.title }}
              </NuxtLink>
            </h2>
            <p class="text-gray-600 leading-relaxed mb-4">
              {{ post.excerpt }}
            </p>
            <NuxtLink :to="`/${post.slug}`" class="text-green-600 font-medium text-sm hover:text-green-700">
              Read more →
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
