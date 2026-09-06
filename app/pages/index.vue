<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Home' })
</script>

<template>
  <div>
    <section class="relative h-[400px] overflow-hidden">
      <ImageSlot
        src="/images/home-hero-tree-sunset.jpg"
        alt="Silhouette of a large tree against a vivid sunset"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-green-950 opacity-50" />
      <div class="relative z-10 flex items-center justify-center h-full px-6">
        <h1 class="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white text-center italic font-light max-w-4xl leading-snug" style="font-family: Georgia, 'Times New Roman', serif;">
          Transforming climate helplessness into empowered action through community tree planting
        </h1>
      </div>
    </section>

    <section class="py-20 px-4">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-6">
          Our Mission
        </h2>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed text-center mb-12">
          Tree Troupe connects communities around the world to plant, track, and celebrate trees together. We believe that collective action starts locally — one tree, one neighbourhood, one community at a time.
        </p>
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          The Climate Emergency
        </h3>
        <p class="text-gray-600 leading-relaxed mb-8">
          It is difficult to overstate the seriousness of the climate crisis and the urgency of taking action to mitigate its effects. The burning of fossil fuels is driving unprecedented and accelerating changes in the Earth's climate system, with the critical 1.5°C global temperature increase threshold breached in 2024. Without immediate and deep emissions cuts, the long-term average is likely to surpass 1.5°C within this decade, posing direct threats to human well-being and planetary health: more frequent extreme weather events, rising sea levels, serious disruption to ecosystems and biodiversity, and widespread risks to food and water security.
        </p>
        <div class="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">
              Harnessing Climate Helplessness
            </h3>
            <p class="text-gray-600 leading-relaxed mb-4">
              Many people do not just worry about climate change — they feel a sense of helplessness about their ability to change the status quo. A substantial proportion of people believe governments are failing to respond adequately, but also that they are personally doing too little to address climate change.
            </p>
            <p class="text-gray-600 leading-relaxed mb-4">
              Enter Tree Troupe.
            </p>
            <p class="text-gray-600 leading-relaxed mb-4">
              Tree Troupe allows individuals to maximize and collate scaleable personal actions that can meaningfully influence the trajectory of the climate crisis. Tree Troupers harness collective helplessness to drive climate ambition. Tree Troupe is founded on three key tenets:
            </p>
            <!-- list-decimal and my-4 are added here: the source CMS markup relied
                 on the .tt-page-content stylesheet for its numbering and vertical
                 margin, and that no longer applies now the page is code.
                 space-y-2 still wins margin-top on items 2 and 3. -->
            <ol class="space-y-2 pl-6 text-gray-600 list-decimal my-4">
              <li>Planting trees is one of the easiest, most effective ways to combat climate change;</li>
              <li>Tree planting on a mass scale could be a game-changer for our planet's health</li>
              <li>Tree-planting is something anyone can do - individually, collectively or globally.</li>
            </ol>
          </div>
          <ImageSlot
            src="/images/home-mission-seedling.jpg"
            alt="Cupped hands holding soil with a small seedling"
            class="rounded-lg w-full h-80 object-cover"
          />
        </div>
      </div>
    </section>

    <section class="py-10 px-4 bg-gray-50">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">
          How It Works
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-8">
            <ImageSlot src="/images/home-how-community.jpg" alt="River winding through a valley at sunset" class="h-40 w-full rounded-lg object-cover mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 mb-3">
              Join a Community
            </h3>
            <p class="text-gray-600">
              Find or create a local tree troupe in your area and connect with fellow planters.
            </p>
          </div>
          <div class="text-center p-8">
            <ImageSlot src="/images/home-how-plant-log.jpg" alt="Mountain peak framed by pine trees" class="h-40 w-full rounded-lg object-cover mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 mb-3">
              Plant &amp; Log Trees
            </h3>
            <p class="text-gray-600">
              Plant a tree and log it with a photo and GPS location to add it to our global map.
            </p>
          </div>
          <div class="text-center p-8">
            <ImageSlot src="/images/home-how-celebrate.jpg" alt="Bird perched atop a tree at sunset" class="h-40 w-full rounded-lg object-cover mb-4" />
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

    <section class="relative h-64 overflow-hidden">
      <ImageSlot
        src="/images/home-band-cliff-pine.jpg"
        alt="Lone pine tree growing from a cliff edge at sunset"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gray-900 opacity-20" />
    </section>

    <StatsCounter />

    <section class="relative py-20 px-4 overflow-hidden">
      <ImageSlot
        src="/images/home-cta-forest-path.jpg"
        alt="Dirt path leading through a sunlit pine forest"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-green-950 opacity-75" />
      <div class="relative z-10 max-w-3xl mx-auto text-center">
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
