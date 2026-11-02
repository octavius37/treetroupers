<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

interface Member {
  id: string
  name: string
  avatarUrl: string | null
  bio: string | null
  points: number
  rank: number
  memberSince: string
  isMe: boolean
  stats: { trees: number, co2KgPerYear: number }
  badges: { id: string, title: string, description: string | null }[]
  communities: { id: string, name: string, role: string }[]
  trees: { id: string, source: string, quantity: number, status: string, plantedAt: string, species: string | null }[]
}

const route = useRoute()
const member = ref<Member | null>(null)
const error = ref('')
const loading = ref(true)

useHead({ title: computed(() => member.value?.name ?? 'Member') })

async function load() {
  loading.value = true
  error.value = ''
  try {
    member.value = await $fetch<Member>(`/api/dashboard/members/${route.params.id}`)
  }
  catch (e: any) {
    error.value = e.statusCode === 404 ? 'This member doesn\'t exist.' : (e.data?.message || 'Could not load this profile')
  }
  loading.value = false
}

watch(() => route.params.id, load)
onMounted(load)
</script>

<template>
  <div class="max-w-3xl">
    <div v-if="loading" class="text-center py-12 text-gray-500">
      Loading profile...
    </div>

    <div v-else-if="error" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
      {{ error }}
    </div>

    <template v-else-if="member">
      <section class="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row gap-6 items-start">
        <UserAvatar :name="member.name" :url="member.avatarUrl" size="lg" />
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ member.name }}
          </h1>
          <p class="text-sm text-gray-500">
            Member since {{ new Date(member.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }}
          </p>
          <p v-if="member.bio" class="text-gray-700 mt-3 whitespace-pre-line">
            {{ member.bio }}
          </p>
          <NuxtLink v-if="member.isMe" to="/dashboard/profile" class="inline-block text-sm text-green-700 hover:text-green-800 mt-3">
            Edit my profile →
          </NuxtLink>
        </div>
      </section>

      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <dt class="text-sm text-gray-500">
            Trees
          </dt>
          <dd class="text-2xl font-bold text-green-600">
            {{ member.stats.trees }}
          </dd>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <dt class="text-sm text-gray-500">
            Points
          </dt>
          <dd class="text-2xl font-bold text-green-600">
            {{ member.points }}
          </dd>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <dt class="text-sm text-gray-500">
            Rank
          </dt>
          <dd class="text-2xl font-bold text-green-600">
            #{{ member.rank }}
          </dd>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <dt class="text-sm text-gray-500">
            CO₂ / year
          </dt>
          <dd class="text-2xl font-bold text-green-600">
            {{ formatCo2(member.stats.co2KgPerYear) }}
          </dd>
        </div>
      </dl>

      <section v-if="member.badges.length" class="mt-6">
        <h2 class="font-semibold text-gray-900 mb-2">
          Badges
        </h2>
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="badge in member.badges"
            :key="badge.id"
            :title="badge.description ?? undefined"
            class="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm text-amber-900"
          >
            🏅 {{ badge.title }}
          </li>
        </ul>
      </section>

      <section v-if="member.communities.length" class="mt-6">
        <h2 class="font-semibold text-gray-900 mb-2">
          Communities
        </h2>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="c in member.communities"
            :key="c.id"
            :to="`/dashboard/feed?community=${c.id}`"
            class="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-green-300"
          >
            {{ c.name }}<span v-if="c.role !== 'member'" class="text-green-700 capitalize"> · {{ c.role }}</span>
          </NuxtLink>
        </div>
      </section>

      <section class="mt-6">
        <h2 class="font-semibold text-gray-900 mb-2">
          Trees
        </h2>
        <p v-if="member.trees.length === 0" class="text-sm text-gray-500">
          No approved trees yet.
        </p>
        <ul v-else class="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <li v-for="t in member.trees" :key="t.id">
            <NuxtLink :to="`/dashboard/trees/${t.id}`" class="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
              <span class="font-medium text-gray-900">{{ treeLogLabel({ source: t.source, quantity: t.quantity, tree_species: t.species ? { common_name: t.species } : null }) }}</span>
              <span class="text-sm text-gray-500">{{ new Date(t.plantedAt).toLocaleDateString() }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
