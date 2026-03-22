<script setup lang="ts">
const route = useRoute()

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
  if (path === '/cms') { return route.path === '/cms' }
  return route.path.startsWith(path)
}
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
      <aside class="hidden lg:flex w-60 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <nav class="flex-1 px-3 py-5 space-y-0.5">
          <NuxtLink
            v-for="link in sidebarLinks"
            :key="link.to"
            :to="link.to"
            class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(link.to) ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
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
