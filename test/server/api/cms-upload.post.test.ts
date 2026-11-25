import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/cms/upload.post'
import { captureError, createTestEvent, setMultipartFormData } from '../../helpers/nitro'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const JPEG = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10])
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')

const requireAdmin = vi.fn()

function getPublicUrl(path: string) {
  return { data: { publicUrl: `https://cdn.example/cms-images/${path}` } }
}

function withStorage() {
  const uploads: Array<{ path: string, options: unknown }> = []
  const upload = vi.fn(async (path: string, _data: unknown, options: unknown) => {
    uploads.push({ path, options })
    return { data: {}, error: null }
  })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue({ storage: { from: () => ({ upload, getPublicUrl }), createBucket: vi.fn() } } as never)
  return uploads
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  requireAdmin.mockReset().mockResolvedValue({})
  Object.assign(globalThis, { requireAdmin })
})

describe('POST /api/cms/upload', () => {
  it('stores an image under the type its bytes show, not the type the browser sent', async () => {
    const uploads = withStorage()
    setMultipartFormData([{ name: 'files', filename: 'photo.svg', type: 'image/svg+xml', data: JPEG }])

    const result = await handler(createTestEvent())

    expect(uploads[0]!.path).toMatch(/^[0-9a-f-]{36}\.jpg$/)
    expect(uploads[0]!.options).toMatchObject({ contentType: 'image/jpeg' })
    expect(result.data[0]).toContain(uploads[0]!.path)
  })

  it('refuses an SVG that claims to be an image, and uploads nothing from the batch', async () => {
    const uploads = withStorage()
    setMultipartFormData([
      { name: 'files', filename: 'ok.jpg', type: 'image/jpeg', data: JPEG },
      { name: 'files', filename: 'evil.png', type: 'image/png', data: SVG },
    ])

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(uploads).toHaveLength(0)
  })

  it('needs an admin', async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    const uploads = withStorage()
    setMultipartFormData([{ name: 'files', filename: 'ok.jpg', type: 'image/jpeg', data: JPEG }])

    expect((await captureError(() => handler(createTestEvent()))).statusCode).toBe(403)
    expect(uploads).toHaveLength(0)
  })
})
