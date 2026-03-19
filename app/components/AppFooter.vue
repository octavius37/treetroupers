<template>
  <footer class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="md:col-span-1">
          <div class="flex items-center gap-2 mb-4">
            <svg viewBox="0 0 40 50" class="w-6 h-8 text-green-400" fill="currentColor">
              <path d="M20 50 L20 26" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" />
              <path d="M20 22 Q14 14 17 4 Q20 10 20 18Z" />
              <path d="M20 20 Q26 12 23 2 Q20 8 20 16Z" />
            </svg>
            <span class="text-sm font-medium tracking-wide">tree troupe</span>
          </div>
          <p class="text-gray-400 text-sm leading-relaxed">
            Transforming climate helplessness into empowered action through community tree planting.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider mb-4">
            Explore
          </h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink to="/climate-change" class="text-gray-400 hover:text-white text-sm transition-colors">
                Climate change & trees
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/what-can-i-do" class="text-gray-400 hover:text-white text-sm transition-colors">
                What can I do?
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/who-we-are" class="text-gray-400 hover:text-white text-sm transition-colors">
                Who we are
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/contact" class="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Community -->
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider mb-4">
            Community
          </h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink to="/dashboard" class="text-gray-400 hover:text-white text-sm transition-colors">
                My Tree Troupe
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/dashboard/communities" class="text-gray-400 hover:text-white text-sm transition-colors">
                Find a community
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/dashboard/leaderboard" class="text-gray-400 hover:text-white text-sm transition-colors">
                Leaderboard
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/dashboard/map" class="text-gray-400 hover:text-white text-sm transition-colors">
                Tree map
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Get Involved -->
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wider mb-4">
            Get Involved
          </h3>
          <p class="text-gray-400 text-sm mb-4">
            Join your local tree troupe and start making a difference today.
          </p>
          <NuxtLink
            to="/register"
            class="inline-block bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Sign Up
          </NuxtLink>
        </div>
      </div>

      <div class="border-t border-gray-800 mt-10 pt-8 text-center text-gray-500 text-sm">
        &copy; {{ new Date().getFullYear() }} Tree Troupe. All rights reserved.
      </div>
    </div>
  </footer>
</template>
