<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const mobileMenuOpen = ref(false)

interface NavItem {
  to: string
  label: string
  children: { to: string, label: string }[]
}

// Static links that always appear, regardless of CMS content.
const staticLinks: NavItem[] = [
  { to: '/', label: 'Home', children: [] },
  { to: '/climate-change', label: 'Climate change & trees', children: [] },
  { to: '/what-can-i-do', label: 'What can I do?', children: [] },
  { to: '/who-we-are', label: 'Who we are', children: [] },
  { to: '/contact', label: 'Contact', children: [] },
]

// Dynamic, CMS-managed pages (published + show_in_nav), as a parent/child tree.
const { data: navPages } = useNavPages()

// Unified nav model: static links followed by dynamic CMS pages.
const navItems = computed<NavItem[]>(() => [
  ...staticLinks,
  ...(navPages.value ?? []).map(p => ({
    to: p.to,
    label: p.title,
    children: p.children.map(c => ({ to: c.to, label: c.title })),
  })),
])

async function handleLogout() {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<template>
  <header class="bg-white border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <svg viewBox="0 0 40 50" class="w-8 h-10 text-green-600" fill="currentColor">
            <path d="M20 50 L20 26" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" />
            <path d="M20 30 Q12 24 14 14 Q18 18 20 26Z" opacity="0.65" />
            <path d="M20 26 Q28 20 26 10 Q22 14 20 22Z" opacity="0.65" />
            <path d="M20 22 Q14 14 17 4 Q20 10 20 18Z" />
            <path d="M20 20 Q26 12 23 2 Q20 8 20 16Z" />
          </svg>
          <span class="text-lg font-medium text-gray-800 tracking-wide">tree troupe</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center gap-6">
          <template v-for="item in navItems" :key="item.to">
            <!-- Leaf link -->
            <NuxtLink
              v-if="item.children.length === 0"
              :to="item.to"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {{ item.label }}
            </NuxtLink>
            <!-- Parent with dropdown -->
            <div v-else class="relative group">
              <NuxtLink
                :to="item.to"
                class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {{ item.label }}
                <svg class="w-3.5 h-3.5 mt-0.5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </NuxtLink>
              <!-- Dropdown (CSS hover; small pt-2 bridge keeps it open while moving the cursor down) -->
              <div class="absolute left-0 top-full pt-2 hidden group-hover:block z-50">
                <div class="bg-white border border-gray-100 rounded-xl shadow-lg py-2 min-w-48">
                  <NuxtLink
                    v-for="child in item.children"
                    :key="child.to"
                    :to="child.to"
                    class="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    {{ child.label }}
                  </NuxtLink>
                </div>
              </div>
            </div>
          </template>
        </nav>

        <!-- Auth Actions -->
        <div class="hidden lg:flex items-center gap-4">
          <template v-if="user">
            <NuxtLink to="/cms" class="text-sm text-gray-600 hover:text-gray-900">
              CMS
            </NuxtLink>
            <button class="text-sm text-gray-600 hover:text-gray-900" @click="handleLogout">
              Logout
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="text-sm text-gray-600 hover:text-gray-900">
              Login
            </NuxtLink>
          </template>
          <NuxtLink
            to="/dashboard"
            class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
          >
            My Tree Troupe
          </NuxtLink>
        </div>

        <!-- Mobile menu button -->
        <button
          class="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="lg:hidden pb-4 border-t border-gray-100">
        <nav class="flex flex-col gap-1 pt-3">
          <template v-for="item in navItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              @click="mobileMenuOpen = false"
            >
              {{ item.label }}
            </NuxtLink>
            <NuxtLink
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              class="ml-4 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg border-l border-gray-100"
              @click="mobileMenuOpen = false"
            >
              {{ child.label }}
            </NuxtLink>
          </template>
          <div class="border-t border-gray-100 mt-2 pt-2">
            <template v-if="user">
              <button class="w-full text-left px-3 py-2 text-sm text-gray-600" @click="handleLogout; mobileMenuOpen = false">
                Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink to="/login" class="block px-3 py-2 text-sm text-gray-600" @click="mobileMenuOpen = false">
                Login
              </NuxtLink>
            </template>
            <NuxtLink
              to="/dashboard"
              class="block mx-3 mt-2 text-center bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium"
              @click="mobileMenuOpen = false"
            >
              My Tree Troupe
            </NuxtLink>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>
