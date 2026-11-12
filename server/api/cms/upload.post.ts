import { serverSupabaseServiceRole } from '#supabase/server'

const BUCKET = 'cms-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  const files = parts?.filter(part => part.filename && part.data.length) ?? []
  if (!files.length) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  // Identify every file from its first bytes before uploading any, as the tree
  // photo upload does. The browser's type and filename are client-controlled,
  // and the bucket is public: trusting them would let anyone with an admin
  // session host an SVG with a script in it, or any other file, here.
  const checked = files.map((file) => {
    const contentType = imageTypeOf(file.data)
    if (!contentType) {
      throw createError({ statusCode: 400, message: `${file.filename} is not a JPEG, PNG or WebP image` })
    }
    if (file.data.length > MAX_FILE_SIZE) {
      throw createError({ statusCode: 400, message: `${file.filename} exceeds the 5MB limit` })
    }
    return { data: file.data, contentType }
  })

  const client = serverSupabaseServiceRole(event)

  const uploadFile = async (file: typeof checked[number]) => {
    const path = `${crypto.randomUUID()}.${IMAGE_EXTENSIONS[file.contentType]}`
    const options = { contentType: file.contentType, cacheControl: '31536000' }

    let { error } = await client.storage.from(BUCKET).upload(path, file.data, options)

    // First upload ever — the bucket doesn't exist yet in this Supabase
    // project. Create it (public, so published pages can serve the images
    // directly) and retry once.
    if (error && /bucket not found/i.test(error.message)) {
      const { error: bucketError } = await client.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: Object.keys(IMAGE_EXTENSIONS),
      })
      if (bucketError && !/already exists/i.test(bucketError.message)) {
        throw createError({ statusCode: 500, message: `Could not create storage bucket: ${bucketError.message}` })
      }
      ;({ error } = await client.storage.from(BUCKET).upload(path, file.data, options))
    }

    if (error) {
      throw createError({ statusCode: 500, message: `Upload failed: ${error.message}` })
    }

    return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  const urls = await Promise.all(checked.map(uploadFile))

  // GrapesJS's default asset manager reads the uploaded asset URLs from `data`.
  return { data: urls }
})
