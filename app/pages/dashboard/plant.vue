<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const supabase = useSupabaseClient()
const authUserId = useAuthUserId()

const species = ref<any[]>([])
const communities = ref<any[]>([])
const profile = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const photoUploading = ref(false)
const success = ref(false)
const error = ref('')

const form = reactive({
  species_id: '',
  community_id: '',
  lat: '',
  lng: '',
  notes: '',
  planted_at: new Date().toISOString().split('T')[0],
  photo_url: null as string | null,
})

onMounted(async () => {
  if (!authUserId.value) { return }

  const [speciesRes, profileRes] = await Promise.all([
    supabase.from('tree_species').select('*').order('common_name'),
    supabase.from('profiles').select('*').eq('auth_user_id', authUserId.value).single(),
  ])

  species.value = speciesRes.data || []
  profile.value = profileRes.data

  if (profileRes.data) {
    const { data: commData } = await supabase
      .from('community_members')
      .select('communities(*)')
      .eq('profile_id', profileRes.data.id)
    communities.value = commData?.map((cm: any) => cm.communities).filter(Boolean) || []
  }

  loading.value = false
})

function getLocation() {
  if (!navigator.geolocation) { return }
  navigator.geolocation.getCurrentPosition((pos) => {
    form.lat = pos.coords.latitude.toFixed(6)
    form.lng = pos.coords.longitude.toFixed(6)
  })
}

function resetForm() {
  form.species_id = ''
  form.community_id = ''
  form.lat = ''
  form.lng = ''
  form.notes = ''
  form.planted_at = new Date().toISOString().split('T')[0]
  form.photo_url = null
  success.value = false
}

async function handleSubmit() {
  error.value = ''
  submitting.value = true

  try {
    await $fetch('/api/dashboard/trees', {
      method: 'POST',
      body: {
        species_id: form.species_id || null,
        community_id: form.community_id || null,
        lat: Number.parseFloat(form.lat),
        lng: Number.parseFloat(form.lng),
        notes: form.notes,
        planted_at: form.planted_at,
        photo_url: form.photo_url,
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
        Plant a Tree
      </h1>
      <p class="text-gray-600 mt-1">
        Log a new tree planting and add it to the map.
      </p>
    </div>

    <div v-if="success" class="max-w-lg bg-green-50 border border-green-200 rounded-xl p-8 text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        Tree Logged! 🌳
      </h3>
      <p class="text-gray-600 mb-4">
        Your tree has been added to the map. Once an admin has checked your photo you'll get 20 points, plus 50 if it's your first tree.
      </p>
      <div class="flex gap-3 justify-center">
        <button
          class="bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
          @click="resetForm"
        >
          Plant Another
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

      <!-- Species -->
      <div>
        <label for="species" class="block text-sm font-medium text-gray-700 mb-1">Tree Species</label>
        <select
          id="species"
          v-model="form.species_id"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white"
        >
          <option value="">
            Select a species (optional)
          </option>
          <option v-for="sp in species" :key="sp.id" :value="sp.id">
            {{ sp.common_name }} ({{ sp.scientific_name }})
          </option>
        </select>
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

      <!-- Location -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <div class="grid grid-cols-2 gap-3">
          <input
            v-model="form.lat"
            type="number"
            step="any"
            required
            placeholder="Latitude"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          >
          <input
            v-model="form.lng"
            type="number"
            step="any"
            required
            placeholder="Longitude"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          >
        </div>
        <button
          type="button"
          class="text-sm text-green-600 hover:text-green-700 font-medium mt-2"
          @click="getLocation"
        >
          📍 Use my current location
        </button>
      </div>

      <!-- Date -->
      <div>
        <label for="planted_at" class="block text-sm font-medium text-gray-700 mb-1">Date Planted</label>
        <input
          id="planted_at"
          v-model="form.planted_at"
          type="date"
          required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
        >
      </div>

      <!-- Photo -->
      <PhotoUpload
        v-model="form.photo_url"
        v-model:uploading="photoUploading"
        label="Photo"
        hint="A photo of the tree you planted. An admin checks it before your points are added."
        required
      />

      <!-- Notes -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          id="notes"
          v-model="form.notes"
          rows="3"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
          placeholder="Any notes about this tree..."
        />
      </div>

      <button
        type="submit"
        :disabled="submitting || photoUploading || !form.photo_url"
        class="w-full bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {{ submitting ? 'Saving...' : 'Log This Tree' }}
      </button>
    </form>
  </div>
</template>
