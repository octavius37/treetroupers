<script setup lang="ts">
definePageMeta({ middleware: 'cms-auth' })

const router = useRouter()
const reloadPages = inject<() => Promise<void>>('reloadPages')
const { pages, ensureLoaded } = useCmsPages()
const saving = ref(false)
const errorMsg = ref('')

// Any existing page can be a parent for the new one.
const parentOptions = computed(() => pages.value.map(p => ({ id: p.id, title: p.title })))

onMounted(ensureLoaded)

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
    const created = await $fetch('/api/cms/pages', {
      method: 'POST',
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
    await router.push(`/cms/pages/${(created as any).id}`)
  }
  catch (e: any) {
    errorMsg.value = e.data?.message || e.message || 'Failed to create page'
    saving.value = false
  }
}
</script>

<template>
  <div class="h-full relative">
    <ClientOnly>
      <CmsPageBuilder
        title=""
        slug=""
        status="draft"
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
