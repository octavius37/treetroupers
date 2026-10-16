import { serverSupabaseServiceRole } from '#supabase/server'

const DECISIONS = ['approved', 'rejected'] as const
const MAX_NOTE = 500

// Approves or rejects a pending tree log after an admin has looked at its photo.
// Approval pays the log's points, through the on_tree_approved trigger. Only
// pending logs can be reviewed, so a log can't be paid twice, and the database
// refuses to un-approve one. The optional note (mostly a reason for rejecting)
// is shown to the planter, who is also emailed the outcome.
export default defineEventHandler(async (event) => {
  const { profile } = await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing tree id' }) }

  const body = (await readBody(event)) ?? {}
  const decision = body.decision
  if (!DECISIONS.includes(decision)) {
    throw createError({ statusCode: 400, message: 'decision must be "approved" or "rejected"' })
  }
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, MAX_NOTE) : ''

  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('trees')
    .update({ review_status: decision, reviewed_by: profile.id, review_note: note || null })
    .eq('id', id)
    .eq('review_status', 'pending')
    .select('id, source, quantity, planted_by, tree_species(common_name)')
    .maybeSingle()

  if (error) { throw createError({ statusCode: 500, message: error.message }) }
  if (!data) { throw createError({ statusCode: 409, message: 'This log has already been reviewed, or no longer exists' }) }

  await notifyPlanter(event, data as ReviewedTree, decision, note)
  return data
})

interface ReviewedTree {
  id: string
  source: string
  quantity: number
  planted_by: string | null
  tree_species: { common_name: string } | null
}

function describe(tree: ReviewedTree) {
  const trees = tree.quantity === 1 ? '1 tree' : `${tree.quantity} trees`
  if (tree.source === 'donated') { return `donation of ${trees}` }
  if (tree.source === 'earned') { return `${trees} earned` }
  return tree.tree_species?.common_name ? `${tree.tree_species.common_name}` : 'planted tree'
}

async function notifyPlanter(event: Parameters<typeof serverSupabaseServiceRole>[0], tree: ReviewedTree, decision: string, note: string) {
  if (!tree.planted_by) { return }
  const client = serverSupabaseServiceRole(event)
  const { data: planter } = await client.from('profiles').select('auth_user_id, display_name').eq('id', tree.planted_by).single()
  if (!planter?.auth_user_id) { return }
  const { data: auth } = await client.auth.admin.getUserById(planter.auth_user_id)
  const email = auth?.user?.email
  if (!email) { return }

  const { public: { siteUrl } } = useRuntimeConfig(event)
  const link = `${siteUrl}/dashboard/trees/${tree.id}`
  const hello = `Hi ${planter.display_name || 'there'},`
  const reason = note ? `\n\nNote from the reviewer: ${note}` : ''

  await sendEmail(decision === 'approved'
    ? {
        to: email,
        subject: 'Your tree log was approved 🌳',
        text: `${hello}\n\nGreat news: your ${describe(tree)} has been approved, and your points have been added.${reason}\n\nSee it here: ${link}\n\nThank you for planting with Tree Troupe!`,
      }
    : {
        to: email,
        subject: 'About your tree log',
        text: `${hello}\n\nWe couldn't approve your ${describe(tree)} this time.${reason}\n\nYou can see it here, and log it again with a clearer photo: ${link}\n\nThe Tree Troupe team`,
      })
}
