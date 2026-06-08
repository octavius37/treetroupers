export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }

  const { isAdmin, refresh } = useUserRole()
  await refresh()
  if (!isAdmin.value) {
    return navigateTo('/dashboard')
  }
})
