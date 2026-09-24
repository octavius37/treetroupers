<script setup lang="ts">
import type { CircleMarker, LayerGroup, Map as LeafletMap } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Point { lat: number, lng: number }
interface Suggestion extends Point { id: string, notes: string | null, author: string, mine: boolean }

const props = defineProps<{
  suggestions: Suggestion[]
  trees: Point[]
  pending: Point | null
  focus: Point | null
}>()

const emit = defineEmits<{ pick: [point: Point] }>()

const container = useTemplateRef<HTMLElement>('container')
let map: LeafletMap | null = null
let treeLayer: LayerGroup | null = null
let suggestionLayer: LayerGroup | null = null
let pendingMarker: CircleMarker | null = null

// Built as DOM nodes rather than an HTML string so user-written notes can't
// inject markup into the popup.
function popupFor(s: Suggestion) {
  const el = document.createElement('div')
  const title = document.createElement('div')
  title.className = 'font-medium text-gray-900'
  title.textContent = s.mine ? 'Your suggested spot' : `Suggested by ${s.author}`
  el.append(title)
  if (s.notes) {
    const notes = document.createElement('div')
    notes.className = 'text-gray-600 mt-1'
    notes.textContent = s.notes
    el.append(notes)
  }
  return el
}

function drawTrees() {
  if (!map) { return }
  treeLayer?.remove()
  treeLayer = L.layerGroup(props.trees.map(t => L.circleMarker([t.lat, t.lng], {
    radius: 4,
    color: '#15803d',
    fillColor: '#16a34a',
    fillOpacity: 0.8,
    weight: 1,
  }).bindTooltip('Planted tree'))).addTo(map)
}

function drawSuggestions() {
  if (!map) { return }
  suggestionLayer?.remove()
  suggestionLayer = L.layerGroup(props.suggestions.map(s => L.circleMarker([s.lat, s.lng], {
    radius: 9,
    color: '#b45309',
    fillColor: s.mine ? '#f59e0b' : '#fcd34d',
    fillOpacity: 0.85,
    weight: 2,
  }).bindPopup(popupFor(s)))).addTo(map)
}

function drawPending() {
  if (!map) { return }
  pendingMarker?.remove()
  pendingMarker = props.pending
    ? L.circleMarker([props.pending.lat, props.pending.lng], {
        radius: 11,
        color: '#16a34a',
        fillColor: '#ffffff',
        fillOpacity: 0.9,
        weight: 3,
        dashArray: '4 3',
      }).addTo(map)
    : null
}

function fitToData() {
  if (!map) { return }
  const points = [...props.suggestions, ...props.trees]
  if (points.length === 0) { return }
  map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 14 })
}

onMounted(() => {
  if (!container.value) { return }
  map = L.map(container.value, { worldCopyJump: true }).setView([20, 0], 2)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  map.on('click', (e) => {
    emit('pick', { lat: e.latlng.lat, lng: e.latlng.lng })
  })

  drawTrees()
  drawSuggestions()
  drawPending()
  fitToData()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

// Refit only when data first arrives, so adding a spot doesn't yank the view.
let fitted = false
watch(() => [props.trees, props.suggestions] as const, () => {
  drawTrees()
  drawSuggestions()
  if (!fitted) {
    fitToData()
    fitted = props.trees.length + props.suggestions.length > 0
  }
})
watch(() => props.pending, drawPending)
watch(() => props.focus, (p) => {
  if (p && map) { map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15)) }
})
</script>

<template>
  <div ref="container" class="h-full w-full" />
</template>
