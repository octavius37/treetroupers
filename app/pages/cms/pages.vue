<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

// The pages list now lives in the CMS layout sidebar. This route is just a
// full-bleed shell for the editor child routes (index / new / [id]).
const { reload } = useCmsPages()

// Children call reloadPages() after save/create so the sidebar list updates.
provide('reloadPages', reload)
</script>

<template>
  <div class="-m-4 lg:-m-8 h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
    <NuxtPage />
  </div>
</template>
