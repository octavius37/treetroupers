// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@bg-dev/nuxt-naiveui',
    '@nuxtjs/supabase'
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
  }
})
