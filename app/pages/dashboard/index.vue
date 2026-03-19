<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const profile = ref<any>(null)
const stats = ref({ trees: 0, points: 0, communities: 0 })
const recentTrees = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  if (!user.value?.id) { return }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.value.id)
    .single()
  profile.value = profileData

  if (profileData) {
    const [treesRes, communitiesRes] = await Promise.all([
      supabase.from('trees').select('id', { count: 'exact', head: true }).eq('planted_by', profileData.id),
      supabase.from('community_members').select('id', { count: 'exact', head: true }).eq('profile_id', profileData.id),
    ])
    stats.value = {
      trees: treesRes.count || 0,
      points: profileData.total_points || 0,
      communities: communitiesRes.count || 0,
    }

    const { data: treesData } = await supabase
      .from('trees')
      .select('*, tree_species(common_name)')
      .eq('planted_by', profileData.id)
      .order('planted_at', { ascending: false })
      .limit(5)
    recentTrees.value = treesData || []
  }

  loading.value = false
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Welcome back{{ profile?.display_name ? `, ${profile.display_name}` : '' }}
      </h1>
      <p class="text-gray-600 mt-1">
        Here's an overview of your Tree Troupe activity.
      </p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-xl p-6 border border-gray-200">
        <div class="text-sm text-gray-500 mb-1">
          Trees Planted
        </div>
        <div class="text-3xl font-bold text-green-600">
          {{ stats.trees }}
        </div>
      </div>
      <div class="bg-white rounded-xl p-6 border border-gray-200">
        <div class="text-sm text-gray-500 mb-1">
          Total Points
        </div>
        <div class="text-3xl font-bold text-green-600">
          {{ stats.points }}
        </div>
      </div>
      <div class="bg-white rounded-xl p-6 border border-gray-200">
        <div class="text-sm text-gray-500 mb-1">
          Communities
        </div>
        <div class="text-3xl font-bold text-green-600">
          {{ stats.communities }}
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <NuxtLink to="/dashboard/plant" class="bg-green-600 text-white rounded-xl p-5 hover:bg-green-700 transition-colors">
        <div class="font-semibold mb-1">
          Plant a Tree
        </div>
        <div class="text-sm text-green-100">
          Log a new tree planting
        </div>
      </NuxtLink>
      <NuxtLink to="/dashboard/feed" class="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
        <div class="font-semibold text-gray-900 mb-1">
          Community Feed
        </div>
        <div class="text-sm text-gray-500">
          See what your troupe is up to
        </div>
      </NuxtLink>
      <NuxtLink to="/dashboard/map" class="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
        <div class="font-semibold text-gray-900 mb-1">
          Tree Map
        </div>
        <div class="text-sm text-gray-500">
          Explore trees in your area
        </div>
      </NuxtLink>
      <NuxtLink to="/dashboard/leaderboard" class="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
        <div class="font-semibold text-gray-900 mb-1">
          Leaderboard
        </div>
        <div class="text-sm text-gray-500">
          See how you rank
        </div>
      </NuxtLink>
    </div>

    <!-- Recent Trees -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="font-semibold text-gray-900">
          Your Recent Trees
        </h2>
      </div>
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading...
      </div>
      <div v-else-if="recentTrees.length === 0" class="p-6 text-center text-gray-500">
        <p>You haven't planted any trees yet.</p>
        <NuxtLink to="/dashboard/plant" class="text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
          Plant your first tree →
        </NuxtLink>
      </div>
      <div v-else class="divide-y divide-gray-100">
        <div v-for="tree in recentTrees" :key="tree.id" class="px-6 py-4 flex items-center justify-between">
          <div>
            <div class="font-medium text-gray-900">
              {{ tree.tree_species?.common_name || 'Unknown species' }}
            </div>
            <div class="text-sm text-gray-500">
              {{ new Date(tree.planted_at).toLocaleDateString() }}
            </div>
          </div>
          <div v-if="tree.verified" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Verified
          </div>
          <div v-else class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
            Pending
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
