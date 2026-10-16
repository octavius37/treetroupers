import { serverSupabaseServiceRole } from '#supabase/server'

const DECISIONS = ['approved', 'rejected'] as const

// Approves or rejects a pending tree log after an admin has looked at its photo.
// Approval pays the log's points, through the on_tree_approved trigger. Only
// pending logs can be reviewed, so a log can't be paid twice, and the database
// refuses to un-approve one.
export default defineEventHandler(async (event) => {
  const { profile } = await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing tree id' }) }

  const decision = (await readBody(event))?.decision
  if (!DECISIONS.includes(decision)) {
    throw createError({ statusCode: 400, message: 'decision must be "approved" or "rejected"' })
  }

  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('trees')
    .update({ review_status: decision, reviewed_by: profile.id })
    .eq('id', id)
    .eq('review_status', 'pending')
    .select()
    .maybeSingle()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  if (!data) { throw createError({ statusCode: 409, message: 'This log has already been reviewed, or no longer exists' }) }
  return data
})
