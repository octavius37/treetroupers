export default defineEventHandler(async (event) => {
  const payload = await getPayloadClient()
  const query = getQuery(event)

  const depth = Number(query.depth) || 1
  const limit = Number(query.limit) || 10
  const page = Number(query.page) || 1

  const slug = query.where_slug as string | undefined

  const result = await payload.find({
    collection: 'pages',
    depth,
    limit,
    page,
    ...(slug ? { where: { slug: { equals: slug } } } : {}),
  })

  return result
})
