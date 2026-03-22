export default defineEventHandler(async (event) => {
  const payload = await getPayloadClient()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing page id' })
  }

  const result = await payload.update({
    collection: 'pages',
    id,
    data: body,
  })

  return result
})
