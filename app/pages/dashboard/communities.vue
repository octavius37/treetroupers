<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Communities' })

interface Community {
  id: string
  name: string
  description: string | null
  parent_community_id: string | null
  community_members: { count: number }[]
}

const supabase = useSupabaseClient()
const authUserId = useAuthUserId()

const allCommunities = ref<Community[]>([])
// community id → the viewer's role in it
const myRoles = ref<Map<string, string>>(new Map())
const loading = ref(true)
const search = ref('')
const error = ref('')

const requesting = ref(false)
const requestSent = ref(false)
const request = reactive({ name: '', area: '', description: '', parent_community_id: '' })

const nameById = computed(() => new Map(allCommunities.value.map(c => [c.id, c.name])))

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = q
    ? allCommunities.value.filter(c => `${c.name} ${c.description ?? ''} ${nameById.value.get(c.parent_community_id ?? '') ?? ''}`.toLowerCase().includes(q))
    : allCommunities.value
  // Yours first, then by size.
  return list.toSorted((a, b) =>
    Number(myRoles.value.has(b.id)) - Number(myRoles.value.has(a.id))
    || memberCount(b) - memberCount(a)
    || a.name.localeCompare(b.name))
})

function memberCount(c: Community) {
  return c.community_members?.[0]?.count ?? 0
}

onMounted(async () => {
  if (!authUserId.value) { return }

  const { data: profileData } = await supabase.from('profiles').select('id').eq('auth_user_id', authUserId.value).single()

  const [commRes, myCommRes] = await Promise.all([
    supabase.from('communities').select('id, name, description, parent_community_id, community_members(count)').order('name'),
    profileData
      ? supabase.from('community_members').select('community_id, role').eq('profile_id', profileData.id)
      : { data: [] },
  ])
  allCommunities.value = (commRes.data ?? []) as unknown as Community[]
  myRoles.value = new Map((myCommRes.data || []).map((m: any) => [m.community_id, m.role]))
  loading.value = false
})

function adjustCount(communityId: string, by: number) {
  const community = allCommunities.value.find(c => c.id === communityId)
  if (community?.community_members?.[0]) { community.community_members[0].count += by }
}

async function joinCommunity(communityId: string) {
  error.value = ''
  try {
    await $fetch('/api/dashboard/community-members', { method: 'POST', body: { community_id: communityId } })
    myRoles.value = new Map(myRoles.value).set(communityId, 'member')
    adjustCount(communityId, 1)
  }
  catch (e: any) {
    error.value = e.data?.message || 'Could not join'
  }
}

async function leaveCommunity(communityId: string) {
  error.value = ''
  try {
    await $fetch(`/api/dashboard/community-members/${communityId}`, { method: 'DELETE' })
    const next = new Map(myRoles.value)
    next.delete(communityId)
    myRoles.value = next
    adjustCount(communityId, -1)
  }
  catch (e: any) {
    error.value = e.data?.message || 'Could not leave'
  }
}

async function sendRequest() {
  error.value = ''
  try {
    await $fetch('/api/dashboard/community-requests', { method: 'POST', body: request })
    Object.assign(request, { name: '', area: '', description: '', parent_community_id: '' })
    requestSent.value = true
    requesting.value = false
  }
  catch (e: any) {
    error.value = e.data?.message || 'Could not send your request'
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Communities
      </h1>
      <p class="text-gray-600 mt-1">
        Find and join tree troupes in your area.
      </p>
    </div>

    <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        v-model="search"
        type="search"
        aria-label="Search communities"
        placeholder="Search by name or place…"
        class="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
      >
      <button
        type="button"
        class="border border-green-600 text-green-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-50"
        @click="requesting = !requesting; requestSent = false"
      >
        Can't find yours? Request one
      </button>
    </div>

    <div v-if="requestSent" class="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
      Thanks! We'll review your request, and if it's approved you'll be the new community's admin.
    </div>

    <form v-if="requesting" class="mb-8 bg-white rounded-2xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="sendRequest">
      <div>
        <label for="req-name" class="block text-sm font-medium text-gray-700 mb-1">Community name</label>
        <input id="req-name" v-model="request.name" type="text" required minlength="2" maxlength="80" placeholder="e.g. Lombok West" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
      </div>
      <div>
        <label for="req-area" class="block text-sm font-medium text-gray-700 mb-1">Where?</label>
        <input id="req-area" v-model="request.area" type="text" maxlength="120" placeholder="Neighbourhood, town or region" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
      </div>
      <div>
        <label for="req-parent" class="block text-sm font-medium text-gray-700 mb-1">Part of</label>
        <select id="req-parent" v-model="request.parent_community_id" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white">
          <option value="">
            Nothing (a new area)
          </option>
          <option v-for="c in allCommunities" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>
      <div class="sm:col-span-2">
        <label for="req-description" class="block text-sm font-medium text-gray-700 mb-1">What's it about? (optional)</label>
        <textarea id="req-description" v-model="request.description" rows="2" maxlength="500" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-y" />
      </div>
      <div class="sm:col-span-2 flex gap-3">
        <button type="submit" class="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700">
          Send request
        </button>
        <button type="button" class="text-sm text-gray-600" @click="requesting = false">
          Cancel
        </button>
      </div>
    </form>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      Loading communities...
    </div>

    <div v-else-if="visible.length === 0" class="text-center py-12 text-gray-500">
      {{ search ? `No communities match "${search}".` : 'No communities have been created yet.' }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="community in visible" :key="community.id" class="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
        <div class="flex-1">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold text-gray-900">
              {{ community.name }}
            </h3>
            <span
              v-if="myRoles.get(community.id) === 'admin' || myRoles.get(community.id) === 'moderator'"
              class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize flex-shrink-0"
            >
              {{ myRoles.get(community.id) }}
            </span>
          </div>
          <p v-if="community.parent_community_id && nameById.get(community.parent_community_id)" class="text-xs text-gray-500 mt-0.5">
            Part of {{ nameById.get(community.parent_community_id) }}
          </p>
          <p v-if="community.description" class="text-sm text-gray-500 mt-2 line-clamp-2">
            {{ community.description }}
          </p>
          <p class="text-xs text-gray-500 mt-2">
            {{ memberCount(community) }} {{ memberCount(community) === 1 ? 'member' : 'members' }}
          </p>
        </div>

        <div class="mt-4 flex gap-2">
          <template v-if="myRoles.has(community.id)">
            <NuxtLink
              :to="`/dashboard/feed?community=${community.id}`"
              class="flex-1 text-center bg-green-600 text-white py-2 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Open
            </NuxtLink>
            <button
              class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
              @click="leaveCommunity(community.id)"
            >
              Leave
            </button>
          </template>
          <button
            v-else
            class="w-full bg-green-600 text-white py-2 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
            @click="joinCommunity(community.id)"
          >
            Join Community
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
