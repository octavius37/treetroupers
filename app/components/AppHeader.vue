<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const mobileMenuOpen = ref(false)

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/climate-change', label: 'Climate change & trees' },
  { to: '/what-can-i-do', label: 'What can I do?' },
  { to: '/who-we-are', label: 'Who we are' },
  { to: '/contact', label: 'Contact' },
]

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
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
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
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            @click="mobileMenuOpen = false"
          >
            {{ link.label }}
          </NuxtLink>
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
