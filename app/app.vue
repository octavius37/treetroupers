<script setup lang="ts">
// Defaults for every page's share preview; pages override title/description.
const { public: { siteUrl } } = useRuntimeConfig()
const route = useRoute()

useSeoMeta({
  description: 'Tree Troupe turns climate worry into action: join a local troupe, log the trees you plant, donate or earn, and celebrate them together.',
  ogSiteName: 'Tree Troupe',
  ogType: 'website',
  ogImage: `${siteUrl}/images/home-hero-tree-sunset.jpg`,
  ogUrl: () => `${siteUrl}${route.path}`,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <NaiveConfig>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NaiveConfig>
</template>
