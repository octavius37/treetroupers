<script setup lang="ts">
import type { LayerGroup, Map as LeafletMap } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Point { lat: number, lng: number }
interface MappedTree extends Point { id: string, species: string, plantedBy?: string, plantedAt: string, status: string }

// `publicView` is the signed-out visitor map: no planter names, and no links
// into the dashboard.
const props = withDefaults(defineProps<{
  trees: MappedTree[]
  focus: Point | null
  publicView?: boolean
}>(), { publicView: false })

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
  const date = new Date(t.plantedAt).toLocaleDateString()
  meta.textContent = t.plantedBy ? `Planted by ${t.plantedBy} · ${date}` : `Planted ${date}`
  const status = document.createElement('div')
  status.className = 'text-xs text-gray-400 mt-1 capitalize'
  status.textContent = t.status
  el.append(title, meta, status)
  if (!props.publicView) {
    const link = document.createElement('a')
    link.href = `/dashboard/trees/${t.id}`
    link.className = 'block text-green-700 mt-2'
    link.textContent = 'View tree →'
    el.append(link)
  }
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

// Nuxt's .client wrapper mounts a placeholder first and renders this template
// a tick later, so onMounted fires before the map's element exists and the map
// was never created. Create it when the element appears instead.
watch(container, (el) => {
  if (!el || map) { return }
  map = L.map(el, { worldCopyJump: true }).setView([20, 0], 2)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  drawTrees()
  fitToData()
}, { immediate: true, flush: 'post' })

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
