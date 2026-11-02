import { serverSupabaseServiceRole } from '#supabase/server'

// One tree's page. Members can see any approved or pending tree; a rejected log
// is only visible to its planter. The proof photo follows the privacy policy:
// the planter always sees it, everyone else only for an approved planted tree,
// since donation and earning proofs are often receipts.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const id = getRouterParam(event, 'id')
  if (!id) { throw createError({ statusCode: 400, message: 'Missing tree id' }) }

  const client = serverSupabaseServiceRole(event)

  const { data: tree, error } = await client
    .from('trees')
    .select(`id, source, quantity, status, review_status, review_note, notes, planted_at, created_at, lat, lng,
      photo_urls, donation_project, earned_activity, planted_by, species_id,
      tree_species(common_name, scientific_name, avg_co2_kg_per_year),
      communities(id, name),
      profiles!planted_by(id, display_name, avatar_url)`)
    .eq('id', id)
    .maybeSingle()
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  const isMine = !!tree && tree.planted_by === profile.id
  if (!tree || (tree.review_status === 'rejected' && !isMine)) {
    throw createError({ statusCode: 404, message: 'Tree not found' })
  }

  const { data: updates, error: updatesError } = await client
    .from('tree_updates')
    .select('id, content, photo_urls, created_at, profiles!author_id(id, display_name, avatar_url)')
    .eq('tree_id', id)
    .order('created_at', { ascending: false })
  if (updatesError) { throw createError({ statusCode: 500, message: updatesError.message }) }

  const species = tree.tree_species as { common_name: string, scientific_name: string, avg_co2_kg_per_year: number | null } | null
  const planter = tree.profiles as { id: string, display_name: string | null, avatar_url: string | null } | null
  const showPhoto = isMine || (tree.source === 'planted' && tree.review_status === 'approved')

  return {
    id: tree.id,
    source: tree.source,
    quantity: tree.quantity,
    status: tree.status,
    reviewStatus: tree.review_status,
    // The reviewer's note is between them and the planter.
    reviewNote: isMine ? tree.review_note : null,
    notes: tree.notes,
    plantedAt: tree.planted_at,
    lat: tree.lat,
    lng: tree.lng,
    donationProject: tree.donation_project,
    earnedActivity: tree.earned_activity,
    photoUrl: showPhoto ? tree.photo_urls?.[0] ?? null : null,
    speciesId: tree.species_id,
    species: species
      ? { name: species.common_name, scientificName: species.scientific_name, co2KgPerYear: species.avg_co2_kg_per_year }
      : null,
    community: tree.communities as { id: string, name: string } | null,
    planter: planter
      ? { id: planter.id, name: planter.display_name || 'A Tree Trouper', avatarUrl: planter.avatar_url }
      : null,
    isMine,
    updates: (updates ?? []).map((u) => {
      const author = u.profiles as { id: string, display_name: string | null, avatar_url: string | null } | null
      return {
        id: u.id,
        content: u.content,
        photoUrl: u.photo_urls?.[0] ?? null,
        createdAt: u.created_at,
        author: author ? { id: author.id, name: author.display_name || 'A Tree Trouper', avatarUrl: author.avatar_url } : null,
      }
    }),
  }
})
