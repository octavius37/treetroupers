import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function statCell(n: number | null, label: string) {
  return `<div><div class="text-4xl font-bold text-green-600 mb-2">${n ?? 0}</div><div class="text-gray-600">${label}</div></div>`
}

async function renderStatsCounter(event: H3Event) {
  const client = serverSupabaseServiceRole(event)
  const [trees, communities, members] = await Promise.all([
    client.from('trees').select('id', { count: 'exact', head: true }),
    client.from('communities').select('id', { count: 'exact', head: true }),
    client.from('profiles').select('id', { count: 'exact', head: true }),
  ])
  return `<section class="py-20 px-4"><div class="max-w-7xl mx-auto"><div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">${
    statCell(trees.count, 'Trees Planted')
  }${statCell(communities.count, 'Communities')
  }${statCell(members.count, 'Active Members')
  }</div></div></section>`
}

async function renderCommunitiesCarousel(event: H3Event) {
  const client = serverSupabaseServiceRole(event)
  const { data } = await client
    .from('communities')
    .select('name, slug, description')
    .order('name')
    .limit(6)

  if (!data || data.length === 0) {
    return `<section class="py-12 px-4"><div class="max-w-5xl mx-auto text-center text-gray-500">No communities yet.</div></section>`
  }

  const cards = data
    .map(c => `<div class="bg-white rounded-xl border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">${escapeHtml(c.name)}</h3>
      <p class="text-sm text-gray-600 line-clamp-3">${escapeHtml(c.description || '')}</p>
    </div>`)
    .join('')

  return `<section class="py-16 px-4 bg-gray-50"><div class="max-w-7xl mx-auto">
    <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Active Communities</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>
  </div></section>`
}

// Smart-block markers are <div data-block="…">…spans…</div> with no nested divs,
// so a non-greedy match on the outer </div> is safe.
const PATTERNS = {
  'stats-counter': /<div\s+data-block="stats-counter"[\s\S]*?<\/div>/g,
  'communities-carousel': /<div\s+data-block="communities-carousel"[\s\S]*?<\/div>/g,
} as const

export async function resolveSmartBlocks(event: H3Event, html: string): Promise<string> {
  if (!html.includes('data-block=')) {
    return html
  }

  const renderJobs: Array<Promise<{ kind: keyof typeof PATTERNS, html: string }>> = []
  if (html.includes('data-block="stats-counter"')) {
    renderJobs.push(renderStatsCounter(event).then(h => ({ kind: 'stats-counter' as const, html: h })))
  }
  if (html.includes('data-block="communities-carousel"')) {
    renderJobs.push(renderCommunitiesCarousel(event).then(h => ({ kind: 'communities-carousel' as const, html: h })))
  }

  const rendered = await Promise.all(renderJobs)
  let out = html
  for (const { kind, html: rh } of rendered) {
    out = out.replace(PATTERNS[kind], () => rh)
  }
  return out
}
