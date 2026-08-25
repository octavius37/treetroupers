<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Our Mission' })
</script>

<!-- Ported from the GrapesJS-authored CMS page. Editor-only artifacts are
     dropped: the wrapping <body> (the parser discarded it anyway), generated
     ids, `draggable` attributes, a stray `gjs-hovered` state class, and empty
     gjs-row/gjs-cell divs — all verified to carry no CSS on the public site. -->
<template>
  <div>
    <section class="py-20 px-4 max-w-4xl mx-auto">
      <div>
        <b>The Climate Emergency</b>
      </div>
      <div>
        <span>It is difficult to overstate the seriousness of the climate crisis and the urgency of taking action to mitigate its effects. The burning of fossil fuels is driving unprecedented and accelerating changes in the Earth's climate system, with the critical 1.5°C global temperature increase threshold breached in 2024. Without immediate and deep emissions cuts, the long-term average is likely to surpass 1.5°C within this decade, posing direct threats to human well-being and planetary health: more frequent extreme weather events, rising sea levels, serious disruption to ecosystems and biodiversity, and widespread risks to food and water security.</span>
      </div>
    </section>

    <section class="py-16 px-4">
      <b>Harnessing Climate Helplessness</b>
      <div class="max-w-5xl mx-auto" />
      <div>
        Many people do not just worry about climate change — they feel a sense of helplessness about their ability to change the status quo. A substantial proportion of people believe governments are failing to respond adequately, but also that they are personally doing too little to address climate change.<br><br>Enter Tree Troupe.<br><br>Tree Troupe allows individuals to maximize and collate scaleable personal actions that can meaningfully influence the trajectory of the climate crisis. Tree Troupers harness collective helplessness to drive climate ambition. Tree Troupe is founded on three key tenets:<br>
        <!-- list-decimal/my-4/pl-6 and per-item my-[0.25em] reproduce the
             geometry .tt-page-content CSS gave this list as CMS HTML. -->
        <ol class="list-decimal my-4 pl-6">
          <li class="my-[0.25em]">
            Planting trees is one of the easiest, most effective ways to combat climate change;
          </li>
          <li class="my-[0.25em]">
            Tree planting on a mass scale could be a game-changer for our planet’s health
          </li>
          <li class="my-[0.25em]">
            Tree-planting is something anyone can do - individually, collectively or globally.
          </li>
        </ol>
      </div>
    </section>

    <CommunitiesCarousel />

    <StatsCounter />

    <section class="py-20 px-4 bg-green-600">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-white mb-6">
          Join Tree Troupe Now&nbsp;
        </h2>
        <p class="text-green-100 text-lg mb-8">
          Join Forces with Likeminded People!
        </p>
        <NuxtLink to="/register" class="inline-block bg-white text-green-700 px-8 py-3 rounded-full font-medium hover:bg-green-50 transition-colors">
          Get Started
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
