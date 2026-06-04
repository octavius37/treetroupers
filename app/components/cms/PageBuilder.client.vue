<script setup lang="ts">
import type { Editor } from 'grapesjs'
import grapesjs from 'grapesjs'
import gjsBlocksBasic from 'grapesjs-blocks-basic'
import 'grapesjs/dist/css/grapes.min.css'

interface NavOption {
  id: string
  title: string
}

interface Props {
  initialHtml?: string
  title: string
  slug: string
  status: 'draft' | 'published'
  parentId?: string | null
  navOrder?: number
  showInNav?: boolean
  // Other pages that can be picked as a parent (excludes the current page).
  parentOptions?: NavOption[]
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialHtml: '',
  parentId: null,
  navOrder: 0,
  showInNav: true,
  parentOptions: () => [],
  saving: false,
})

const emit = defineEmits<{
  save: [payload: {
    title: string
    slug: string
    status: 'draft' | 'published'
    html: string
    parent_id: string | null
    nav_order: number
    show_in_nav: boolean
  }]
}>()

const canvasRef = ref<HTMLDivElement>()
const blocksPanelRef = ref<HTMLDivElement>()
const styleSelectorsRef = ref<HTMLDivElement>()
const stylesRef = ref<HTMLDivElement>()
const layersRef = ref<HTMLDivElement>()
const editor = ref<Editor>()

const titleModel = ref(props.title)
const slugModel = ref(props.slug)
const statusModel = ref<'draft' | 'published'>(props.status)
const parentIdModel = ref<string | null>(props.parentId)
const navOrderModel = ref<number>(props.navOrder)
const showInNavModel = ref<boolean>(props.showInNav)

const tab = ref<'blocks' | 'layers' | 'styles'>('blocks')
const activeDevice = ref<'Desktop' | 'Tablet' | 'Mobile'>('Desktop')
const canUndo = ref(false)
const canRedo = ref(false)
const settingsOpen = ref(false)

watch(() => props.title, v => (titleModel.value = v))
watch(() => props.slug, v => (slugModel.value = v))
watch(() => props.status, v => (statusModel.value = v))
watch(() => props.parentId, v => (parentIdModel.value = v))
watch(() => props.navOrder, v => (navOrderModel.value = v))
watch(() => props.showInNav, v => (showInNavModel.value = v))

function smartBlockMarkerHtml(kind: 'stats-counter' | 'communities-carousel', label: string, hint: string) {
  // Marker uses only <span> children so the server-side replacer can match the
  // outer <div> with a non-greedy regex (no nested divs to confuse the match).
  return `<div data-block="${kind}" class="my-8 py-12 px-6 rounded-2xl border-2 border-dashed border-green-400 bg-green-50 text-center">`
    + `<span class="block text-xs uppercase tracking-wider text-green-700 font-semibold mb-2">Smart Block · ${label}</span>`
    + `<span class="block text-sm text-gray-600">${hint}</span>`
    + `<span class="block text-xs text-gray-400 mt-2">Renders live data on the public page.</span>`
    + `</div>`
}

function blockLabel(emoji: string, name: string) {
  return `<div class="gjs-tt-block-tile"><span class="gjs-tt-block-emoji">${emoji}</span><span class="gjs-tt-block-name">${name}</span></div>`
}

// Restores list markers + indentation that Tailwind preflight strips. Injected
// into the canvas iframe; the public renderer (app/pages/[slug].vue) applies the
// same rules scoped under .tt-page-content.
const LIST_CSS = `
  ul { list-style: disc; margin: 1em 0; padding-left: 1.5em; }
  ol { list-style: decimal; margin: 1em 0; padding-left: 1.5em; }
  ul ul { list-style: circle; }
  ul ul ul { list-style: square; }
  li { margin: 0.25em 0; }
`

