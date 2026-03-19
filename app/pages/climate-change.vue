<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative h-[400px] overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-amber-900 to-green-900">
        <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%);" />
      </div>
      <div class="relative z-10 flex items-center justify-center h-full px-6">
        <h1 class="text-4xl md:text-5xl text-white text-center font-bold">Climate Change &amp; Trees</h1>
      </div>
    </section>

    <section class="py-16 px-4">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">The Climate Crisis</h2>
        <p class="text-gray-600 leading-relaxed mb-6">
          Climate change represents one of the most significant challenges of our time. Rising global temperatures,
          extreme weather events, and loss of biodiversity threaten ecosystems and communities worldwide.
        </p>

        <div class="bg-gray-50 rounded-2xl p-8 my-8">
          <div class="w-full h-48 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
            [Climate data visualization placeholder]
          </div>
        </div>

        <h2 class="text-2xl font-bold text-gray-900 mb-4">Why Trees Matter</h2>
        <p class="text-gray-600 leading-relaxed mb-6">
          Trees are one of nature's most effective carbon capture systems. A single mature tree can absorb
          up to 22kg of CO₂ per year, while releasing enough oxygen for two people to breathe.
        </p>

        <h3 class="text-xl font-semibold text-gray-900 mb-3">The Power of Trees</h3>
        <ul class="space-y-3 mb-8">
          <li class="flex gap-3 text-gray-600">
            <span class="text-green-600 font-bold">•</span>
            <span><strong class="text-gray-900">Carbon sequestration</strong> — Trees absorb CO₂ from the atmosphere and store it as biomass</span>
          </li>
          <li class="flex gap-3 text-gray-600">
            <span class="text-green-600 font-bold">•</span>
            <span><strong class="text-gray-900">Air quality</strong> — Trees filter pollutants and produce clean oxygen</span>
          </li>
          <li class="flex gap-3 text-gray-600">
            <span class="text-green-600 font-bold">•</span>
            <span><strong class="text-gray-900">Biodiversity</strong> — Trees provide habitat for countless species</span>
          </li>
          <li class="flex gap-3 text-gray-600">
            <span class="text-green-600 font-bold">•</span>
            <span><strong class="text-gray-900">Water management</strong> — Tree roots prevent soil erosion and regulate water cycles</span>
          </li>
          <li class="flex gap-3 text-gray-600">
            <span class="text-green-600 font-bold">•</span>
            <span><strong class="text-gray-900">Urban cooling</strong> — Trees reduce the urban heat island effect by up to 5°C</span>
          </li>
          <li class="flex gap-3 text-gray-600">
            <span class="text-green-600 font-bold">•</span>
            <span><strong class="text-gray-900">Mental health</strong> — Access to green spaces improves wellbeing and reduces stress</span>
          </li>
        </ul>

        <div class="bg-green-50 rounded-2xl p-8 my-8">
          <div class="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
            [Forest ecosystem infographic placeholder]
          </div>
        </div>

        <h2 class="text-2xl font-bold text-gray-900 mb-4">Community Action</h2>
        <p class="text-gray-600 leading-relaxed mb-4">
          While systemic change is essential, community-level action creates immediate, tangible impact.
          When communities come together to plant and care for trees, they build social bonds while directly
          improving their local environment.
        </p>
        <p class="text-gray-600 leading-relaxed mb-8">
          Research shows that community-led environmental initiatives are more sustainable and impactful
          than top-down approaches, because they create a sense of ownership and shared purpose.
        </p>

        <div class="text-center">
          <NuxtLink to="/what-can-i-do" class="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">
            Find out what you can do →
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
