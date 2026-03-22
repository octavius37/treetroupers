<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'cms-auth' })

const { data: stats, status } = useFetch<{
  counts: { profiles: number, communities: number, trees: number, species: number, rewards: number }
  recentTrees: any[]
  recentUsers: any[]
}>('/api/cms/stats')
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        CMS Overview
      </h1>
      <p class="text-gray-600 mt-1">
        Manage your Tree Troupe content and data.
      </p>
    </div>

    <div v-if="status === 'pending'" class="text-center py-12 text-gray-500">
      Loading...
    </div>

    <template v-else-if="stats">
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <NuxtLink to="/cms/users" class="bg-white rounded-xl p-5 border border-gray-200 hover:border-green-300 transition-colors">
          <div class="text-sm text-gray-500 mb-1">
            Users
          </div>
          <div class="text-2xl font-bold text-green-600">
            {{ stats.counts.profiles }}
          </div>
        </NuxtLink>
        <NuxtLink to="/cms/communities" class="bg-white rounded-xl p-5 border border-gray-200 hover:border-green-300 transition-colors">
          <div class="text-sm text-gray-500 mb-1">
            Communities
          </div>
          <div class="text-2xl font-bold text-green-600">
            {{ stats.counts.communities }}
          </div>
        </NuxtLink>
        <NuxtLink to="/cms/trees" class="bg-white rounded-xl p-5 border border-gray-200 hover:border-green-300 transition-colors">
          <div class="text-sm text-gray-500 mb-1">
            Trees
          </div>
          <div class="text-2xl font-bold text-green-600">
            {{ stats.counts.trees }}
          </div>
        </NuxtLink>
        <NuxtLink to="/cms/tree-species" class="bg-white rounded-xl p-5 border border-gray-200 hover:border-green-300 transition-colors">
          <div class="text-sm text-gray-500 mb-1">
            Species
          </div>
          <div class="text-2xl font-bold text-green-600">
            {{ stats.counts.species }}
          </div>
        </NuxtLink>
        <NuxtLink to="/cms/rewards" class="bg-white rounded-xl p-5 border border-gray-200 hover:border-green-300 transition-colors">
          <div class="text-sm text-gray-500 mb-1">
            Rewards
          </div>
          <div class="text-2xl font-bold text-green-600">
            {{ stats.counts.rewards }}
          </div>
        </NuxtLink>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <NuxtLink to="/cms/pages" class="bg-green-600 text-white rounded-xl p-5 hover:bg-green-700 transition-colors">
          <div class="font-semibold mb-1">
            Manage Pages
          </div>
          <div class="text-sm text-green-100">
            Create and edit CMS content
          </div>
        </NuxtLink>
        <NuxtLink to="/cms/communities" class="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
          <div class="font-semibold text-gray-900 mb-1">
            Manage Communities
          </div>
          <div class="text-sm text-gray-500">
            Add, edit or remove troupes
          </div>
        </NuxtLink>
        <NuxtLink to="/cms/tree-species" class="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
          <div class="font-semibold text-gray-900 mb-1">
            Tree Species
          </div>
          <div class="text-sm text-gray-500">
            Manage the species database
          </div>
        </NuxtLink>
        <NuxtLink to="/cms/trees" class="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
          <div class="font-semibold text-gray-900 mb-1">
            Verify Trees
          </div>
          <div class="text-sm text-gray-500">
            Review and verify tree plantings
          </div>
        </NuxtLink>
      </div>

      <!-- Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Users -->
        <div class="bg-white rounded-xl border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">
              Recent Users
            </h2>
            <NuxtLink to="/cms/users" class="text-sm text-green-600 hover:text-green-700 font-medium">
              View all →
            </NuxtLink>
          </div>
          <div v-if="stats.recentUsers.length === 0" class="p-6 text-center text-gray-500">
            No users yet.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div v-for="user in stats.recentUsers" :key="user.id" class="px-6 py-3 flex items-center gap-3">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-xs flex-shrink-0">
                {{ (user.display_name || 'U')[0].toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-gray-900 truncate">
                  {{ user.display_name || 'Anonymous' }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ user.total_points || 0 }} pts
                </div>
              </div>
              <div class="text-xs text-gray-400">
                {{ new Date(user.created_at).toLocaleDateString() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Trees -->
        <div class="bg-white rounded-xl border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">
              Recent Trees
            </h2>
            <NuxtLink to="/cms/trees" class="text-sm text-green-600 hover:text-green-700 font-medium">
              View all →
            </NuxtLink>
          </div>
          <div v-if="stats.recentTrees.length === 0" class="p-6 text-center text-gray-500">
            No trees yet.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div v-for="tree in stats.recentTrees" :key="tree.id" class="px-6 py-3 flex items-center justify-between">
              <div class="min-w-0">
                <div class="text-sm font-medium text-gray-900">
                  {{ tree.tree_species?.common_name || 'Unknown species' }}
                </div>
                <div class="text-xs text-gray-500">
                  by {{ tree.profiles?.display_name || 'Unknown' }}
                </div>
              </div>
              <div v-if="tree.verified" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                Verified
              </div>
              <div v-else class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">
                Pending
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
