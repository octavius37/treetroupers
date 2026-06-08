export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }

  // Role enforcement is a UX gate only (the real boundary is requireAdmin on the
  // API). The Supabase user/profile fetch is reliable only client-side in this
  // app, so we make the redirect decision on the client. On the server we let it
  // through and the client-side middleware run enforces.
  if (import.meta.server) { return }

  const { fetchRole } = useUserRole()
  const role = await fetchRole()
  if (role !== 'admin') {
    return navigateTo('/dashboard')
  }
})
