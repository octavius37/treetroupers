<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'What Can I Do?' })
</script>

<template>
  <div>
    <section class="relative w-full max-w-[1600px] mx-auto overflow-hidden aspect-[2000/1333]">
      <ImageSlot
        src="/images/what-can-i-do-banner.jpg"
        alt="Lit lightbulb close-up"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0" style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.1));" />
      <h1
        class="absolute font-extrabold text-gray-100"
        style="top:7%; left:40%; right:5%; font-size:clamp(22px, 3.4vw, 48px); line-height:1.08; text-shadow:0 2px 14px rgba(0,0,0,0.6);"
      >
        You can make a difference
      </h1>
      <!-- In-page anchors, not routes — these stay plain <a href="#..."> -->
      <a
        href="#individual-actions"
        class="absolute aspect-square rounded-full box-border flex items-center justify-center text-center font-extrabold text-gray-900"
        style="width:15%; left:55%; top:55%; padding:6%; background: radial-gradient(circle at 40% 35%, #ff2fb0, #e6009e 70%); box-shadow: 0 0 45px 12px rgba(230, 0, 158, 0.5);"
      >
        <span class="leading-tight" style="font-size:clamp(10px, 1.3vw, 18px);">Individual actions</span>
      </a>
      <a
        href="#community-actions"
        class="absolute aspect-square rounded-full box-border flex items-center justify-center text-center font-extrabold text-gray-900"
        style="width:16%; right:5%; top:30%; padding:6%; background: radial-gradient(circle at 40% 35%, #3fce7a, #1fa85a 70%); box-shadow: 0 0 45px 12px rgba(31, 168, 90, 0.5);"
      >
        <span class="leading-tight" style="font-size:clamp(10px, 1.3vw, 18px);">Community actions</span>
      </a>
      <a
        href="#global-actions"
        class="absolute aspect-square rounded-full box-border flex items-center justify-center text-center font-extrabold text-gray-900"
        style="width:14%; right:12%; bottom:6%; padding:6%; background: radial-gradient(circle at 40% 35%, #3fd8ff, #12b8f0 70%); box-shadow: 0 0 45px 12px rgba(18, 184, 240, 0.5);"
      >
        <span class="leading-tight" style="font-size:clamp(10px, 1.3vw, 18px);">Global actions</span>
      </a>
    </section>

    <section id="individual-actions" class="py-16 px-4 bg-green-600 text-center">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-white mb-10">
          Individual actions
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <ImageSlot src="/images/wcid-plant-own-garden.jpg" alt="Cupped hands holding soil with a small seedling" class="h-64 w-full rounded-lg object-cover" />
          <ImageSlot src="/images/wcid-everyday-tasks.jpg" alt="Phone displaying a photo of a forest path, held up in a real forest" class="h-64 w-full rounded-lg object-cover" />
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
          <ImageSlot src="/images/wcid-community-planting.jpg" alt="Group of volunteers of all ages planting a tree together" class="h-64 w-full rounded-lg object-cover" />
          <ImageSlot src="/images/wcid-community-municipal.jpg" alt="Municipal workers in high-visibility vests planting flowers in a park" class="h-64 w-full rounded-lg object-cover" />
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
      <ImageSlot src="/images/wcid-global-actions.jpg" alt="Gloved hands holding a globe with a seedling sprouting from it" class="max-w-2xl mx-auto h-64 w-full rounded-lg object-cover mb-16" />
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
