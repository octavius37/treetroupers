<script setup lang="ts">
const route = useRoute()

const sidebarLinks = [
  { to: '/dashboard', label: 'Overview', icon: 'home' },
  { to: '/dashboard/feed', label: 'Community Feed', icon: 'feed' },
  { to: '/dashboard/suggest', label: 'Suggest a Planting Spot', icon: 'pin' },
  { to: '/dashboard/map', label: 'Tree Map', icon: 'map' },
  { to: '/dashboard/leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { to: '/dashboard/rewards', label: 'Rewards', icon: 'gift' },
  { to: '/dashboard/communities', label: 'Communities', icon: 'globe' },
  { to: '/dashboard/profile', label: 'Profile', icon: 'user' },
]

const logLinks = [
  { to: '/dashboard/plant', label: 'Plant a tree', emoji: '🌳' },
  { to: '/dashboard/plant-donated', label: 'Donate a tree', emoji: '💚' },
  { to: '/dashboard/plant-earned', label: 'Earn a tree', emoji: '✨' },
]

// The phone bar has room for four links and the log button; everything else is
// in the "More" sheet, which lists every page.
const mobileLinksBeforeLog = [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/dashboard/feed', label: 'Feed', icon: 'feed' },
]
const mobileLinksAfterLog = [
  { to: '/dashboard/map', label: 'Map', icon: 'map' },
]

const sheet = ref<'more' | 'log' | null>(null)
watch(() => route.path, () => {
  sheet.value = null
})

function isActive(path: string) {
  if (path === '/dashboard') { return route.path === '/dashboard' }
  // Exact or a sub-page: /dashboard/plant must not match /dashboard/plant-donated.
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <AppHeader />

    <div class="flex-1 flex">
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:flex w-64 relative flex-col flex-shrink-0 overflow-hidden">
        <ImageSlot
          src="/images/dashboard-sidebar-tree.jpg"
          alt="Leafy tree silhouetted against a sunset in a grassy field"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-green-950 opacity-70" />
        <nav class="relative z-10 flex-1 px-3 py-6 space-y-1">
          <NuxtLink
            v-for="link in sidebarLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(link.to) ? 'bg-white/15 text-white' : 'text-green-50/80 hover:bg-white/10 hover:text-white'"
          >
            <NavIcon :name="link.icon" />
            {{ link.label }}
          </NuxtLink>
          <p class="px-4 pt-6 pb-1 text-xs font-semibold uppercase tracking-wider text-green-100/60">
            Log a tree
          </p>
          <NuxtLink
            v-for="link in logLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(link.to) ? 'bg-white/15 text-white' : 'text-green-50/80 hover:bg-white/10 hover:text-white'"
          >
            <span class="w-6 text-center" aria-hidden="true">{{ link.emoji }}</span>
            {{ link.label }}
          </NuxtLink>
        </nav>
      </aside>

      <!-- Mobile bottom nav -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
        <nav class="grid grid-cols-5 items-end" aria-label="Dashboard">
          <NuxtLink
            v-for="link in mobileLinksBeforeLog"
            :key="link.to"
            :to="link.to"
            class="flex flex-col items-center gap-0.5 py-2 text-xs font-medium"
            :class="isActive(link.to) ? 'text-green-600' : 'text-gray-500'"
          >
            <NavIcon :name="link.icon" />
            {{ link.label }}
          </NuxtLink>
          <button
            type="button"
            class="flex flex-col items-center gap-0.5 pb-2 text-xs font-medium text-green-700"
            :aria-expanded="sheet === 'log'"
            @click="sheet = sheet === 'log' ? null : 'log'"
          >
            <span class="-mt-5 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg">
              <NavIcon name="plus" />
            </span>
            Log
          </button>
          <NuxtLink
            v-for="link in mobileLinksAfterLog"
            :key="link.to"
            :to="link.to"
            class="flex flex-col items-center gap-0.5 py-2 text-xs font-medium"
            :class="isActive(link.to) ? 'text-green-600' : 'text-gray-500'"
          >
            <NavIcon :name="link.icon" />
            {{ link.label }}
          </NuxtLink>
          <button
            type="button"
            class="flex flex-col items-center gap-0.5 py-2 text-xs font-medium"
            :class="sheet === 'more' ? 'text-green-600' : 'text-gray-500'"
            :aria-expanded="sheet === 'more'"
            @click="sheet = sheet === 'more' ? null : 'more'"
          >
            <NavIcon name="menu" />
            More
          </button>
        </nav>
      </div>

      <!-- Phone sheets: "Log" and "More" -->
      <div v-if="sheet" class="lg:hidden fixed inset-0 z-30 bg-black/30" @click="sheet = null" />
      <div v-if="sheet" class="lg:hidden fixed left-0 right-0 bottom-16 z-40 bg-white rounded-t-2xl shadow-xl p-4 mb-[env(safe-area-inset-bottom)]">
        <ul v-if="sheet === 'log'" class="space-y-2">
          <li v-for="link in logLinks" :key="link.to">
            <NuxtLink :to="link.to" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 text-green-800 font-medium">
              <span aria-hidden="true">{{ link.emoji }}</span> {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
        <ul v-else class="grid grid-cols-2 gap-2">
          <li v-for="link in sidebarLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium"
              :class="isActive(link.to) ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'"
            >
              <NavIcon :name="link.icon" />
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Main content -->
      <main class="flex-1 p-4 lg:p-8 overflow-auto pb-24 lg:pb-8">
        <slot />
      </main>
    </div>
  </div>
</template>
