<script setup lang="ts">
const route = useRoute()

const sidebarLinks = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/dashboard/feed', label: 'Community Feed' },
  { to: '/dashboard/plant', label: 'Plant a Tree' },
  { to: '/dashboard/map', label: 'Tree Map' },
  { to: '/dashboard/leaderboard', label: 'Leaderboard' },
  { to: '/dashboard/communities', label: 'Communities' },
  { to: '/dashboard/profile', label: 'Profile' },
]

function isActive(path: string) {
  if (path === '/dashboard') { return route.path === '/dashboard' }
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <AppHeader />

    <div class="flex-1 flex">
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <nav class="flex-1 px-3 py-6 space-y-1">
          <NuxtLink
            v-for="link in sidebarLinks"
            :key="link.to"
            :to="link.to"
            class="block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
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
