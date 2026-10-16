import { serverSupabaseServiceRole } from '#supabase/server'

const BUCKET = 'avatars'
const MAX_FILE_SIZE = 4 * 1024 * 1024

// Uploads the caller's profile photo to avatars/<auth user id>/ and sets it as
// their avatar, removing the previous one. Same image checks as tree photos.
export default defineEventHandler(async (event) => {
  const { uid, profile } = await requireViewer(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.filename && part.data.length)
  if (!file) { throw createError({ statusCode: 400, message: 'No file uploaded' }) }
  const contentType = imageTypeOf(file.data)
  if (!contentType) { throw createError({ statusCode: 400, message: `${file.filename} is not a JPEG, PNG or WebP image` }) }
  if (file.data.length > MAX_FILE_SIZE) { throw createError({ statusCode: 400, message: `${file.filename} exceeds the 4MB limit` }) }

  const client = serverSupabaseServiceRole(event)
  const path = `${uid}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`
  const options = { contentType, cacheControl: '31536000' }

  let { error } = await client.storage.from(BUCKET).upload(path, file.data, options)
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
  if (error) { throw createError({ statusCode: 500, message: `Upload failed: ${error.message}` }) }

  const url = client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { error: updateError } = await client.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
  if (updateError) { throw createError({ statusCode: 500, message: updateError.message }) }

  // Best effort: remove the photos this one replaces.
  const { data: files } = await client.storage.from(BUCKET).list(uid)
  const old = (files ?? []).map(f => `${uid}/${f.name}`).filter(p => p !== path)
  if (old.length) { await client.storage.from(BUCKET).remove(old) }

  return { url }
})
