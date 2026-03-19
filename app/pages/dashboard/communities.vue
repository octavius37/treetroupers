<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const allCommunities = ref<any[]>([])
const myCommunityIds = ref<Set<string>>(new Set())
const profile = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  if (!user.value?.id) { return }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.value.id)
    .single()
  profile.value = profileData

  const [commRes, myCommRes] = await Promise.all([
    supabase.from('communities').select('*').order('name'),
    profileData
      ? supabase.from('community_members').select('community_id').eq('profile_id', profileData.id)
      : { data: [] },
  ])
  allCommunities.value = commRes.data || []
  myCommunityIds.value = new Set((myCommRes.data || []).map((m: any) => m.community_id))
  loading.value = false
})

async function joinCommunity(communityId: string) {
  if (!profile.value) { return }
  const { error } = await supabase
    .from('community_members')
    .insert({ community_id: communityId, profile_id: profile.value.id })
  if (!error) {
    myCommunityIds.value = new Set([...myCommunityIds.value, communityId])
  }
}

async function leaveCommunity(communityId: string) {
  if (!profile.value) { return }
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('profile_id', profile.value.id)
  if (!error) {
    const next = new Set(myCommunityIds.value)
    next.delete(communityId)
    myCommunityIds.value = next
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Communities
      </h1>
      <p class="text-gray-600 mt-1">
        Find and join tree troupes in your area.
      </p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      Loading communities...
    </div>

    <div v-else-if="allCommunities.length === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      </div>
      <p class="text-gray-500">
        No communities have been created yet.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="community in allCommunities" :key="community.id" class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="mb-3">
          <h3 class="font-semibold text-gray-900">
            {{ community.name }}
          </h3>
          <p v-if="community.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
            {{ community.description }}
          </p>
        </div>

        <div class="mt-4">
          <button
            v-if="myCommunityIds.has(community.id)"
            class="w-full border border-gray-300 text-gray-700 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            @click="leaveCommunity(community.id)"
          >
            Leave Community
          </button>
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
