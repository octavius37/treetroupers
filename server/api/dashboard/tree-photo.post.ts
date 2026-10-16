import { serverSupabaseServiceRole } from '#supabase/server'

const BUCKET = 'tree-photos'
// Vercel caps function request bodies at 4.5 MB, multipart envelope included,
// so anything much over 4 MB would be refused with a 413 before reaching here.
// PhotoUpload downscales photos well below this before sending them.
const MAX_FILE_SIZE = 4 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const uid = await authUserId(event)
  if (!uid) { throw createError({ statusCode: 401, message: 'Unauthorized' }) }

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.filename && part.data.length)
  if (!file) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }
  const contentType = imageTypeOf(file.data)
  if (!contentType) {
    throw createError({ statusCode: 400, message: `${file.filename} is not a JPEG, PNG or WebP image` })
  }
  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, message: `${file.filename} exceeds the 4MB limit` })
  }

  const client = serverSupabaseServiceRole(event)

  const path = `${uid}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`
  const options = { contentType, cacheControl: '31536000' }

  let { error } = await client.storage.from(BUCKET).upload(path, file.data, options)

  // First upload ever — the bucket doesn't exist yet in this Supabase project.
  // Create it (public, so planted/donated/earned photos can be served directly)
  // and retry once. Storage enforces the type list too, as a second check.
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

  return { url: client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
})
