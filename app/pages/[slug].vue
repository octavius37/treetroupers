<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: page, error } = await useFetch<{
  id: string
  title: string
  slug: string
  html: string
}>(() => `/api/public/pages/${slug.value}`)

if (error.value || !page.value) {
  throw createError({ statusCode: 404, message: 'Page not found', fatal: true })
}

useHead({ title: page.value.title })
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- trusted CMS content authored by admins -->
  <div v-if="page" class="tt-page-content" v-html="page.html" />
</template>

<style>
/* Tailwind preflight resets list markers; restore them for CMS-authored lists.
   Mirrors LIST_CSS in PageBuilder.client.vue so the public page matches the editor. */
.tt-page-content ul { list-style: disc; margin: 1em 0; padding-left: 1.5em; }
.tt-page-content ol { list-style: decimal; margin: 1em 0; padding-left: 1.5em; }
.tt-page-content ul ul { list-style: circle; }
.tt-page-content ul ul ul { list-style: square; }
.tt-page-content li { margin: 0.25em 0; }
</style>
