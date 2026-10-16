<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Rewards' })

interface Reward {
  id: string
  title: string
  description: string | null
  pointsRequired: number
  type: string
  unlocked: boolean
  claimable: boolean
  claim: 'pending' | 'fulfilled' | null
}

// Mirrors the database triggers that award points; see AGENTS.md "Points".
const EARNING = [
  { action: 'Plant a tree', points: '20', note: '+50 for your first' },
  { action: 'Donate trees', points: '5 per tree', note: '' },
  { action: 'Earn trees', points: '2 per tree', note: 'through apps and services' },
  { action: 'Log a tree 4 weeks in a row', points: '25', note: 'streak bonus' },
  { action: 'Join a community', points: '10', note: 'per community' },
  { action: 'Suggest a planting spot', points: '1', note: '' },
]

const data = ref<{ points: number, rewards: Reward[] } | null>(null)
const loading = ref(true)
const error = ref('')
const claiming = ref<string | null>(null)

async function load() {
  try {
    data.value = await $fetch('/api/dashboard/rewards')
  }
  catch (e: any) {
    error.value = e.data?.message || 'Could not load rewards'
  }
  loading.value = false
}

async function claim(reward: Reward) {
  claiming.value = reward.id
  error.value = ''
  try {
    await $fetch(`/api/dashboard/rewards/${reward.id}/claim`, { method: 'POST' })
    reward.claim = 'pending'
  }
  catch (e: any) {
    error.value = e.data?.message || 'Could not claim this reward'
  }
  claiming.value = null
}

function progress(reward: Reward) {
  if (!data.value) { return 0 }
  return Math.min(100, Math.round((data.value.points / reward.pointsRequired) * 100))
}

onMounted(load)
</script>

<template>
  <div class="max-w-4xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Rewards
      </h1>
      <p class="text-gray-600 mt-1">
        Rewards unlock as your points grow. Your points are never spent, so claiming a reward doesn't change your place on the leaderboard.
      </p>
    </div>

    <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      Loading rewards...
    </div>

    <template v-else-if="data">
      <div class="bg-gradient-to-br from-green-700 to-emerald-500 text-white rounded-2xl p-6 mb-8">
        <p class="text-green-100 text-sm">
          Your points
        </p>
        <p class="text-4xl font-bold">
          {{ data.points }}
        </p>
      </div>

      <div v-if="data.rewards.length === 0" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        No rewards yet. Check back soon!
      </div>
      <ul v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <li
          v-for="reward in data.rewards"
          :key="reward.id"
          class="bg-white rounded-2xl border p-5 flex flex-col"
          :class="reward.unlocked ? 'border-green-300' : 'border-gray-200'"
        >
          <div class="flex items-start gap-3">
            <span class="text-3xl" :class="reward.unlocked ? '' : 'grayscale opacity-50'" aria-hidden="true">
              {{ reward.type === 'badge' ? '🏅' : '🎁' }}
            </span>
            <div class="flex-1">
              <h2 class="font-semibold text-gray-900">
                {{ reward.title }}
              </h2>
              <p v-if="reward.description" class="text-sm text-gray-600 mt-0.5">
                {{ reward.description }}
              </p>
            </div>
          </div>

          <div class="mt-4">
            <template v-if="!reward.unlocked">
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" :aria-valuenow="progress(reward)" aria-valuemin="0" aria-valuemax="100">
                <div class="h-full bg-green-500" :style="{ width: `${progress(reward)}%` }" />
              </div>
              <p class="text-xs text-gray-500 mt-1">
                {{ data.points }} / {{ reward.pointsRequired }} points
              </p>
            </template>
            <p v-else-if="!reward.claimable" class="text-sm font-medium text-green-700">
              ✓ Unlocked
            </p>
            <p v-else-if="reward.claim === 'fulfilled'" class="text-sm font-medium text-green-700">
              ✓ Sent to you
            </p>
            <p v-else-if="reward.claim === 'pending'" class="text-sm text-amber-700">
              Claimed: we'll be in touch by email
            </p>
            <button
              v-else
              type="button"
              :disabled="claiming === reward.id"
              class="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              @click="claim(reward)"
            >
              {{ claiming === reward.id ? 'Claiming...' : 'Claim reward' }}
            </button>
          </div>
        </li>
      </ul>

      <section class="mt-10">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">
          How to earn points
        </h2>
        <p class="text-sm text-gray-600 mb-3">
          Tree logs earn their points once an admin has checked the photo.
        </p>
        <table class="w-full bg-white rounded-xl border border-gray-200 text-sm overflow-hidden">
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in EARNING" :key="row.action">
              <td class="px-4 py-3 text-gray-900">
                {{ row.action }}
                <span v-if="row.note" class="text-gray-500"> · {{ row.note }}</span>
              </td>
              <td class="px-4 py-3 text-right font-semibold text-green-700 whitespace-nowrap">
                {{ row.points }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
