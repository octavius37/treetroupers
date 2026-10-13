import type { MultiPartData } from 'h3'
import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/tree-photo.post'
import { captureError, createTestEvent, setMultipartFormData } from '../../helpers/nitro'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

// The first bytes of each format, written out by hand. The rest of the file is
// padding: the handler never decodes the image, it only identifies it.
const JPEG = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46])
const PNG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x24, 0x00, 0x00, 0x00]), Buffer.from('WEBPVP8 ')])
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')

const FOUR_MB = 4 * 1024 * 1024

function filePart(data: Buffer, overrides: Partial<MultiPartData> = {}): MultiPartData {
  return { name: 'file', filename: 'IMG_0001.jpg', type: 'image/jpeg', data, ...overrides }
}

function padded(header: Buffer, size: number) {
  return Buffer.concat([header, Buffer.alloc(size - header.length)])
}

function getPublicUrl(path: string) {
  return { data: { publicUrl: `http://127.0.0.1:54421/storage/v1/object/public/tree-photos/${path}` } }
}

/**
 * A double for the slice of the Storage API the handler uses. Each upload
 * resolves to the next queued result, so a test can make the first upload hit a
 * missing bucket and the retry succeed.
 */
function withStorage(uploadResults: Array<{ message: string } | null> = [null]) {
  const uploads: Array<{ bucket: string, path: string, options: unknown }> = []
  const results = [...uploadResults]

  const upload = vi.fn(async (path: string, _body: unknown, options: unknown) => {
    uploads.push({ bucket: 'tree-photos', path, options })
    const error = results.shift() ?? null
    return error
      ? { data: null, error }
      : { data: { id: 'object-1', path, fullPath: `tree-photos/${path}` }, error: null }
  })
  const createBucket = vi.fn(async (id: string) => ({ data: { name: id }, error: null }))

  const client = { storage: { from: () => ({ upload, getPublicUrl }), createBucket } }
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(client)
  return { uploads, createBucket }
}

describe('POST /api/dashboard/tree-photo', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    // Nitro auto-imports this from server/utils; it has its own unit tests.
    authUserId.mockReset().mockResolvedValue('auth-user-1')
    Object.assign(globalThis, { authUserId })
    setMultipartFormData([filePart(JPEG)])
  })

  it('throws 401 without an authenticated user, before uploading anything', async () => {
    authUserId.mockResolvedValue(null)
    const storage = withStorage()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(storage.uploads).toHaveLength(0)
  })

  it('throws 400 when the request has no file', async () => {
    setMultipartFormData([{ name: 'note', data: Buffer.from('hello') }])
    const storage = withStorage()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(storage.uploads).toHaveLength(0)
  })

  it.each([
    ['JPEG', JPEG, 'jpg', 'image/jpeg'],
    ['PNG', PNG, 'png', 'image/png'],
    ['WebP', WEBP, 'webp', 'image/webp'],
  ])('stores a %s under the type its bytes show, not the type the browser sent', async (_name, bytes, ext, contentType) => {
    // The browser-supplied type and filename are client-controlled, and a
    // filename like 'photo.jp#g' would otherwise end up in the public URL.
    setMultipartFormData([filePart(bytes, { filename: 'photo.jp#g', type: 'application/octet-stream' })])
    const storage = withStorage()

    await handler(createTestEvent())

    expect(storage.uploads).toHaveLength(1)
    expect(storage.uploads[0]!.path).toMatch(new RegExp(`^auth-user-1/[0-9a-f-]{36}\\.${ext}$`))
    expect(storage.uploads[0]!.options).toMatchObject({ contentType })
  })

  it('rejects an SVG, which can carry script', async () => {
    setMultipartFormData([filePart(SVG, { filename: 'tree.svg', type: 'image/svg+xml' })])
    const storage = withStorage()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(storage.uploads).toHaveLength(0)
  })

  it('rejects a file that claims to be an image but is not one', async () => {
    setMultipartFormData([filePart(Buffer.from('<html><body>hi</body></html>'), { type: 'image/png' })])
    const storage = withStorage()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(storage.uploads).toHaveLength(0)
  })

  it('accepts a photo of exactly 4 MB', async () => {
    setMultipartFormData([filePart(padded(JPEG, FOUR_MB))])
    const storage = withStorage()

    await handler(createTestEvent())

    expect(storage.uploads).toHaveLength(1)
  })

  it('rejects a photo over 4 MB, which Vercel would refuse with a 413 anyway', async () => {
    // Vercel caps function request bodies at 4.5 MB including the multipart
    // envelope. Rejecting at 4 MB keeps this error, not Vercel's, the one users see.
    setMultipartFormData([filePart(padded(JPEG, FOUR_MB + 1))])
    const storage = withStorage()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(storage.uploads).toHaveLength(0)
  })

  it('returns the public URL of the stored object', async () => {
    const storage = withStorage()

    const result = await handler(createTestEvent())

    expect(result).toEqual({
      url: `http://127.0.0.1:54421/storage/v1/object/public/tree-photos/${storage.uploads[0]!.path}`,
    })
  })

  it('creates the bucket restricted to the accepted types, then retries, when it does not exist yet', async () => {
    const storage = withStorage([{ message: 'Bucket not found' }, null])

    const result = await handler(createTestEvent())

    expect(storage.createBucket).toHaveBeenCalledWith('tree-photos', {
      public: true,
      fileSizeLimit: FOUR_MB,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    expect(storage.uploads).toHaveLength(2)
    expect(storage.uploads[1]!.path).toBe(storage.uploads[0]!.path)
    expect(result.url).toContain(storage.uploads[1]!.path)
  })

  it('throws 500 when the upload fails for another reason', async () => {
    const storage = withStorage([{ message: 'The resource already exists' }])

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(storage.createBucket).not.toHaveBeenCalled()
  })
})
