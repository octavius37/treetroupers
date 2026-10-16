// The public pages, for search engines. Signed-in and admin pages are left out
// (robots.txt disallows them too).
const PUBLIC_PATHS = [
  '/',
  '/map',
  '/climate-change',
  '/what-can-i-do',
  '/who-we-are',
  '/global-tree-planting-organizations',
  '/planting-trees-doing-everyday-tasks',
  '/a-short-guide-to-tree-planting',
  '/contact',
  '/register',
  '/privacy',
  '/terms',
]

export default defineEventHandler((event) => {
  const { public: { siteUrl } } = useRuntimeConfig(event)
  const urls = PUBLIC_PATHS.map(path => `  <url><loc>${siteUrl}${path}</loc></url>`).join('\n')
  setHeader(event, 'Content-Type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