onMounted(() => {
  if (!canvasRef.value) {
    return
  }

  editor.value = grapesjs.init({
    container: canvasRef.value,
    height: '100%',
    width: 'auto',
    storageManager: false,
    fromElement: false,
    components: props.initialHtml || '<section class="py-20 px-4 max-w-4xl mx-auto"><h1 class="text-4xl font-bold text-gray-900 mb-4">New Page</h1><p class="text-lg text-gray-600">Start editing — drag blocks from the right panel.</p></section>',
    canvas: {
      // Load a tiny shim FIRST that silences the Tailwind CDN's
      // "should not be used in production" warning — the CDN is appropriate
      // for our admin-only canvas (runtime-flexible, handles any class the
      // editor user types), but the warning is noise for our use case.
      scripts: [
        `data:text/javascript;base64,${btoa(
          `(function(){var w=console.warn;console.warn=function(){if(typeof arguments[0]==='string'&&arguments[0].indexOf('cdn.tailwindcss.com')!==-1)return;w.apply(console,arguments)}})()`,
        )}`,
        'https://cdn.tailwindcss.com',
      ],
    },
    plugins: [gjsBlocksBasic],
    pluginsOpts: {
      [gjsBlocksBasic as unknown as string]: {
        blocks: ['column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image', 'video', 'map'],
        flexGrid: true,
      },
    },
    blockManager: {
      appendTo: blocksPanelRef.value,
    },
    styleManager: {
      appendTo: stylesRef.value,
      sectors: [
        { name: 'General', open: false, buildProps: ['display', 'float', 'position', 'top', 'right', 'left', 'bottom'] },
        { name: 'Dimension', open: false, buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'] },
        { name: 'Typography', open: false, buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow'] },
        { name: 'Decorations', open: false, buildProps: ['background-color', 'border-radius', 'border', 'box-shadow', 'background'] },
        { name: 'Extra', open: false, buildProps: ['transition', 'perspective', 'transform'] },
      ],
    },
    selectorManager: { appendTo: styleSelectorsRef.value },
    layerManager: { appendTo: layersRef.value },
    panels: { defaults: [] },
    deviceManager: {
      devices: [
        { name: 'Desktop', width: '' },
        { name: 'Tablet', width: '768px', widthMedia: '992px' },
        { name: 'Mobile', width: '375px', widthMedia: '768px' },
      ],
    },
  })

  // Add Word-style list toggles to the inline rich-text editor toolbar.
  // execCommand('insert*List') toggles the list on/off and `state` lights the
  // button when the cursor is already inside that list type.
  const rte = editor.value.RichTextEditor
  // queryCommandState is the only API that reports list state inside a
  // contenteditable; deprecated in the TS DOM lib but still the standard
  // approach every WYSIWYG editor uses.
  const listState = (command: string) => (_rte: any, doc: Document) =>
    (doc as any).queryCommandState(command) ? 1 : 0

  rte.add('unorderedList', {
    icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><circle cx="4" cy="6" r="1.6"/><circle cx="4" cy="12" r="1.6"/><circle cx="4" cy="18" r="1.6"/><rect x="8" y="5" width="12" height="2" rx="1"/><rect x="8" y="11" width="12" height="2" rx="1"/><rect x="8" y="17" width="12" height="2" rx="1"/></svg>`,
    attributes: { title: 'Bulleted list' },
    state: listState('insertUnorderedList'),
    result: (r: any) => r.exec('insertUnorderedList'),
  })

  rte.add('orderedList', {
    icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><text x="1" y="8" font-size="7" font-family="sans-serif">1.</text><text x="1" y="14" font-size="7" font-family="sans-serif">2.</text><text x="1" y="20" font-size="7" font-family="sans-serif">3.</text><rect x="8" y="5" width="12" height="2" rx="1"/><rect x="8" y="11" width="12" height="2" rx="1"/><rect x="8" y="17" width="12" height="2" rx="1"/></svg>`,
    attributes: { title: 'Numbered list' },
    state: listState('insertOrderedList'),
    result: (r: any) => r.exec('insertOrderedList'),
  })

  // Plain section — a full-width container to drop other blocks into
  editor.value.BlockManager.add('section', {
    label: blockLabel('▭', 'Section'),
    category: 'Basic',
    content: `<section class="py-16 px-4">
      <div class="max-w-5xl mx-auto"></div>
    </section>`,
  })

  // Custom smart blocks (community-specific)
  editor.value.BlockManager.add('stats-counter', {
    label: blockLabel('📊', 'Stats Counter'),
    category: 'Smart Blocks',
    content: smartBlockMarkerHtml('stats-counter', 'Stats Counter', 'Shows live tree, community & member counts'),
  })

  editor.value.BlockManager.add('communities-carousel', {
    label: blockLabel('🌳', 'Communities'),
    category: 'Smart Blocks',
    content: smartBlockMarkerHtml('communities-carousel', 'Communities Carousel', 'Shows active communities from Supabase'),
  })

  // Pre-styled section presets to bootstrap pages
  editor.value.BlockManager.add('hero-gradient', {
    label: blockLabel('🎨', 'Hero'),
    category: 'Sections',
    content: `<section class="relative h-[400px] overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-green-950 via-green-800 to-green-600"></div>
      <div class="relative z-10 flex items-center justify-center h-full px-6">
        <h1 class="text-4xl md:text-5xl text-white text-center font-bold max-w-4xl">Your headline here</h1>
      </div>
    </section>`,
  })

  editor.value.BlockManager.add('cta-section', {
    label: blockLabel('✨', 'CTA'),
    category: 'Sections',
    content: `<section class="py-20 px-4 bg-green-600">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-white mb-6">Ready to make a difference?</h2>
        <p class="text-green-100 text-lg mb-8">Join us and start planting trees today.</p>
        <a href="/register" class="inline-block bg-white text-green-700 px-8 py-3 rounded-full font-medium hover:bg-green-50 transition-colors">Get Started</a>
      </div>
    </section>`,
  })

  // Sync undo/redo state to reactive refs
  const refreshUndoState = () => {
    const um = editor.value!.UndoManager
    canUndo.value = um.hasUndo()
    canRedo.value = um.hasRedo()
  }
  editor.value.on('component:add component:remove component:update style:property:update', refreshUndoState)
  editor.value.on('undo redo', refreshUndoState)

  editor.value.BlockManager.add('three-col', {
    label: blockLabel('▥', '3-Col Features'),
    category: 'Sections',
    content: `<section class="py-16 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Feature one</h3>
            <p class="text-gray-600">Short supporting description goes here.</p>
          </div>
          <div class="text-center p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Feature two</h3>
            <p class="text-gray-600">Short supporting description goes here.</p>
          </div>
          <div class="text-center p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Feature three</h3>
            <p class="text-gray-600">Short supporting description goes here.</p>
          </div>
        </div>
      </div>
    </section>`,
  })

  // Tailwind's preflight resets <ul>/<ol> to list-style:none, so lists made via
  // the RTE wouldn't show markers in the canvas. Inject restoring CSS into the
  // canvas iframe head. (The public page applies the same via .tt-page-content.)
  const injectListCss = () => {
    const doc = editor.value?.Canvas.getDocument()
    if (!doc || doc.getElementById('tt-list-css')) {
      return
    }
    const style = doc.createElement('style')
    style.id = 'tt-list-css'
    style.textContent = LIST_CSS
    doc.head.appendChild(style)
  }
  editor.value.on('canvas:frame:load', injectListCss)
  // Also run once on load in case the frame is already mounted
  editor.value.on('load', injectListCss)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function handleSave() {
  if (!editor.value) {
    return
  }
  const html = editor.value.getHtml() || ''
  emit('save', {
    title: titleModel.value,
    slug: slugModel.value,
    status: statusModel.value,
    html,
    parent_id: parentIdModel.value || null,
    nav_order: Number(navOrderModel.value) || 0,
    show_in_nav: showInNavModel.value,
  })
}

function setDevice(name: 'Desktop' | 'Tablet' | 'Mobile') {
  editor.value?.setDevice(name)
  activeDevice.value = name
}

function undo() {
  editor.value?.UndoManager.undo()
}

function redo() {
  editor.value?.UndoManager.redo()
}

// Cmd/Ctrl+S to save; Cmd/Ctrl+Z / Shift+Cmd/Ctrl+Z for undo/redo
function onKeydown(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey
  if (mod && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
  else if (mod && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
  else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="h-full w-full bg-gray-50 flex flex-col">
    <!-- Top toolbar -->
    <header class="bg-white border-b border-gray-200 shrink-0">
      <div class="px-5 py-2.5 flex items-center gap-4">
        <!-- Title + slug -->
        <div class="min-w-0 max-w-xs">
          <input
            v-model="titleModel"
            type="text"
            placeholder="Untitled page"
            class="w-full text-base font-semibold text-gray-900 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300 leading-tight"
          >
          <div class="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <span class="font-mono">/</span>
            <input
              v-model="slugModel"
              type="text"
              placeholder="page-slug"
              class="text-xs text-gray-500 outline-none border-0 focus:ring-0 bg-transparent placeholder:text-gray-300 font-mono flex-1 min-w-0"
            >
          </div>
        </div>

        <!-- Device switcher -->
        <div class="mx-auto flex bg-gray-100 rounded-lg p-0.5 shrink-0">
          <button
            v-for="d in (['Desktop', 'Tablet', 'Mobile'] as const)"
            :key="d"
            type="button"
            class="p-1.5 rounded-md transition-colors"
            :class="activeDevice === d ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'"
            :title="d"
            @click="setDevice(d)"
          >
            <svg v-if="d === 'Desktop'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="4" width="18" height="12" rx="2" />
              <path d="M8 20h8M12 16v4" stroke-linecap="round" />
            </svg>
            <svg v-else-if="d === 'Tablet'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <path d="M11 18h2" stroke-linecap="round" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <rect x="7" y="2" width="10" height="20" rx="2" />
              <path d="M11 18h2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            :disabled="!canUndo"
            class="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
            title="Undo (⌘Z)"
            @click="undo"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M9 14l-4-4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M5 10h9a5 5 0 015 5v0a5 5 0 01-5 5h-4" stroke-linecap="round" />
            </svg>
          </button>
          <button
            type="button"
            :disabled="!canRedo"
            class="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
            title="Redo (⌘⇧Z)"
            @click="redo"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M15 14l4-4-4-4" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M19 10h-9a5 5 0 00-5 5v0a5 5 0 005 5h4" stroke-linecap="round" />
            </svg>
          </button>

          <div class="mx-2 h-5 w-px bg-gray-200" />

          <!-- Page / nav settings -->
          <div class="relative">
            <button
              type="button"
              class="p-1.5 rounded-md transition-colors"
              :class="settingsOpen ? 'text-green-700 bg-green-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
              title="Page settings"
              @click="settingsOpen = !settingsOpen"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Settings popover -->
            <div
              v-if="settingsOpen"
              class="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 space-y-4"
            >
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Navigation
              </div>

              <!-- Show in nav -->
              <label class="flex items-center justify-between gap-3 cursor-pointer">
                <span class="text-sm text-gray-700">Show in menu bar</span>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="showInNavModel"
                  class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
                  :class="showInNavModel ? 'bg-green-600' : 'bg-gray-200'"
                  @click="showInNavModel = !showInNavModel"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="showInNavModel ? 'translate-x-4' : 'translate-x-0.5'"
                  />
                </button>
              </label>

              <!-- Parent page -->
              <div>
                <label class="block text-sm text-gray-700 mb-1">Parent page</label>
                <div class="relative">
                  <select
                    v-model="parentIdModel"
                    class="w-full appearance-none text-sm pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                  >
                    <option :value="null">
                      — Top level —
                    </option>
                    <option v-for="opt in parentOptions" :key="opt.id" :value="opt.id">
                      {{ opt.title || 'Untitled' }}
                    </option>
                  </select>
                  <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>

              <!-- Order -->
              <div>
                <label class="block text-sm text-gray-700 mb-1">Menu order</label>
                <input
                  v-model.number="navOrderModel"
                  type="number"
                  class="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors"
                >
                <p class="text-xs text-gray-400 mt-1">
                  Lower numbers appear first.
                </p>
              </div>
            </div>
          </div>

          <div class="relative">
            <select
              v-model="statusModel"
              class="appearance-none text-sm pl-3 pr-8 py-1.5 border border-gray-200 rounded-full bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-colors font-medium"
              :class="statusModel === 'published' ? 'text-green-700' : 'text-gray-600'"
            >
              <option value="draft">
                Draft
              </option>
              <option value="published">
                Published
              </option>
            </select>
            <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <button
            type="button"
            :disabled="saving"
            class="bg-green-600 text-white px-5 py-1.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            @click="handleSave"
          >
            <svg v-if="saving" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
            {{ saving ? 'Saving…' : 'Save' }}
            <span v-if="!saving" class="text-[10px] text-green-200 font-mono ml-0.5">⌘S</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Editor body -->
    <div class="flex-1 flex min-h-0">
      <!-- Canvas -->
      <div class="flex-1 min-w-0 min-h-0 gjs-tt-canvas-wrap">
        <div ref="canvasRef" class="h-full" />
      </div>

      <!-- Right rail with tabs -->
      <aside class="w-80 bg-white border-l border-gray-200 shrink-0 flex flex-col">
        <!-- Tab bar -->
        <div class="flex border-b border-gray-200 shrink-0">
          <button
            v-for="t in (['blocks', 'layers', 'styles'] as const)"
            :key="t"
            type="button"
            class="flex-1 px-4 py-3 text-xs font-medium uppercase tracking-wider transition-all relative"
            :class="tab === t ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'"
            @click="tab = t"
          >
            {{ t }}
            <span
              v-if="tab === t"
              class="absolute bottom-0 left-3 right-3 h-0.5 bg-green-600 rounded-full"
            />
          </button>
        </div>

        <!-- Tab content -->
        <div class="flex-1 overflow-y-auto min-h-0">
          <div v-show="tab === 'blocks'" ref="blocksPanelRef" class="gjs-tt-blocks-host" />
          <div v-show="tab === 'layers'" ref="layersRef" class="gjs-tt-layers-host" />
          <div v-show="tab === 'styles'" class="gjs-tt-styles-host">
            <div ref="styleSelectorsRef" />
            <div ref="stylesRef" />
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style>
/* ─────────────────────────────────────────────────────────────────────────
   GrapesJS overrides — make the editor chrome match Tailwind / app aesthetic
   ───────────────────────────────────────────────────────────────────────── */

/* GrapesJS editor root + canvas container — kill the default dark theme bars
   above/beside the canvas so the whole editing surface is one light gray. */
.gjs-tt-canvas-wrap .gjs-editor,
.gjs-tt-canvas-wrap .gjs-cv-canvas,
.gjs-tt-canvas-wrap .gjs-cv-canvas .gjs-cv-canvas__frames,
.gjs-tt-canvas-wrap .gjs-frame-wrapper {
  background-color: #e9ecef;
}

.gjs-tt-one-bg {
  background-color: #e9ecef;
}
/* Canvas workspace — light cool-gray surround so the white page reads as a
   distinct sheet floating above the editing surface. */
.gjs-tt-canvas-wrap .gjs-cv-canvas {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0);
  background-size: 18px 18px;
  top: 0;
  height: 100%;
}
.gjs-tt-canvas-wrap .gjs-cv-canvas__frames {
  padding: 24px;
}
.gjs-tt-canvas-wrap iframe {
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 12px 32px rgba(15, 23, 42, 0.10);
  border-radius: 10px;
  background: #fff;
}

/* Block panel */
.gjs-tt-blocks-host .gjs-blocks-c {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;
}
.gjs-tt-blocks-host .gjs-block-category {
  border-bottom: 1px solid #f3f4f6;
  margin: 0;
  background: transparent;
  border-radius: 0;
}
.gjs-tt-blocks-host .gjs-block-category .gjs-title {
  padding: 12px 16px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  background: transparent;
  border: 0;
}
.gjs-tt-blocks-host .gjs-block-category .gjs-title::before {
  content: none;
}
.gjs-tt-blocks-host .gjs-block-category.gjs-open .gjs-title {
  color: #374151;
}
.gjs-tt-blocks-host .gjs-block {
  width: 100% !important;
  min-height: 76px !important;
  margin: 0 !important;
  padding: 12px 8px !important;
  background: #fff !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 11px !important;
  color: #4b5563 !important;
  transition: all 0.12s ease !important;
}
.gjs-tt-blocks-host .gjs-block:hover {
  border-color: #16a34a !important;
  background: #f0fdf4 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(22, 163, 74, 0.08) !important;
}
/* .gjs-block-label is the WRAPPER for both icon + text — don't hide it.
   Make it a centered flex column so my custom emoji/name HTML and the
   default plugin SVG icons both center cleanly. */
.gjs-tt-blocks-host .gjs-block-label {
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  font-size: 11px !important;
  font-weight: 500;
  color: #4b5563;
  line-height: 1.2;
  text-align: center;
}
.gjs-tt-blocks-host .gjs-block-media {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}
/* Resize the basic-blocks plugin's inline SVG icons to fit our tile */
.gjs-tt-blocks-host .gjs-block svg {
  width: 24px !important;
  height: 24px !important;
  fill: #6b7280;
}
/* My custom HTML labels (Smart Blocks, Sections) */
.gjs-tt-block-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.gjs-tt-block-emoji {
  font-size: 22px;
  line-height: 1;
}
.gjs-tt-block-name {
  font-size: 11px;
  color: #4b5563;
  font-weight: 500;
}

/* Layers panel */
.gjs-tt-layers-host {
  padding: 8px;
}
.gjs-tt-layers-host .gjs-layer {
  background: transparent !important;
  border-radius: 6px;
}
.gjs-tt-layers-host .gjs-layer-title {
  padding: 6px 8px !important;
  font-size: 12px !important;
  color: #374151 !important;
  border-radius: 6px;
  transition: background 0.12s;
}
.gjs-tt-layers-host .gjs-layer-title:hover {
  background: #f3f4f6 !important;
}
.gjs-tt-layers-host .gjs-layer.gjs-selected > .gjs-layer-title-c .gjs-layer-title {
  background: #f0fdf4 !important;
  color: #15803d !important;
}
.gjs-tt-layers-host .gjs-layer-name {
  color: inherit !important;
}
.gjs-tt-layers-host .gjs-layer-caret {
  color: #9ca3af;
}

/* Style + Selector panels */
.gjs-tt-styles-host {
  padding: 0;
}
.gjs-tt-styles-host .gjs-clm-tags {
  padding: 12px;
  background: transparent;
  border-bottom: 1px solid #f3f4f6;
}
.gjs-tt-styles-host .gjs-clm-tags-c {
  padding: 0;
}
.gjs-tt-styles-host .gjs-clm-tag {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border-radius: 999px !important;
  padding: 2px 8px !important;
  font-size: 11px !important;
  margin: 2px !important;
}
.gjs-tt-styles-host .gjs-clm-tag-status,
.gjs-tt-styles-host .gjs-clm-tag-close {
  color: #15803d !important;
}
.gjs-tt-styles-host .gjs-clm-label,
.gjs-tt-styles-host .gjs-clm-sels-info {
  color: #6b7280 !important;
  font-size: 11px !important;
}
.gjs-tt-styles-host .gjs-clm-tags-btn {
  background: #fff !important;
  border: 1px dashed #d1d5db !important;
  color: #6b7280 !important;
  border-radius: 6px !important;
  font-size: 14px !important;
}
.gjs-tt-styles-host .gjs-sm-sector {
  border-bottom: 1px solid #f3f4f6 !important;
  padding: 0 !important;
  background: transparent !important;
}
.gjs-tt-styles-host .gjs-sm-sector .gjs-sm-title {
  padding: 12px 16px 8px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  color: #6b7280 !important;
  background: transparent !important;
  border: 0 !important;
}
.gjs-tt-styles-host .gjs-sm-sector.gjs-sm-open .gjs-sm-title {
  color: #374151 !important;
}
.gjs-tt-styles-host .gjs-sm-properties {
  padding: 0 12px 12px !important;
  background: transparent !important;
}
.gjs-tt-styles-host .gjs-sm-property {
  padding: 4px 0 !important;
  background: transparent !important;
}
.gjs-tt-styles-host .gjs-field {
  background: #fff !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}
.gjs-tt-styles-host .gjs-field:focus-within {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1) !important;
}
.gjs-tt-styles-host .gjs-input-holder,
.gjs-tt-styles-host .gjs-field input,
.gjs-tt-styles-host .gjs-field select {
  background: transparent !important;
  color: #374151 !important;
}
.gjs-tt-styles-host .gjs-sm-label {
  color: #6b7280 !important;
  font-size: 11px !important;
}

/* Hide GrapesJS's selected-component badge in the canvas (the floating "Body" tag) */
.gjs-tt-canvas-wrap .gjs-toolbar {
  background: rgba(22, 163, 74, 0.95) !important;
  border-radius: 4px !important;
}
.gjs-tt-canvas-wrap .gjs-com-badge {
  background: rgba(22, 163, 74, 0.95) !important;
  border-radius: 4px 4px 0 0 !important;
  font-size: 10px !important;
  padding: 2px 6px !important;
}

/* Highlight on hover/select */
.gjs-tt-canvas-wrap .gjs-hovered {
  outline: 1px solid #16a34a !important;
}
.gjs-tt-canvas-wrap .gjs-selected {
  outline: 2px solid #16a34a !important;
}
</style>
