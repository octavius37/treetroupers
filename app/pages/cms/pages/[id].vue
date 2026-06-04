<script setup lang="ts">
definePageMeta({ middleware: 'cms-auth' })

const route = useRoute()
const reloadPages = inject<() => Promise<void>>('reloadPages')
const { pages, ensureLoaded } = useCmsPages()
const id = computed(() => route.params.id as string)

const { data: page, error: fetchError } = await useFetch<{
  id: string
  title: string
  slug: string
  content: string | null
  status: 'draft' | 'published'
  parent_id: string | null
  nav_order: number
  show_in_nav: boolean
}>(() => `/api/cms/pages/${id.value}`)

// Other pages can be parents; exclude the current page to prevent self-parenting.
const parentOptions = computed(() =>
  pages.value.filter(p => p.id !== id.value).map(p => ({ id: p.id, title: p.title })),
)

onMounted(ensureLoaded)

const saving = ref(false)
const errorMsg = ref('')

interface SavePayload {
  title: string
  slug: string
  status: 'draft' | 'published'
  html: string
  parent_id: string | null
  nav_order: number
  show_in_nav: boolean
}

async function handleSave(payload: SavePayload) {
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
        parent_id: payload.parent_id,
        nav_order: payload.nav_order,
        show_in_nav: payload.show_in_nav,
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
        :parent-id="page.parent_id"
        :nav-order="page.nav_order"
        :show-in-nav="page.show_in_nav"
        :parent-options="parentOptions"
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
