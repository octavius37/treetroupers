import { serverSupabaseServiceRole } from '#supabase/server'

const POST_COLUMNS = [
  'id, kind, category, title, body, photo_url, event_at, created_at, author_id, community_id',
  'communities(name)',
  'profiles!author_id(display_name, avatar_url)',
  'trees(id, source, quantity, photo_urls, tree_species(common_name))',
  'post_likes(profile_id, profiles(display_name))',
].join(', ')

const POST_LIMIT = 50
const EVENT_LIMIT = 5
const TOP_PLANTER_LIMIT = 5

interface PostRow {
  id: string
  kind: 'announcement' | 'activity'
  category: string | null
  title: string | null
  body: string | null
  photo_url: string | null
  event_at: string | null
  created_at: string
  author_id: string | null
  community_id: string | null
  communities: { name: string } | null
  profiles: { display_name: string | null, avatar_url: string | null } | null
  trees: {
    id: string
    source: string
    quantity: number
    photo_urls: string[]
    tree_species: { common_name: string } | null
  } | null
  post_likes: { profile_id: string, profiles: { display_name: string | null } | null }[]
}

// Who may delete an announcement: its author, a site admin, or an admin of
// the community it was posted to.
interface Viewer {
  id: string
  isSiteAdmin: boolean
  postsTo: Set<string>
}

function toPost(row: PostRow, viewer: Viewer) {
  const viewerId = viewer.id
  const likes = row.post_likes ?? []
  return {
    id: row.id,
    kind: row.kind,
    category: row.category,
    title: row.title,
    body: row.body,
    photoUrl: row.photo_url,
    eventAt: row.event_at,
    createdAt: row.created_at,
    communityName: row.communities?.name ?? null,
    author: {
      id: row.author_id,
      name: row.profiles?.display_name || 'A Tree Trouper',
      avatarUrl: row.profiles?.avatar_url ?? null,
    },
    tree: row.trees
      ? {
          id: row.trees.id,
          source: row.trees.source,
          quantity: row.trees.quantity,
          species: row.trees.tree_species?.common_name ?? null,
          // Only planted trees show their photo. A donation or earning proof is
          // often a receipt or a screenshot, which can carry personal details.
          photoUrl: row.trees.source === 'planted' ? row.trees.photo_urls?.[0] ?? null : null,
        }
      : null,
    isMine: row.author_id === viewerId,
    canDelete: row.kind === 'announcement' && (
      viewer.isSiteAdmin
      || row.author_id === viewerId
      || (!!row.community_id && viewer.postsTo.has(row.community_id))
    ),
    likeCount: likes.length,
    likedByMe: likes.some(like => like.profile_id === viewerId),
    likers: likes
      .filter(like => like.profile_id !== viewerId)
      .map(like => like.profiles?.display_name || 'A Tree Trouper'),
  }
}

// One community's feed page: its announcements and those of every community
// containing it, approved-tree activity from it and every community inside it,
// upcoming events, and headline stats.
export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const client = serverSupabaseServiceRole(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', uid)
    .single()
  if (profileError || !profile) { throw createError({ statusCode: 404, message: 'Profile not found' }) }

  const [membershipsRes, communitiesRes] = await Promise.all([
    client.from('community_members').select('community_id, role').eq('profile_id', profile.id),
    client.from('communities').select('id, name, description, parent_community_id').order('name'),
  ])
  if (membershipsRes.error) { throw createError({ statusCode: 500, message: membershipsRes.error.message }) }
  if (communitiesRes.error) { throw createError({ statusCode: 500, message: communitiesRes.error.message }) }

  const allCommunities = communitiesRes.data ?? []
  const myIds = new Set((membershipsRes.data ?? []).map(m => m.community_id))
  const viewer: Viewer = {
    id: profile.id,
    isSiteAdmin: profile.role === 'admin',
    postsTo: new Set((membershipsRes.data ?? []).filter(m => COMMUNITY_POSTER_ROLES.includes(m.role)).map(m => m.community_id)),
  }
  const myCommunities = allCommunities
    .filter(c => myIds.has(c.id))
    .map(c => ({ id: c.id, name: c.name }))

  const { community_id: requested } = getQuery(event)
  const community = allCommunities.find(c => c.id === requested)
    ?? allCommunities.find(c => myIds.has(c.id))

  if (!community) {
    return { communities: myCommunities, community: null, stats: null, events: [], posts: [], topPlanters: [] }
  }

  const containing = [community.id, ...communityAncestors(allCommunities, community.id)]
  const inside = [community.id, ...communityDescendants(allCommunities, community.id)]

  const { data: memberRows, error: membersError } = await client
    .from('community_members')
    .select('profile_id')
    .in('community_id', inside)
  if (membersError) { throw createError({ statusCode: 500, message: membersError.message }) }
  const memberIds = [...new Set((memberRows ?? []).map(m => m.profile_id))]

  const announcements = `and(kind.eq.announcement,community_id.is.null),and(kind.eq.announcement,community_id.in.(${containing}))`
  const activity = [
    `and(kind.eq.activity,community_id.in.(${inside}))`,
    // Logs with no community still belong in the feeds of their planter's communities.
    ...(memberIds.length ? [`and(kind.eq.activity,community_id.is.null,author_id.in.(${memberIds}))`] : []),
  ]

  const [postsRes, eventsRes, statsRes] = await Promise.all([
    client
      .from('feed_posts')
      .select(POST_COLUMNS)
      .or([announcements, ...activity].join(','))
      .order('created_at', { ascending: false })
      .limit(POST_LIMIT),
    client
      .from('feed_posts')
      .select(POST_COLUMNS)
      .eq('category', 'upcoming_events')
      .gte('event_at', new Date().toISOString())
      .or(announcements)
      .order('event_at', { ascending: true })
      .limit(EVENT_LIMIT),
    // Totals and top planters are added up in SQL: fetching every tree here
    // would be cut off at PostgREST's 1000-row limit.
    client.rpc('tree_stats', { p_community_ids: inside, p_top: TOP_PLANTER_LIMIT }),
  ])
  for (const res of [postsRes, eventsRes, statsRes]) {
    if (res.error) { throw createError({ statusCode: 500, message: res.error.message }) }
  }

  const stats = statsRes.data as {
    trees: number
    treesThisMonth: number
    co2KgPerYear: number
    topPlanters: { id: string, name: string, avatarUrl: string | null, trees: number }[]
  }

  return {
    communities: myCommunities,
    community: {
      id: community.id,
      name: community.name,
      description: community.description,
      isMember: myIds.has(community.id),
      canPost: viewer.isSiteAdmin || viewer.postsTo.has(community.id),
    },
    stats: {
      trees: Number(stats.trees),
      treesThisMonth: Number(stats.treesThisMonth),
      members: memberIds.length,
      co2KgPerYear: Number(stats.co2KgPerYear),
    },
    events: ((eventsRes.data ?? []) as unknown as PostRow[]).map(row => toPost(row, viewer)),
    posts: ((postsRes.data ?? []) as unknown as PostRow[]).map(row => toPost(row, viewer)),
    topPlanters: stats.topPlanters.map(p => ({ name: p.name, avatarUrl: p.avatarUrl, trees: Number(p.trees) })),
  }
})
