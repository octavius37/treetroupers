<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

interface TreeUpdate {
  id: string
  content: string | null
  photoUrl: string | null
  createdAt: string
  author: { id: string, name: string, avatarUrl: string | null } | null
}

interface Tree {
  id: string
  source: string
  quantity: number
  status: string
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewNote: string | null
  notes: string | null
  plantedAt: string
  lat: number | null
  lng: number | null
  donationProject: string | null
  earnedActivity: string | null
  photoUrl: string | null
  speciesId: string | null
  species: { name: string, scientificName: string, co2KgPerYear: number | null } | null
  community: { id: string, name: string } | null
  planter: { id: string, name: string, avatarUrl: string | null } | null
  isMine: boolean
  updates: TreeUpdate[]
}

const STATUSES = ['planted', 'growing', 'mature', 'removed']
const STATUS_STYLES: Record<string, string> = {
  planted: 'bg-amber-100 text-amber-700',
  growing: 'bg-blue-100 text-blue-700',
  mature: 'bg-green-100 text-green-700',
  removed: 'bg-red-100 text-red-500',
}

const route = useRoute()
const id = computed(() => route.params.id as string)

const tree = ref<Tree | null>(null)
const loading = ref(true)
const error = ref('')

const editing = ref(false)
const form = reactive({ notes: '', status: 'planted' })
const saving = ref(false)

const update = reactive({ content: '', photo_url: null as string | null })
const updateUploading = ref(false)
const posting = ref(false)
const updateError = ref('')

const title = computed(() => tree.value ? treeLogLabel({ ...tree.value, tree_species: tree.value.species ? { common_name: tree.value.species.name } : null }) : 'Tree')
useHead({ title })

async function load() {
  loading.value = true
  error.value = ''
  try {
    tree.value = await $fetch<Tree>(`/api/dashboard/trees/${id.value}`)
  }
  catch (e: any) {
    error.value = e.statusCode === 404 ? 'This tree doesn\'t exist, or isn\'t visible to you.' : (e.data?.message || 'Could not load this tree')
  }
  loading.value = false
}

function startEditing() {
  form.notes = tree.value?.notes ?? ''
  form.status = tree.value?.status ?? 'planted'
  editing.value = true
}

async function save() {
  saving.value = true
  try {
    const body = tree.value?.source === 'planted' ? { notes: form.notes, status: form.status } : { notes: form.notes }
    await $fetch(`/api/dashboard/trees/${id.value}`, { method: 'PATCH', body })
    editing.value = false
    await load()
  }
  catch (e: any) {
    error.value = e.data?.message || 'Could not save'
  }
  saving.value = false
}

async function remove() {
  // eslint-disable-next-line no-alert -- deleting a log needs confirmation
  if (!confirm('Delete this log? This can\'t be undone.')) { return }
  try {
    await $fetch(`/api/dashboard/trees/${id.value}`, { method: 'DELETE' })
    navigateTo('/dashboard')
  }
  catch (e: any) {
    error.value = e.data?.message || 'Could not delete'
  }
}

async function postUpdate() {
  posting.value = true
  updateError.value = ''
  try {
    await $fetch(`/api/dashboard/trees/${id.value}/updates`, { method: 'POST', body: update })
    update.content = ''
    update.photo_url = null
    await load()
  }
  catch (e: any) {
    updateError.value = e.data?.message || 'Could not post your update'
  }
  posting.value = false
}

const sourceLine = computed(() => {
  const t = tree.value
  if (!t) { return '' }
  if (t.source === 'donated') { return t.donationProject ? `Donated via ${t.donationProject}` : 'Donated' }
  if (t.source === 'earned') { return t.earnedActivity ? `Earned through ${t.earnedActivity}` : 'Earned' }
  return t.species?.scientificName ?? ''
})

watch(id, load)
onMounted(load)
</script>

