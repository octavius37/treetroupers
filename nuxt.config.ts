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
      'payload',
      '@payloadcms/db-postgres',
    ]
  },
  nitro: {
    // Prevent Nitro from trying to bundle Payload's native deps
    externals: {
      inline: ['payload', '@payloadcms/db-postgres'],
    },
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
  auth: {
    baseURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth` : `${process.env.NUXT_URL}/api/auth`,
  },
  supabase: {
    redirect: false
  }
})
