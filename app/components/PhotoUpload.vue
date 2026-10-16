<script setup lang="ts">
// A single-photo upload control: picks an image, downscales it, uploads it
// immediately to Supabase Storage via /api/dashboard/tree-photo, and v-models
// the resulting public URL (or null once removed). Shared by the
// plant/donate/earn forms, which each attach the result as proof when logging
// a tree.
const props = defineProps<{
  modelValue: string | null
  label: string
  hint?: string
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

// Bind with v-model:uploading so the form can hold its submit button until the
// URL arrives. Submitting earlier saves the tree without the photo.
const uploading = defineModel<boolean>('uploading', { default: false })

// The upload endpoint's limit, set by Vercel's 4.5 MB request cap.
const MAX_UPLOAD_SIZE = 4 * 1024 * 1024

const fileInput = useTemplateRef('fileInput')
const error = ref('')

async function handleFileChange(e: Event) {
  const picked = (e.target as HTMLInputElement).files?.[0]
  if (!picked) { return }

  error.value = ''
  uploading.value = true

  try {
    const file = await downscaleImage(picked)
    if (file.size > MAX_UPLOAD_SIZE) {
      error.value = 'This photo is over 4 MB and could not be resized. Please choose a smaller one.'
      return
    }

    const body = new FormData()
    body.append('file', file)
    const { url } = await $fetch('/api/dashboard/tree-photo', { method: 'POST', body })
    emit('update:modelValue', url)
  }
  catch (err: any) {
    error.value = err.data?.message || err.message || 'Upload failed'
  }
  finally {
    uploading.value = false
    if (fileInput.value) { fileInput.value.value = '' }
  }
}

function remove() {
  emit('update:modelValue', null)
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ props.label }}<span v-if="props.required" class="text-red-500" aria-hidden="true"> *</span>
    </label>
    <p v-if="props.hint" class="text-xs text-gray-500 mb-2">
      {{ props.hint }}
    </p>

    <div v-if="props.modelValue" class="relative">
      <img :src="props.modelValue" alt="Uploaded proof photo" class="w-full h-48 object-cover rounded-lg">
      <button
        type="button"
        class="absolute top-2 right-2 bg-white/90 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-white transition-colors shadow"
        aria-label="Remove photo"
        @click="remove"
      >
        ✕
      </button>
    </div>

    <label
      v-else
      class="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 hover:border-green-400 transition-colors cursor-pointer"
    >
      <input ref="fileInput" type="file" accept="image/*" class="hidden" :disabled="uploading" @change="handleFileChange">
      <svg class="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
      <p class="text-sm">
        {{ uploading ? 'Uploading...' : 'Click to upload a photo' }}
      </p>
    </label>

    <p v-if="error" class="text-sm text-red-600 mt-1">
      {{ error }}
    </p>
  </div>
</template>
