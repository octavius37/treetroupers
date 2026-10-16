import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseServiceRole } from '#supabase/server'

// Buckets holding files under <auth user id>/.
const USER_BUCKETS = ['tree-photos', 'avatars']

function failOn(error: { message: string } | null) {
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
}

async function removeUserFiles(client: Pick<SupabaseClient, 'storage'>, bucket: string, uid: string) {
  const { data: files, error } = await client.storage.from(bucket).list(uid, { limit: 1000 })
  // A bucket that was never created holds nothing to delete.
  if (error && !/not found/i.test(error.message)) {
    throw createError({ statusCode: 500, message: `Could not delete your photos: ${error.message}` })
  }
  if (!files?.length) { return }
  const { error: removeError } = await client.storage.from(bucket).remove(files.map(f => `${uid}/${f.name}`))
  if (removeError) {
    throw createError({ statusCode: 500, message: `Could not delete your photos: ${removeError.message}` })
  }
}

/**
 * Deletes the caller's account and personal data. Deleting the auth user
 * cascades to the profile and from there to memberships, points, likes,
 * suggestions and reward redemptions. Trees stay, unlinked from the person
 * (trees.planted_by is on delete set null), so community totals don't drop;
 * their photos and notes go, and pending logs, which only exist to be
 * reviewed, are deleted outright.
 */
export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const { confirm } = (await readBody(event)) ?? {}
  if (confirm !== 'DELETE') {
    throw createError({ statusCode: 400, message: 'Type DELETE to confirm' })
  }

  const client = serverSupabaseServiceRole(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', uid)
    .single()
  if (profileError || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  // Files first: if this fails the account is still there, and deleting can be retried.
  await Promise.all(USER_BUCKETS.map(bucket => removeUserFiles(client, bucket, uid)))

  // In this order: a pending log may not lose its photo, so those go before the
  // photos are stripped from the rest.
  const pending = await client.from('trees').delete().eq('planted_by', profile.id).eq('review_status', 'pending')
  failOn(pending.error)
  const stripped = await client.from('trees').update({ photo_urls: [], notes: null }).eq('planted_by', profile.id)
  failOn(stripped.error)
  const updates = await client.from('tree_updates').delete().eq('author_id', profile.id)
  failOn(updates.error)

  const { error } = await client.auth.admin.deleteUser(uid)
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  return { deleted: true }
})
