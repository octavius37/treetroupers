export default defineEventHandler((event) => {
  const { public: { siteUrl } } = useRuntimeConfig(event)
  setHeader(event, 'Content-Type', 'text/plain')
  return [
    'User-Agent: *',
    'Disallow: /dashboard',
    'Disallow: /cms',
    'Disallow: /api',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
})
