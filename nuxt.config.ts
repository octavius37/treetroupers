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
      'trpc-nuxt'
    ]
  },
  vite: {
    optimizeDeps: {
      include: ['cookie']
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true
  },
  supabase: {
    redirect: false
  }
})
