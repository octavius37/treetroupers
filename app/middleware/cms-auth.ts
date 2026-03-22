export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }

  // TODO: Add proper admin role check here.
  // Options:
  //   1. Add an `is_admin` boolean column to the profiles table
  //   2. Check against ADMIN_EMAILS env var via a server endpoint
  //   3. Use Supabase custom claims / app_metadata
  // For now, any authenticated user can access the CMS.
})
