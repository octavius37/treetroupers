<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { pages, loading: pagesLoading, loadError: pagesLoadError, reload: reloadPages, ensureLoaded } = useCmsPages()

const sidebarCollapsed = ref(false)

const sidebarLinks = [
  { to: '/cms', label: 'Overview', icon: 'dashboard' },
  { to: '/cms/pages', label: 'Pages', icon: 'pages' },
  { to: '/cms/communities', label: 'Communities', icon: 'communities' },
  { to: '/cms/users', label: 'Users', icon: 'users' },
  { to: '/cms/tree-species', label: 'Tree Species', icon: 'species' },
  { to: '/cms/trees', label: 'Trees', icon: 'trees' },
  { to: '/cms/rewards', label: 'Rewards', icon: 'rewards' },
]

function isActive(path: string) {
  if (path === '/cms') {
    return route.path === '/cms'
  }
  return route.path.startsWith(path)
}

const onPagesSection = computed(() => route.path.startsWith('/cms/pages'))
const activePageId = computed(() => (onPagesSection.value ? route.params.id as string | undefined : undefined))
const onNewRoute = computed(() => route.path === '/cms/pages/new')

async function handleDeletePage(id: string) {
  // eslint-disable-next-line no-alert -- admin action requires user confirmation
  if (!confirm('Delete this page?')) {
    return
  }
  try {
    await $fetch(`/api/cms/pages/${id}`, { method: 'DELETE' })
    await reloadPages()
    if (route.params.id === id) {
      await router.push('/cms/pages')
    }
  }
  catch {
    // swallow; list simply won't change
  }
}

// Load the pages list whenever the user is in the Pages section
watch(onPagesSection, (inSection) => {
  if (inSection) {
    ensureLoaded()
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- CMS Header -->
    <header class="bg-white border-b border-gray-100">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <NuxtLink to="/cms" class="flex items-center gap-2.5">
              <svg viewBox="0 0 40 50" class="w-7 h-9 text-green-600" fill="currentColor">
                <path d="M20 50 L20 26" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" />
                <path d="M20 30 Q12 24 14 14 Q18 18 20 26Z" opacity="0.65" />
                <path d="M20 26 Q28 20 26 10 Q22 14 20 22Z" opacity="0.65" />
                <path d="M20 22 Q14 14 17 4 Q20 10 20 18Z" />
                <path d="M20 20 Q26 12 23 2 Q20 8 20 16Z" />
              </svg>
              <span class="text-base font-medium text-gray-800 tracking-wide">tree troupe</span>
            </NuxtLink>
            <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">CMS</span>
          </div>

          <div class="flex items-center gap-4">
            <NuxtLink to="/dashboard" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Back to Dashboard
            </NuxtLink>
            <NuxtLink to="/" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              View Site
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <div class="flex-1 flex">
      <!-- Desktop Sidebar -->
      <aside
        class="hidden lg:flex bg-white border-r border-gray-200 flex-col flex-shrink-0 transition-all duration-150"
        :class="sidebarCollapsed ? 'w-16' : 'w-60'"
      >
        <nav class="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <template v-for="link in sidebarLinks" :key="link.to">
            <!-- Pages: expandable with sub-items -->
            <div v-if="link.to === '/cms/pages'">
              <div
                class="flex items-center rounded-lg text-sm font-medium transition-colors"
                :class="isActive(link.to) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <NuxtLink :to="link.to" class="flex-1 px-3 py-2 truncate" :title="link.label">
                  {{ sidebarCollapsed ? '📄' : link.label }}
                </NuxtLink>
                <NuxtLink
                  v-if="!sidebarCollapsed"
                  to="/cms/pages/new"
                  class="mr-1.5 p-1 rounded-md text-gray-400 hover:text-green-600 hover:bg-white transition-colors"
                  :class="onNewRoute ? 'text-green-600 bg-white ring-1 ring-green-200' : ''"
                  title="New page"
                  @click.stop
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </NuxtLink>
              </div>

              <!-- Page sub-items -->
              <div v-if="!sidebarCollapsed && onPagesSection" class="mt-0.5 ml-3 pl-2 border-l border-gray-200 space-y-0.5">
                <div v-if="pagesLoading && pages.length === 0" class="px-2 py-1.5 text-xs text-gray-400">
                  Loading…
                </div>
                <div v-else-if="pagesLoadError" class="px-2 py-1.5 text-xs text-red-500">
                  Couldn't load pages —
                  <button type="button" class="underline hover:text-red-600" @click="reloadPages">
                    retry
                  </button>
                </div>
                <div v-else-if="pages.length === 0" class="px-2 py-1.5 text-xs text-gray-400">
                  No pages yet
                </div>
                <div
                  v-for="page in pages"
                  v-else
                  :key="page.id"
                  class="group flex items-center rounded-md transition-colors"
                  :class="activePageId === page.id ? 'bg-green-50' : 'hover:bg-gray-50'"
                >
                  <NuxtLink
                    :to="`/cms/pages/${page.id}`"
                    class="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full shrink-0"
                      :class="page.status === 'published' ? 'bg-green-500' : 'bg-gray-300'"
                      :title="page.status"
                    />
                    <span
                      class="text-xs truncate"
                      :class="activePageId === page.id ? 'text-green-700 font-medium' : 'text-gray-600'"
                    >
                      {{ page.title || 'Untitled' }}
                    </span>
                  </NuxtLink>
                  <button
                    type="button"
                    class="opacity-0 group-hover:opacity-100 mr-1 p-0.5 text-gray-300 hover:text-red-600 transition-all shrink-0"
                    title="Delete page"
                    @click="handleDeletePage(page.id)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- All other nav items -->
            <NuxtLink
              v-else
              :to="link.to"
              class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate"
              :class="isActive(link.to) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              :title="link.label"
            >
              {{ sidebarCollapsed ? link.label.charAt(0) : link.label }}
            </NuxtLink>
          </template>
        </nav>

        <!-- Collapse toggle -->
        <button
          type="button"
          class="border-t border-gray-200 px-3 py-3 flex items-center gap-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <svg v-if="sidebarCollapsed" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span v-if="!sidebarCollapsed">Collapse</span>
        </button>
      </aside>

      <!-- Mobile bottom nav -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <nav class="flex justify-around py-2 px-1">
          <NuxtLink
            v-for="link in sidebarLinks.slice(0, 5)"
            :key="link.to"
            :to="link.to"
            class="flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-colors min-w-0"
            :class="isActive(link.to) ? 'text-green-600' : 'text-gray-400'"
          >
            <span class="truncate">{{ link.label }}</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- Main content -->
      <main class="flex-1 p-4 lg:p-8 overflow-auto pb-24 lg:pb-8">
        <slot />
      </main>
    </div>
  </div>
</template>
