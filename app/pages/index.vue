<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative h-[400px] overflow-hidden">
      <!-- Placeholder for hero image (tree canopy looking up) -->
      <div class="absolute inset-0 bg-gradient-to-b from-green-950 via-green-800 to-green-600">
        <div
          class="absolute inset-0 opacity-30"
          style="background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.06) 0%, transparent 60%);"
        />
        <!-- Subtle vertical lines suggesting tree trunks -->
        <div class="absolute inset-0 opacity-[0.04]" style="background-image: repeating-linear-gradient(90deg, white 0px, transparent 2px, transparent 60px);" />
      </div>
      <div class="relative z-10 flex items-center justify-center h-full px-6">
        <h1
          class="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white text-center italic font-light max-w-4xl leading-snug"
          style="font-family: Georgia, 'Times New Roman', serif;"
        >
          Transforming climate helplessness into empowered action through community tree planting
        </h1>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="py-20 px-4">
      <div class="max-w-7xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-6">
          Our Mission
        </h2>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Tree Troupe connects communities around the world to plant, track, and celebrate trees together.
          We believe that collective action starts locally — one tree, one neighbourhood, one community at a time.
        </p>
      </div>
    </section>

    <!-- How it Works -->
    <section class="py-10 px-4 bg-gray-50">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">
          How It Works
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-8">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">
              Join a Community
            </h3>
            <p class="text-gray-600">
              Find or create a local tree troupe in your area and connect with fellow planters.
            </p>
          </div>

          <div class="text-center p-8">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">
              Plant &amp; Log Trees
            </h3>
            <p class="text-gray-600">
              Plant a tree and log it with a photo and GPS location to add it to our global map.
            </p>
          </div>

          <div class="text-center p-8">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">
              Earn &amp; Celebrate
            </h3>
            <p class="text-gray-600">
              Earn points for planting and verifying trees. Climb the leaderboard and unlock rewards.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Impact Stats -->
    <section class="py-20 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div class="text-4xl font-bold text-green-600 mb-2">
              0
            </div>
            <div class="text-gray-600">
              Trees Planted
            </div>
          </div>
          <div>
            <div class="text-4xl font-bold text-green-600 mb-2">
              0
            </div>
            <div class="text-gray-600">
              Communities
            </div>
          </div>
          <div>
            <div class="text-4xl font-bold text-green-600 mb-2">
              0
            </div>
            <div class="text-gray-600">
              Active Members
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 px-4 bg-green-600">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-white mb-6">
          Ready to make a difference?
        </h2>
        <p class="text-green-100 text-lg mb-8">
          Join Tree Troupe and start planting trees with your local community today.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/register" class="bg-white text-green-700 px-8 py-3 rounded-full font-medium hover:bg-green-50 transition-colors">
            Get Started
          </NuxtLink>
          <NuxtLink to="/what-can-i-do" class="border-2 border-white text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">
            Learn More
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
