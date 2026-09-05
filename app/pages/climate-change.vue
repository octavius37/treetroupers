<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Climate change & trees' })
</script>

<template>
  <div>
    <section class="py-16 px-4 bg-gray-100">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-10">
          The climate crisis and action paralysis
        </h2>
        <div class="relative rounded-2xl overflow-hidden p-4 md:p-6 mb-10">
          <ImageSlot
            src="/images/climate-crisis-forest-canopy-bg.jpg"
            alt="Aerial view of a dense forest canopy"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gray-900 opacity-40" />
          <div class="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <ImageSlot src="/images/climate-crisis-earth.jpg" alt="Illustration of Earth engulfed in flame, depicting the climate crisis" class="h-48 w-full rounded-lg object-cover" />
            <ImageSlot src="/images/climate-summit-un.jpg" alt="Row of international flags leading to the United Nations building" class="h-48 w-full rounded-lg object-cover" />
            <ImageSlot src="/images/climate-justice-protest.jpg" alt="Protester holding a sign reading Climate Justice Now!" class="h-48 w-full rounded-lg object-cover" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="border-t-4 border-gray-900 pt-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Climate change
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Climate change, driven by human greenhouse gas emissions, is a fact. It is driving terrestrial and marine warming, extreme weather events, and biodiversity loss.
            </p>
          </div>
          <div class="border-t-4 border-gray-900 pt-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Collective helplessness
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Global governments are taking action to tackle climate change, but scientists agree that progress is too slow. Individual citizens are frustrated, with over 80% of people globally wanting their governments to do more.
            </p>
          </div>
          <div class="border-t-4 border-gray-900 pt-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Personal action gap
            </h3>
            <p class="text-gray-600 leading-relaxed">
              50% of people feel they are personally doing too little to combat climate change. But it's hard to know what to do to tackle such a pervasive and massive problem. Even motivated individuals do not know how best to act.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-24 px-6 overflow-hidden">
      <ImageSlot src="/images/climate-change-solution-banner.jpg" alt="Autumn forest path carpeted in fallen leaves" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gray-900 opacity-40" />
      <div class="relative z-10 max-w-4xl mx-auto">
        <h2 class="text-3xl md:text-5xl font-bold text-white mb-12 leading-tight">
          A simple solution: plant more trees!
        </h2>
        <!-- list-disc/my-4/pl-6 and the per-item my-[0.25em] reproduce the
             geometry the .tt-page-content CSS gave this list as CMS HTML;
             space-y-6 still wins margin-top on items 2 and 3. -->
        <ul class="space-y-6 list-disc my-4 pl-6">
          <li class="flex gap-3 text-white text-lg leading-relaxed my-[0.25em]">
            <span class="text-green-400 font-bold">•</span><span><strong class="text-white">Nature's carbon capture</strong>: Trees sequester carbon dioxide effectively. There is no need for expensive technological fixes.</span>
          </li>
          <li class="flex gap-3 text-white text-lg leading-relaxed my-[0.25em]">
            <span class="text-green-400 font-bold">•</span><span><strong class="text-white">Tangible individual impact</strong>: Planting trees provides a direct and visible environmental impact that is driven by the community, not politics.</span>
          </li>
          <li class="flex gap-3 text-white text-lg leading-relaxed my-[0.25em]">
            <span class="text-green-400 font-bold">•</span><span><strong class="text-white">Emotional connection</strong>: Planting trees gives communities a personal stake in climate action where green spaces are treasured.</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="relative h-[400px] overflow-hidden">
      <ImageSlot src="/images/climate-change-vista-banner.jpg" alt="Lone tree on a hillside at sunset" class="absolute inset-0 w-full h-full object-cover" />
      <div class="relative z-10 h-full max-w-6xl mx-auto px-6 pt-10 flex items-start justify-between gap-6 flex-wrap">
        <h1 class="text-2xl md:text-4xl font-bold text-gray-900 max-w-2xl leading-snug">
          Read on to discover how tree troupe can help you plant trees individually and collectively, and to track your progress!
        </h1>
        <NuxtLink to="/what-can-i-do" class="shrink-0 inline-block bg-green-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-green-700 transition-colors">
          What can I do?
        </NuxtLink>
      </div>
    </section>

    <section class="py-12 px-4 bg-green-600 text-center">
      <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">
        Contact us
      </h2>
      <p class="text-green-100 mb-6 max-w-xl mx-auto">
        Got a question about planting with your community? We would love to hear from you.
      </p>
      <NuxtLink to="/contact" class="inline-block bg-white text-green-700 px-8 py-3 rounded-full font-medium hover:bg-green-50 transition-colors">
        Get in touch
      </NuxtLink>
    </section>

    <section class="py-16 px-4 bg-white text-center">
      <NuxtLink to="/what-can-i-do" class="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors">
        Find out what you can do →
      </NuxtLink>
    </section>
  </div>
</template>
