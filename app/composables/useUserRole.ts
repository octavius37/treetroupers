import type { Database } from '~/types/database.types'

type Role = 'admin' | 'user'

/**
 * Exposes the current user's global role (from profiles.role) and an `isAdmin`
 * flag. The role is fetched client-side once the Supabase user is known and
 * cached in shared `useState` so every caller (middleware, header, pages) sees
 * the same value.
 *
 * Why not useAsyncData with an SSR fetch: in this app the Supabase user is only
 * reliably available client-side, so an SSR fetch resolves to null and hydrates
 * a stale null that never refreshes. We mirror the working dashboard pattern and
 * fetch on the client.
 */
export function useUserRole() {
  const authUserId = useAuthUserId()
  const client = useSupabaseClient<Database>()

  // Shared across the app; null = not yet loaded.
  const role = useState<Role | null>('current-user-role', () => null)

  async function fetchRole(): Promise<Role | null> {
    if (!authUserId.value) {
      role.value = null
      return null
    }
    const { data } = await client
      .from('profiles')
      .select('role')
      .eq('auth_user_id', authUserId.value)
      .single()
    role.value = (data?.role as Role) ?? null
    return role.value
  }

  // Keep the cached role in sync with the logged-in user, client-side only.
  if (import.meta.client) {
    watch(authUserId, () => { fetchRole() }, { immediate: role.value === null })
  }

  const isAdmin = computed(() => role.value === 'admin')

  return { role, isAdmin, fetchRole }
}
