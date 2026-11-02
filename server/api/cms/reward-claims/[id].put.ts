import { serverSupabaseServiceRole } from '#supabase/server'

// Marks a reward claim as sent, or cancels it (the member can then claim again).
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing claim id' }) }

  const { status } = (await readBody(event)) ?? {}
  if (status !== 'fulfilled' && status !== 'cancelled') {
    throw createError({ statusCode: 400, message: 'status must be "fulfilled" or "cancelled"' })
  }

  const { data, error } = await serverSupabaseServiceRole(event)
    .from('reward_redemptions')
    .update({ status, fulfilled_at: status === 'fulfilled' ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id, status')
    .maybeSingle()
  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  if (!data) { throw createError({ statusCode: 409, message: 'This claim has already been dealt with' }) }
  return data
})
