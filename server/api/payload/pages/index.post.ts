export default defineEventHandler(async (event) => {
  const payload = await getPayloadClient()
  const body = await readBody(event)

  const result = await payload.create({
    collection: 'pages',
    data: body,
  })

  return result
})
