<script setup lang="ts">
import { PLACEHOLDER_IMAGE } from '~/utils/imagePlaceholder'

// A swappable image slot: renders a neutral inline-SVG placeholder until real
// artwork is supplied via `src`. Holding the placeholder in one place means
// dropping in a real image is a one-attribute change at the call site.
// `class` reaches the <img> through Vue's attribute fallthrough, so each slot
// keeps its own sizing and object-fit classes.
withDefaults(defineProps<{
  /** Describes the intended image — required, these are real content images. */
  alt: string
  /** Real image URL; omit to show the placeholder. */
  src?: string
}>(), { src: PLACEHOLDER_IMAGE })
</script>

<template>
  <img :src="src" :alt="alt">
</template>
