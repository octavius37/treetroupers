<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div>
    <section class="relative h-[400px] overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-green-800 to-teal-700">
        <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 50%);" />
      </div>
      <div class="relative z-10 flex items-center justify-center h-full px-6">
        <h1 class="text-4xl md:text-5xl text-white text-center font-bold">
          What Can I Do?
        </h1>
      </div>
    </section>

    <section class="py-16 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Every tree makes a difference. Here's how you can get involved with Tree Troupe
            and start making an impact in your community.
          </p>
        </div>

        <div class="space-y-16">
          <!-- Step 1 -->
          <div class="flex flex-col md:flex-row gap-8 items-center">
            <div class="w-full md:w-1/3">
              <div class="aspect-square bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
                [Join illustration placeholder]
              </div>
            </div>
            <div class="w-full md:w-2/3">
              <div class="text-sm font-semibold text-green-600 mb-2">
                Step 1
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-3">
                Join Your Local Tree Troupe
              </h3>
              <p class="text-gray-600 leading-relaxed">
                Sign up for a free account and find a community near you, or start your own.
                Tree Troupes are organised geographically — from neighbourhood level up to regional and national groups.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex flex-col md:flex-row-reverse gap-8 items-center">
            <div class="w-full md:w-1/3">
              <div class="aspect-square bg-gradient-to-br from-amber-100 to-yellow-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
                [Planting illustration placeholder]
              </div>
            </div>
            <div class="w-full md:w-2/3">
              <div class="text-sm font-semibold text-green-600 mb-2">
                Step 2
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-3">
                Plant &amp; Log Your Trees
              </h3>
              <p class="text-gray-600 leading-relaxed">
                Plant a tree in your garden, neighbourhood, or at a community event. Log it on Tree Troupe
                with a photo and location to add it to our growing global map of community-planted trees.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex flex-col md:flex-row gap-8 items-center">
            <div class="w-full md:w-1/3">
              <div class="aspect-square bg-gradient-to-br from-blue-100 to-sky-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
                [Track illustration placeholder]
              </div>
            </div>
            <div class="w-full md:w-2/3">
              <div class="text-sm font-semibold text-green-600 mb-2">
                Step 3
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-3">
                Track &amp; Update
              </h3>
              <p class="text-gray-600 leading-relaxed">
                Post updates about your trees and those planted by fellow community members.
                Watch them grow over time and share the progress with your troupe.
              </p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="flex flex-col md:flex-row-reverse gap-8 items-center">
            <div class="w-full md:w-1/3">
              <div class="aspect-square bg-gradient-to-br from-purple-100 to-violet-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
                [Rewards illustration placeholder]
              </div>
            </div>
            <div class="w-full md:w-2/3">
              <div class="text-sm font-semibold text-green-600 mb-2">
                Step 4
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-3">
                Earn Points &amp; Rewards
              </h3>
              <p class="text-gray-600 leading-relaxed">
                Every tree planted, every update posted, and every tree verified earns you points.
                Climb your community's leaderboard and unlock rewards as you grow your impact.
              </p>
            </div>
          </div>
        </div>

        <div class="text-center mt-16">
          <NuxtLink to="/register" class="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors text-lg">
            Join Tree Troupe Today
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
