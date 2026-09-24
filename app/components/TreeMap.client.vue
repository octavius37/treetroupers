<script setup lang="ts">
import type { LayerGroup, Map as LeafletMap } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Point { lat: number, lng: number }
interface MappedTree extends Point { id: string, species: string, plantedBy: string, plantedAt: string, status: string }

const props = defineProps<{
  trees: MappedTree[]
  focus: Point | null
}>()

const STATUS_COLOURS: Record<string, string> = {
  planted: '#f59e0b',
  growing: '#3b82f6',
  mature: '#16a34a',
  removed: '#ef4444',
}

const container = useTemplateRef<HTMLElement>('container')
let map: LeafletMap | null = null
let treeLayer: LayerGroup | null = null

// Built as DOM nodes rather than an HTML string so user-supplied names can't
// inject markup into the popup.
function popupFor(t: MappedTree) {
  const el = document.createElement('div')
  const title = document.createElement('div')
  title.className = 'font-medium text-gray-900'
  title.textContent = t.species
  const meta = document.createElement('div')
  meta.className = 'text-gray-600 mt-1'
  meta.textContent = `Planted by ${t.plantedBy} · ${new Date(t.plantedAt).toLocaleDateString()}`
  const status = document.createElement('div')
  status.className = 'text-xs text-gray-400 mt-1 capitalize'
  status.textContent = t.status
  el.append(title, meta, status)
  return el
}

function drawTrees() {
  if (!map) { return }
  treeLayer?.remove()
  treeLayer = L.layerGroup(props.trees.map((t) => {
    const colour = STATUS_COLOURS[t.status] ?? '#16a34a'
    return L.circleMarker([t.lat, t.lng], {
      radius: 7,
      color: '#14532d',
      fillColor: colour,
      fillOpacity: 0.85,
      weight: 1.5,
    }).bindPopup(popupFor(t))
  })).addTo(map)
}

function fitToData() {
  if (!map || props.trees.length === 0) { return }
  map.fitBounds(L.latLngBounds(props.trees.map(t => [t.lat, t.lng])), { padding: [40, 40], maxZoom: 14 })
}

onMounted(() => {
  if (!container.value) { return }
  map = L.map(container.value, { worldCopyJump: true }).setView([20, 0], 2)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  drawTrees()
  fitToData()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

let fitted = false
watch(() => props.trees, () => {
  drawTrees()
  if (!fitted) {
    fitToData()
    fitted = props.trees.length > 0
  }
})
watch(() => props.focus, (p) => {
  if (p && map) { map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15)) }
})
</script>

<template>
  <div ref="container" class="h-full w-full" />
</template>
