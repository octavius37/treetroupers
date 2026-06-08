import type { Database } from '~/types/database.types'

export function useUserRole() {
  const user = useSupabaseUser()
  const client = useSupabaseClient<Database>()

  const { data: role, refresh } = useAsyncData(
    'current-user-role',
    async () => {
      if (!user.value) { return null }
      const { data } = await client
        .from('profiles')
        .select('role')
        .eq('auth_user_id', user.value.id)
        .single()
      return data?.role ?? null
    },
    { watch: [user] },
  )

  const isAdmin = computed(() => role.value === 'admin')

  return { role, isAdmin, refresh }
}
