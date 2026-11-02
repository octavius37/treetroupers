<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

const posts = ref<any[]>([])
const communities = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const error = ref('')
const published = ref(false)

function emptyForm() {
  return {
    community_id: '',
    category: 'latest_news',
    title: '',
    body: '',
    event_at: '',
    photo_url: '',
  }
}

const form = reactive(emptyForm())

async function load() {
  loading.value = true
  const [postData, communityData] = await Promise.all([
    $fetch<any[]>('/api/cms/feed-posts'),
    $fetch<any[]>('/api/cms/communities'),
  ])
  posts.value = postData
  communities.value = communityData
  loading.value = false
}

async function handlePhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) { return }
  uploading.value = true
  error.value = ''
  try {
    const body = new FormData()
    body.append('file', file)
    const { data } = await $fetch<{ data: string[] }>('/api/cms/upload', { method: 'POST', body })
    form.photo_url = data[0] ?? ''
  }
  catch (err: any) {
    error.value = err.data?.message || err.message || 'Upload failed'
  }
  uploading.value = false
}

async function publish() {
  saving.value = true
  error.value = ''
  published.value = false
  try {
    await $fetch('/api/cms/feed-posts', {
      method: 'POST',
      body: {
        ...form,
        // datetime-local has no timezone; read it as the admin's local time.
        event_at: form.category === 'upcoming_events' && form.event_at ? new Date(form.event_at).toISOString() : null,
      },
    })
    Object.assign(form, emptyForm())
    published.value = true
    await load()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to publish'
  }
  saving.value = false
}

async function handleDelete(id: string) {
  // eslint-disable-next-line no-alert -- admin action requires user confirmation
  if (!confirm('Delete this post? Its likes go with it.')) { return }
  try {
    await $fetch(`/api/cms/feed-posts/${id}`, { method: 'DELETE' })
    await load()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to delete'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Community Posts
      </h1>
      <p class="text-gray-600 mt-1">
        Post events and news to a community's feed. A post to a community also shows in the communities inside it.
        "Just planted" posts appear on their own when you approve a tree log.
      </p>
    </div>

    <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>
    <div v-if="published" class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
      Published! It's now on the community feed.
    </div>

    <form class="bg-white rounded-xl border border-gray-200 p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="publish">
      <div>
        <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Heading</label>
        <select id="category" v-model="form.category" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white">
          <option v-for="(label, value) in FEED_CATEGORY_LABELS" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
      </div>
      <div>
        <label for="community" class="block text-sm font-medium text-gray-700 mb-1">Community</label>
        <select id="community" v-model="form.community_id" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white">
          <option value="">
            All communities
          </option>
          <option v-for="c in communities" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>
      <div class="md:col-span-2">
        <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input id="title" v-model="form.title" type="text" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
      </div>
      <div v-if="form.category === 'upcoming_events'">
        <label for="event_at" class="block text-sm font-medium text-gray-700 mb-1">Event date and time</label>
        <input id="event_at" v-model="form.event_at" type="datetime-local" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
      </div>
      <div class="md:col-span-2">
        <label for="body" class="block text-sm font-medium text-gray-700 mb-1">Details</label>
        <textarea id="body" v-model="form.body" rows="4" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-y" />
      </div>
      <div class="md:col-span-2">
        <span class="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</span>
        <div v-if="form.photo_url" class="flex items-center gap-3">
          <img :src="form.photo_url" alt="" class="w-24 h-24 object-cover rounded-lg border border-gray-200">
          <button type="button" class="text-sm text-red-500 hover:text-red-600" @click="form.photo_url = ''">
            Remove
          </button>
        </div>
        <input v-else type="file" accept="image/*" :disabled="uploading" class="text-sm" aria-label="Photo" @change="handlePhoto">
      </div>
      <div class="md:col-span-2">
        <button
          type="submit"
          :disabled="saving || uploading"
          class="bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {{ saving ? 'Publishing...' : 'Publish' }}
        </button>
      </div>
    </form>

    <div class="bg-white rounded-xl border border-gray-200">
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading posts...
      </div>
      <div v-else-if="posts.length === 0" class="p-6 text-center text-gray-500">
        No posts yet.
      </div>
      <ul v-else class="divide-y divide-gray-100">
        <li v-for="post in posts" :key="post.id" class="px-6 py-4 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span class="font-semibold uppercase tracking-wide">{{ FEED_CATEGORY_LABELS[post.category] ?? post.category }}</span>
              <span>· {{ post.communities?.name || 'All communities' }}</span>
              <span>· {{ new Date(post.created_at).toLocaleDateString() }}</span>
            </div>
            <div class="font-medium text-gray-900">
              {{ post.title }}
            </div>
            <div v-if="post.event_at" class="text-sm text-sky-700">
              📅 {{ new Date(post.event_at).toLocaleString() }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ post.post_likes?.[0]?.count ?? 0 }} {{ post.post_likes?.[0]?.count === 1 ? 'like' : 'likes' }}
            </div>
          </div>
          <button class="text-sm text-red-500 hover:text-red-600 font-medium flex-shrink-0" @click="handleDelete(post.id)">
            Delete
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
