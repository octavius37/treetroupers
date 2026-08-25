<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Home' })
</script>

<template>
  <div>
    <section class="relative h-[400px] overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-green-950 via-green-800 to-green-600">
        <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.06) 0%, transparent 60%);" />
        <div class="absolute inset-0 opacity-[0.04]" style="background-image: repeating-linear-gradient(90deg, white 0px, transparent 2px, transparent 60px);" />
      </div>
      <div class="relative z-10 flex items-center justify-center h-full px-6">
        <h1 class="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white text-center italic font-light max-w-4xl leading-snug" style="font-family: Georgia, 'Times New Roman', serif;">
          Transforming climate helplessness into empowered action through community tree planting
        </h1>
      </div>
    </section>

    <section class="py-20 px-4">
      <div class="max-w-7xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-6">
          Our Mission
        </h2>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Tree Troupe connects communities around the world to plant, track, and celebrate trees together. We believe that collective action starts locally — one tree, one neighbourhood, one community at a time.
        </p>
      </div>
    </section>

    <section class="py-10 px-4 bg-gray-50">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">
          How It Works
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">
              Join a Community
            </h3>
            <p class="text-gray-600">
              Find or create a local tree troupe in your area and connect with fellow planters.
            </p>
          </div>
          <div class="text-center p-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">
              Plant &amp; Log Trees
            </h3>
            <p class="text-gray-600">
              Plant a tree and log it with a photo and GPS location to add it to our global map.
            </p>
          </div>
          <div class="text-center p-8">
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

    <StatsCounter />

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
