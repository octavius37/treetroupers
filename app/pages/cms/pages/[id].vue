<script setup lang="ts">
definePageMeta({ middleware: 'cms-auth' })

const route = useRoute()
const reloadPages = inject<() => Promise<void>>('reloadPages')
const id = computed(() => route.params.id as string)

const { data: page, error: fetchError } = await useFetch<{
  id: string
  title: string
  slug: string
  content: string | null
  status: 'draft' | 'published'
}>(() => `/api/cms/pages/${id.value}`)

const saving = ref(false)
const errorMsg = ref('')

async function handleSave(payload: { title: string, slug: string, status: 'draft' | 'published', html: string }) {
  saving.value = true
  errorMsg.value = ''
  try {
    await $fetch(`/api/cms/pages/${id.value}`, {
      method: 'PATCH',
      body: {
        title: payload.title,
        slug: payload.slug,
        status: payload.status,
        content: payload.html,
      },
    })
    await reloadPages?.()
  }
  catch (e: any) {
    errorMsg.value = e.data?.message || e.message || 'Failed to save page'
  }
  saving.value = false
}
</script>

<template>
  <div class="h-full relative">
    <div v-if="fetchError" class="h-full flex items-center justify-center">
      <div class="text-center">
        <div class="text-red-600 mb-2">
          Failed to load page
        </div>
        <NuxtLink to="/cms/pages" class="text-green-600 hover:text-green-700">
          ← Back to pages
        </NuxtLink>
      </div>
    </div>
    <ClientOnly v-else-if="page">
      <CmsPageBuilder
        :initial-html="page.content || ''"
        :title="page.title"
        :slug="page.slug"
        :status="page.status"
        :saving="saving"
        @save="handleSave"
      />
      <template #fallback>
        <div class="h-full flex items-center justify-center text-gray-500">
          Loading editor…
        </div>
      </template>
    </ClientOnly>
    <div
      v-if="errorMsg"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm"
    >
      {{ errorMsg }}
    </div>
  </div>
</template>
