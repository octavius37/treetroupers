<script setup lang="ts">
// A profile photo, or the first letter of the name on a green circle.
const props = withDefaults(defineProps<{
  name: string
  url?: string | null
  size?: 'sm' | 'md' | 'lg'
}>(), { url: null, size: 'md' })

const SIZES = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-20 h-20 text-2xl' }
</script>

<template>
  <img
    v-if="props.url"
    :src="props.url"
    :alt="props.name"
    class="rounded-full object-cover flex-shrink-0"
    :class="SIZES[props.size]"
  >
  <div
    v-else
    class="bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold flex-shrink-0"
    :class="SIZES[props.size]"
    aria-hidden="true"
  >
    {{ (props.name || '?')[0]?.toUpperCase() }}
  </div>
</template>
