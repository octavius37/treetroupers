export default defineNitroPlugin(() => {
  // Payload is initialized lazily on first getPayloadClient() call.
  // Eager init caused Next.js HMR route conflicts (/_next/webpack-hmr).
  console.log('[Payload CMS] Plugin registered — will initialize on first API request')
})
