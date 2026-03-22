export default defineEventHandler(async (event) => {
  const payload = await getPayloadClient()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing page id' })
  }

  const result = await payload.delete({
    collection: 'pages',
    id,
  })

  return result
})
