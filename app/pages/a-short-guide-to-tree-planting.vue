<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'A short guide to tree planting' })

// Ordered steps, so the content lives as data rather than repeated markup.
const steps = [
  {
    title: 'Choose the right spot',
    body: 'Look for somewhere with enough room for the tree when it is fully grown — above and below ground. Keep well clear of buildings, walls, drains and overhead cables, and check how much sun the spot gets through the day.',
  },
  {
    title: 'Pick a suitable tree',
    body: 'Native species usually do best and support the most local wildlife. Match the tree to your space, soil and light: a small garden suits a compact tree such as a rowan, crab apple or hawthorn rather than an oak.',
  },
  {
    title: 'Plant at the right time',
    body: 'In most temperate climates the best time is late autumn to early spring, while the tree is dormant. Avoid planting when the ground is frozen or waterlogged.',
  },
  {
    title: 'Dig a wide, shallow hole',
    body: 'Make the hole about three times as wide as the root ball but no deeper. Loosen the soil around the sides so roots can spread out easily.',
  },
  {
    title: 'Set the tree at the right depth',
    body: 'Place the tree so the point where the trunk flares out at the base sits level with the surrounding soil. Planting too deep is one of the most common reasons young trees fail.',
  },
  {
    title: 'Backfill, water and mulch',
    body: 'Refill the hole with the soil you removed, firming it gently to remove air pockets. Water thoroughly, then spread a ring of mulch around the base, keeping it a few centimetres away from the trunk.',
  },
  {
    title: 'Look after it',
    body: 'Water regularly during dry spells for the first two to three years. Keep the area around the base free of grass and weeds, and only stake the tree if it is somewhere exposed — loosen or remove the tie after a year or two.',
  },
]
</script>

<template>
  <div>
    <section class="relative py-16 px-4 overflow-hidden">
      <ImageSlot
        alt="Young tree freshly planted in a garden"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gray-900 opacity-45" />
      <div class="relative z-10 max-w-4xl mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">
          A short guide to tree planting
        </h1>
        <p class="text-green-50 leading-relaxed max-w-3xl">
          Planting a tree in your own garden is one of the simplest things you can do for the planet. It takes an afternoon, costs very little, and a well-planted tree can thrive for generations. Here's how to get started.
        </p>
      </div>
    </section>

    <section class="py-16 px-4 bg-white">
      <div class="max-w-3xl mx-auto">
        <ol class="space-y-8">
          <li v-for="(step, i) in steps" :key="step.title" class="flex gap-5">
            <span class="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">
              {{ i + 1 }}
            </span>
            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-2">
                {{ step.title }}
              </h2>
              <p class="text-gray-600 leading-relaxed">
                {{ step.body }}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <section class="py-16 px-4 bg-green-600 text-center">
      <h2 class="text-2xl md:text-3xl font-bold text-white mb-6">
        Planted a tree? Log it and track your progress.
      </h2>
      <NuxtLink to="/register" class="inline-block bg-white text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">
        Join tree troupe
      </NuxtLink>
    </section>
  </div>
</template>