<template>
  <div class="max-w-3xl">
    <NuxtLink to="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">
      ← Back to dashboard
    </NuxtLink>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      Loading tree...
    </div>

    <div v-else-if="error && !tree" class="mt-6 bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
      {{ error }}
    </div>

    <template v-else-if="tree">
      <div v-if="error" class="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {{ error }}
      </div>

      <!-- Review state, for the planter -->
      <div v-if="tree.isMine && tree.reviewStatus === 'pending'" class="mt-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
        ⏳ Waiting for an admin to check your photo. Your points are added once it's approved.
      </div>
      <div v-if="tree.isMine && tree.reviewStatus === 'rejected'" class="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
        <p class="font-medium">
          This log wasn't approved.
        </p>
        <p v-if="tree.reviewNote" class="mt-1">
          Reviewer's note: {{ tree.reviewNote }}
        </p>
        <p class="mt-1">
          You can delete it and log the tree again with a clearer photo.
        </p>
      </div>

      <article class="mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <img v-if="tree.photoUrl" :src="tree.photoUrl" :alt="title" class="w-full max-h-[28rem] object-cover">

        <div class="p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                {{ title }}
              </h1>
              <p v-if="sourceLine" class="text-gray-500 italic">
                {{ sourceLine }}
              </p>
            </div>
            <span v-if="tree.source === 'planted'" class="text-xs px-2.5 py-1 rounded-full font-medium capitalize" :class="STATUS_STYLES[tree.status]">
              {{ tree.status }}
            </span>
          </div>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
            <div v-if="tree.planter">
              <dt class="text-gray-500">
                {{ tree.source === 'planted' ? 'Planted by' : 'Logged by' }}
              </dt>
              <dd class="flex items-center gap-2 mt-1">
                <UserAvatar :name="tree.planter.name" :url="tree.planter.avatarUrl" size="sm" />
                <NuxtLink :to="`/dashboard/members/${tree.planter.id}`" class="text-gray-900 font-medium hover:text-green-700">
                  {{ tree.isMine ? 'You' : tree.planter.name }}
                </NuxtLink>
              </dd>
            </div>
            <div>
              <dt class="text-gray-500">
                Date
              </dt>
              <dd class="text-gray-900 mt-1">
                {{ new Date(tree.plantedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) }}
              </dd>
            </div>
            <div v-if="tree.community">
              <dt class="text-gray-500">
                Community
              </dt>
              <dd class="text-gray-900 mt-1">
                <NuxtLink :to="`/dashboard/feed?community=${tree.community.id}`" class="hover:text-green-700">
                  {{ tree.community.name }}
                </NuxtLink>
              </dd>
            </div>
            <div v-if="tree.lat != null && tree.lng != null">
              <dt class="text-gray-500">
                Location
              </dt>
              <dd class="mt-1">
                <a
                  :href="`https://www.openstreetmap.org/?mlat=${tree.lat}&mlon=${tree.lng}#map=18/${tree.lat}/${tree.lng}`"
                  target="_blank"
                  rel="noopener"
                  class="text-green-700 hover:text-green-800"
                >
                  {{ Number(tree.lat).toFixed(4) }}, {{ Number(tree.lng).toFixed(4) }} ↗
                </a>
              </dd>
            </div>
            <div v-if="tree.species?.co2KgPerYear">
              <dt class="text-gray-500">
                CO₂ absorbed
              </dt>
              <dd class="text-gray-900 mt-1">
                About {{ formatCo2(tree.species.co2KgPerYear) }} a year once grown
              </dd>
            </div>
          </dl>

          <div v-if="!editing && tree.notes" class="mt-6">
            <h2 class="text-sm text-gray-500">
              Notes
            </h2>
            <p class="text-gray-800 mt-1 whitespace-pre-line">
              {{ tree.notes }}
            </p>
          </div>

          <!-- Planter's actions -->
          <form v-if="editing" class="mt-6 space-y-4" @submit.prevent="save">
            <div v-if="tree.source === 'planted'">
              <label for="tree-status" class="block text-sm font-medium text-gray-700 mb-1">How is it doing?</label>
              <select id="tree-status" v-model="form.status" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white capitalize">
                <option v-for="s in STATUSES" :key="s" :value="s">
                  {{ s }}
                </option>
              </select>
            </div>
            <div>
              <label for="tree-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea id="tree-notes" v-model="form.notes" rows="3" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-y" />
            </div>
            <div class="flex gap-3">
              <button type="submit" :disabled="saving" class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button type="button" class="text-sm text-gray-600" @click="editing = false">
                Cancel
              </button>
            </div>
          </form>
          <div v-else-if="tree.isMine" class="mt-6 flex flex-wrap gap-3">
            <button type="button" class="border border-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50" @click="startEditing">
              Edit
            </button>
            <button
              v-if="tree.reviewStatus !== 'approved'"
              type="button"
              class="border border-red-300 text-red-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-red-50"
              @click="remove"
            >
              Delete log
            </button>
          </div>
        </div>
      </article>

      <!-- Updates -->
      <section class="mt-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Updates
        </h2>

        <form v-if="tree.isMine && tree.reviewStatus !== 'rejected'" class="bg-white rounded-2xl border border-gray-200 p-5 mb-4 space-y-4" @submit.prevent="postUpdate">
          <div>
            <label for="update-content" class="block text-sm font-medium text-gray-700 mb-1">How's your tree doing?</label>
            <textarea
              id="update-content"
              v-model="update.content"
              rows="3"
              required
              maxlength="2000"
              placeholder="First leaves of spring, a new stake after the storm…"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-y"
            />
          </div>
          <PhotoUpload v-model="update.photo_url" v-model:uploading="updateUploading" label="Photo (optional)" />
          <p v-if="updateError" class="text-sm text-red-600">
            {{ updateError }}
          </p>
          <button
            type="submit"
            :disabled="posting || updateUploading || !update.content.trim()"
            class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {{ posting ? 'Posting...' : 'Post update' }}
          </button>
        </form>

        <p v-if="tree.updates.length === 0" class="text-sm text-gray-500">
          No updates yet.
        </p>
        <ol v-else class="space-y-4">
          <li v-for="u in tree.updates" :key="u.id" class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <img v-if="u.photoUrl" :src="u.photoUrl" alt="" class="w-full max-h-80 object-cover">
            <div class="p-5">
              <p class="text-xs text-gray-500 mb-1">
                {{ timeAgo(u.createdAt) }}<template v-if="u.author">
                  · {{ u.author.name }}
                </template>
              </p>
              <p class="text-gray-800 whitespace-pre-line">
                {{ u.content }}
              </p>
            </div>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
