<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const authUserId = useAuthUserId()

const communities = ref<any[]>([])
const profile = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const success = ref(false)
const error = ref('')

const form = reactive({
  donation_project: '',
  community_id: '',
  quantity: 1,
  notes: '',
  planted_at: new Date().toISOString().split('T')[0],
})

onMounted(async () => {
  if (!authUserId.value) { return }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId.value)
    .single()
  profile.value = profileData

  if (profileData) {
    const { data: commData } = await supabase
      .from('community_members')
      .select('communities(*)')
      .eq('profile_id', profileData.id)
    communities.value = commData?.map((cm: any) => cm.communities).filter(Boolean) || []
  }

  loading.value = false
})

function resetForm() {
  form.donation_project = ''
  form.community_id = ''
  form.quantity = 1
  form.notes = ''
  form.planted_at = new Date().toISOString().split('T')[0]
  success.value = false
}

async function handleSubmit() {
  error.value = ''
  submitting.value = true

  try {
    await $fetch('/api/dashboard/trees', {
      method: 'POST',
      body: {
        source: 'donated',
        donation_project: form.donation_project,
        community_id: form.community_id || null,
        quantity: form.quantity,
        notes: form.notes,
        planted_at: form.planted_at,
      },
    })
    success.value = true
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to save'
  }
  submitting.value = false
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Donate a Tree
      </h1>
      <p class="text-gray-600 mt-1">
        Log a tree planted on your behalf through a donation.
      </p>
    </div>

    <div v-if="success" class="max-w-lg bg-green-50 border border-green-200 rounded-xl p-8 text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        Donation Logged! 🌳
      </h3>
      <p class="text-gray-600 mb-4">
        Your donation has been recorded. Keep up the great work!
      </p>
      <div class="flex gap-3 justify-center">
        <button
          class="bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
          @click="resetForm"
        >
          Log Another
        </button>
        <NuxtLink to="/dashboard" class="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
          Back to Dashboard
        </NuxtLink>
      </div>
    </div>

    <form v-else class="max-w-lg space-y-6" @submit.prevent="handleSubmit">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {{ error }}
      </div>

      <!-- Donation project -->
      <div>
        <label for="donation_project" class="block text-sm font-medium text-gray-700 mb-1">Donation Project</label>
        <input
          id="donation_project"
          v-model="form.donation_project"
          type="text"
          required
          placeholder="e.g. Eden Reforestation Projects"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
        >
      </div>

      <!-- Quantity -->
      <div>
        <label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">Number of Trees Donated</label>
        <input
          id="quantity"
          v-model.number="form.quantity"
          type="number"
          min="1"
          step="1"
          required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
        >
      </div>

      <!-- Community -->
      <div>
        <label for="community" class="block text-sm font-medium text-gray-700 mb-1">Community</label>
        <select
          id="community"
          v-model="form.community_id"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
        >
          <option value="">
            Select a community (optional)
          </option>
          <option v-for="c in communities" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <!-- Date -->
      <div>
        <label for="planted_at" class="block text-sm font-medium text-gray-700 mb-1">Date Donated</label>
        <input
          id="planted_at"
          v-model="form.planted_at"
          type="date"
          required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
        >
      </div>

      <!-- Photo placeholder -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Donation Confirmation</label>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 hover:border-green-400 transition-colors cursor-pointer">
          <svg class="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          <p class="text-sm">
            Photo upload coming soon
          </p>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          id="notes"
          v-model="form.notes"
          rows="3"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
          placeholder="Any notes about this donation..."
        />
      </div>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {{ submitting ? 'Saving...' : 'Log This Donation' }}
      </button>
    </form>
  </div>
</template>
