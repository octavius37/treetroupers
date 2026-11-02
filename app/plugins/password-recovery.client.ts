// A password-reset link signs the user in and, when its redirect URL isn't on
// Supabase's allowed list, lands on the site URL rather than /reset-password.
// Supabase still reports the sign-in as a recovery, so send the user to the
// page where they can choose a new password, wherever they landed.
export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      navigateTo('/reset-password')
    }
  })
})
