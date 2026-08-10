// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@bg-dev/nuxt-naiveui',
    '@sidebase/nuxt-auth',
    '@nuxtjs/supabase'
  ],
  build: {
    transpile: [
      'trpc-nuxt',
    ]
  },
  vite: {
    optimizeDeps: {
      include: ['cookie', 'grapesjs']
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true
  },
  auth: {
    baseURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth` : `${process.env.NUXT_URL}/api/auth`,
  },
  supabase: {
    redirect: false
  }
})
