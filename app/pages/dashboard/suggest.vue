<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

interface Point { lat: number, lng: number }

const supabase = useSupabaseClient()
const authUserId = useAuthUserId()

const rows = ref<any[]>([])
const trees = ref<Point[]>([])
const profileId = ref<string | null>(null)
const loading = ref(true)

const pending = ref<Point | null>(null)
const focus = ref<Point | null>(null)
const notes = ref('')
const submitting = ref(false)
const error = ref('')

const suggestions = computed(() => rows.value
  .filter(r => r.lat != null && r.lng != null)
  .map(r => ({
    id: r.id as string,
    lat: Number(r.lat),
    lng: Number(r.lng),
    notes: r.notes as string | null,
    author: r.profiles?.display_name || 'a member',
    mine: r.suggested_by === profileId.value,
    created_at: r.created_at as string,
  })))

onMounted(async () => {
  const [suggestionRes, treeRes, profileRes] = await Promise.all([
    supabase
      .from('planting_suggestions')
      .select('*, profiles!suggested_by(display_name)')
      .order('created_at', { ascending: false }),
    supabase.from('trees').select('lat, lng').not('lat', 'is', null),
    authUserId.value
      ? supabase.from('profiles').select('id').eq('auth_user_id', authUserId.value).single()
      : Promise.resolve({ data: null }),
  ])

  rows.value = suggestionRes.data || []
  trees.value = (treeRes.data || []).map((t: any) => ({ lat: Number(t.lat), lng: Number(t.lng) }))
  profileId.value = (profileRes.data as { id: string } | null)?.id ?? null
  loading.value = false
})

function pick(point: Point) {
  pending.value = point
  error.value = ''
}

function useMyLocation() {
  if (!navigator.geolocation) { return }
  navigator.geolocation.getCurrentPosition((pos) => {
    const point = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    pending.value = point
    focus.value = point
  })
}

function cancel() {
  pending.value = null
  notes.value = ''
  error.value = ''
}

async function submit() {
  if (!pending.value) { return }
  error.value = ''
  submitting.value = true
  try {
    const row = await $fetch('/api/dashboard/planting-suggestions', {
      method: 'POST',
      body: { ...pending.value, notes: notes.value },
    })
    rows.value = [row, ...rows.value]
    cancel()
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to save'
  }
  submitting.value = false
}

async function remove(id: string) {
  try {
    await $fetch(`/api/dashboard/planting-suggestions/${id}`, { method: 'DELETE' })
    rows.value = rows.value.filter(r => r.id !== id)
  }
  catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to remove'
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Suggest a Planting Spot
      </h1>
      <p class="text-gray-600 mt-1">
        Know somewhere that could use a tree? Click the map to mark it for the community.
      </p>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="h-[500px] relative z-0">
        <ClientOnly>
          <SuggestionMap
            :suggestions="suggestions"
            :trees="trees"
            :pending="pending"
            :focus="focus"
            @pick="pick"
          />
          <template #fallback>
            <div class="h-full flex items-center justify-center bg-green-50 text-gray-500">
              Loading map...
            </div>
          </template>
        </ClientOnly>
      </div>

      <div class="px-6 py-3 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-300 border-2 border-amber-700" /> Suggested spot</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500 border-2 border-amber-700" /> Your suggestion</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-600" /> Planted tree</span>
        <button type="button" class="ml-auto text-green-600 hover:text-green-700 font-medium" @click="useMyLocation">
          📍 Use my location
        </button>
      </div>
    </div>

    <!-- New suggestion form -->
    <div v-if="pending" class="mt-6 bg-white rounded-xl border border-green-200 p-6">
      <h2 class="font-semibold text-gray-900">
        New suggested spot
      </h2>
      <p class="text-xs text-gray-400 mt-1">
        📍 {{ pending.lat.toFixed(5) }}, {{ pending.lng.toFixed(5) }} · click the map again to move it
      </p>
      <form class="mt-4 space-y-4" @submit.prevent="submit">
        <div>
          <label for="suggestion-notes" class="block text-sm font-medium text-gray-700 mb-1">Why here? (optional)</label>
          <textarea
            id="suggestion-notes"
            v-model="notes"
            rows="3"
            maxlength="500"
            placeholder="e.g. Bare verge with space for a street tree, lots of sun"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
        <div v-if="error" class="text-sm text-red-600">
          {{ error }}
        </div>
        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="submitting"
            class="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {{ submitting ? 'Saving...' : 'Save spot' }}
          </button>
          <button type="button" class="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50" @click="cancel">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Suggestion list -->
    <div class="mt-6 bg-white rounded-xl border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="font-semibold text-gray-900">
          Suggested Spots ({{ suggestions.length }})
        </h2>
      </div>
      <div v-if="loading" class="p-6 text-center text-gray-500">
        Loading...
      </div>
      <div v-else-if="suggestions.length === 0" class="p-6 text-center text-gray-500">
        No spots suggested yet. Be the first!
      </div>
      <div v-else class="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        <div v-for="s in suggestions" :key="s.id" class="px-6 py-4 flex items-start justify-between gap-4">
          <button type="button" class="text-left min-w-0" @click="focus = { lat: s.lat, lng: s.lng }">
            <div class="font-medium text-gray-900">
              {{ s.mine ? 'Your suggestion' : `Suggested by ${s.author}` }}
            </div>
            <div v-if="s.notes" class="text-sm text-gray-600 mt-0.5 break-words">
              {{ s.notes }}
            </div>
            <div class="text-xs text-gray-400 mt-1">
              📍 {{ s.lat.toFixed(4) }}, {{ s.lng.toFixed(4) }} · {{ new Date(s.created_at).toLocaleDateString() }}
            </div>
          </button>
          <button
            v-if="s.mine"
            type="button"
            class="text-xs text-red-500 hover:text-red-600 flex-shrink-0"
            @click="remove(s.id)"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
