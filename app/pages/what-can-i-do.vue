<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'What Can I Do?' })
</script>

<template>
  <div>
    <section class="relative py-32 px-6 overflow-hidden">
      <ImageSlot alt="Photo placeholder: Lit lightbulb close-up" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gray-900 opacity-60" />
      <div class="relative z-10 max-w-6xl mx-auto">
        <h1 class="text-4xl md:text-6xl font-bold text-white mb-4">
          You can make a difference
        </h1>
      </div>
      <!-- In-page anchors, not routes — these stay plain <a href="#..."> -->
      <a href="#individual-actions" style="position:absolute; left:6%; top:42%; width:180px; height:180px;" class="rounded-full bg-pink-500 opacity-80 flex items-center justify-center text-center text-gray-900 font-bold px-4">Individual actions</a>
      <a href="#community-actions" style="position:absolute; right:8%; top:12%; width:180px; height:180px;" class="rounded-full bg-green-500 opacity-80 flex items-center justify-center text-center text-gray-900 font-bold px-4">Community actions</a>
      <a href="#global-actions" style="position:absolute; right:18%; bottom:4%; width:180px; height:180px;" class="rounded-full bg-sky-400 opacity-80 flex items-center justify-center text-center text-gray-900 font-bold px-4">Global actions</a>
    </section>

    <section id="individual-actions" class="py-16 px-4 bg-green-600 text-center">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-white mb-10">
          Individual actions
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <ImageSlot alt="Photo placeholder: Planting a sapling" class="h-64 w-full rounded-lg object-cover" />
          <ImageSlot alt="Photo placeholder: Digital / tech abstract" class="h-64 w-full rounded-lg object-cover" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <div>
            <h3 class="text-2xl font-bold text-white mb-4">
              Plant a tree in your own garden
            </h3>
            <p class="text-green-50 leading-relaxed">
              Every tree planted makes a difference. This is something you can do at home, at little to no cost. We have helpful guides to get you started here. Join tree troupe, use our geotagging software to log your trees, and track your progress with your friends!
            </p>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-white mb-4">
              Plant free trees doing everyday tasks
            </h3>
            <p class="text-green-50 leading-relaxed">
              <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -- inline link in flowing text; a line break would collapse to a space before the full stop -->
              There are many apps, browsers and search engines that will plant trees simply by you using them. So you help the planet by doing something you would do anyway! Win! For our list and review of the options, see <NuxtLink to="/planting-trees-doing-everyday-tasks" class="underline hover:text-white">here</NuxtLink>. Join tree troupe and track your progress with your friends!
            </p>
          </div>
        </div>
        <NuxtLink to="/dashboard/plant" class="inline-block bg-white border-2 border-green-600 text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">
          Learn More
        </NuxtLink>
      </div>
    </section>

    <section id="community-actions" class="py-16 px-4 bg-gray-200 text-center">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 mb-10">
          Community actions
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <ImageSlot alt="Photo placeholder: Community tree planting" class="h-64 w-full rounded-lg object-cover" />
          <ImageSlot alt="Photo placeholder: Climate justice protest sign" class="h-64 w-full rounded-lg object-cover" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">
              Join a tree planting effort in your neighbourhood
            </h3>
            <p class="text-gray-700 leading-relaxed">
              Many organizations run tree planting efforts around the world. Join your local tree troupe pod to find out about events happening in your area, and track your progress with your friends!
            </p>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">
              Engage with your municipality to plant trees
            </h3>
            <p class="text-gray-700 leading-relaxed">
              Many local municipalities have greening programs underway. Join your local tree troupe pod to find out about, and take advantage of, local programs, and to band together with other members to lobby your local politicians to take action.
            </p>
          </div>
        </div>
        <NuxtLink to="/dashboard/communities" class="inline-block bg-white border-2 border-green-600 text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">
          Learn More
        </NuxtLink>
      </div>
    </section>

    <section id="global-actions" class="relative pt-16 pb-32 px-4 bg-white text-center overflow-hidden">
      <h2 class="text-3xl font-bold text-green-700 mb-10">
        Global actions
      </h2>
      <ImageSlot alt="Photo placeholder: Seedling trays" class="max-w-2xl mx-auto h-64 w-full rounded-lg object-cover mb-16" />
      <h2 class="text-3xl md:text-4xl font-bold text-green-700 mb-6">
        Contribute to global tree planting efforts
      </h2>
      <p class="text-green-700 max-w-2xl mx-auto mb-10 leading-relaxed">
        <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -- inline link in flowing text; a line break would collapse to a space before the full stop -->
        Many organizations engage in mass restoration, reforestation, and conservation efforts around the world. See our review of different organizations <NuxtLink to="/global-tree-planting-organizations" class="underline hover:text-green-900">here</NuxtLink>. Track your contributions with your friends by joining tree troupe.
      </p>
      <NuxtLink to="/global-tree-planting-organizations" class="inline-block bg-white border-2 border-green-600 text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">
        Learn More
      </NuxtLink>
      <div style="position:absolute; left:0; right:0; bottom:0; height:90px; overflow:hidden;">
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style="width:100%; height:100%; display:block;">
          <path d="M0,60 C360,0 1080,120 1440,40 L1440,90 L0,90 Z" fill="#16a34a" />
        </svg>
      </div>
    </section>
  </div>
</template>
