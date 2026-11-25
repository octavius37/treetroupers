import { serverSupabaseServiceRole } from '#supabase/server'

interface MapTree {
  id: string
  source: string
  quantity: number
  status: string
  reviewStatus: string
  plantedAt: string
  lat: number | null
  lng: number | null
  species: string | null
  plantedById: string | null
  plantedBy: string
  photoUrl: string | null
}

// Every pending and approved tree for the member map. member_tree_map applies
// the photo rules (your own always; others' only on approved planted trees) and
// returns one json value, so PostgREST's 1000-row limit can't cut the map off.
export default defineEventHandler(async (event) => {
  const { profile } = await requireViewer(event)

  const { data, error } = await serverSupabaseServiceRole(event).rpc('member_tree_map', { p_viewer: profile.id })
  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  return ((data ?? []) as MapTree[]).map(tree => Object.assign(tree, { isMine: tree.plantedById === profile.id }))
})
