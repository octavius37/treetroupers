/**
 * The current user's auth id (the `auth.users.id`, i.e. profiles.auth_user_id).
 *
 * `useSupabaseUser()` in this version of @nuxtjs/supabase returns the decoded
 * JWT payload, where the user id is the `sub` claim — there is no `.id` field.
 * Use this helper instead of reading `user.value.id` directly. Returns null when
 * there is no user.
 */
export function useAuthUserId() {
  const user = useSupabaseUser()
  return computed(() => (user.value as { sub?: string } | null)?.sub ?? null)
}
