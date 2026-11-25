// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    // Cookie-free page views, collected by Vercel. Turn on Web Analytics in the
    // Vercel project for data to arrive.
    '@vercel/analytics/nuxt',
  ],
  vite: {
    optimizeDeps: {
      include: ['cookie', 'grapesjs', 'leaflet']
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true
  },
  supabase: {
    redirect: false
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s · Tree Troupe',
      link: [{ rel: 'icon', href: '/favicon.ico' }],
    },
  },
  runtimeConfig: {
    public: {
      // Absolute URLs for share previews and the sitemap. Vercel sets
      // VERCEL_PROJECT_PRODUCTION_URL on every deployment; override with
      // NUXT_PUBLIC_SITE_URL once the site has its own domain.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
    },
  },
  routeRules: {
    // Standard security headers on every response. frame-ancestors/X-Frame-Options
    // stop other sites embedding Tree Troupe (clickjacking); the site itself
    // never needs framing from elsewhere. geolocation stays allowed for the
    // site's own "use my location" buttons.
    '/**': {
      headers: {
        'Content-Security-Policy': 'frame-ancestors \'self\'',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), payment=(), geolocation=(self)',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
    },
    // Signed-in and admin pages have nothing for search engines.
    '/dashboard/**': { headers: { 'X-Robots-Tag': 'noindex' } },
    '/cms/**': { headers: { 'X-Robots-Tag': 'noindex' } },
  }
})
