// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@bg-dev/nuxt-naiveui',
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
    // Signed-in and admin pages have nothing for search engines.
    '/dashboard/**': { headers: { 'X-Robots-Tag': 'noindex' } },
    '/cms/**': { headers: { 'X-Robots-Tag': 'noindex' } },
  }
})
