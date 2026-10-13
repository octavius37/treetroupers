import type { VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PhotoUpload from '~/components/PhotoUpload.vue'

// downscaleImage has its own tests and needs a real canvas, which happy-dom
// lacks. Here it only has to hand back the file the component should send.
const { downscaleImage } = vi.hoisted(() => ({ downscaleImage: vi.fn() }))
mockNuxtImport('downscaleImage', () => downscaleImage)

const PHOTO_URL = 'http://127.0.0.1:54421/storage/v1/object/public/tree-photos/u/photo.jpg'

// What the endpoint was sent, and a gate that holds its response until the
// test releases it, so the in-flight state can be observed. $fetch is stubbed
// rather than served by registerEndpoint, which does not pass FormData bodies
// through (the handler receives the string "[object Object]").
let received: Array<{ url: string, filename: string, data: string }> = []
let release: () => void = () => {}
let gate: Promise<void> = Promise.resolve()

async function fakeFetch(url: string, options: { method: string, body: FormData }) {
  const file = options.body.get('file') as File
  received.push({ url: `${options.method} ${url}`, filename: file.name, data: await file.text() })
  await gate
  return { url: PHOTO_URL }
}

async function pick(wrapper: VueWrapper, file: File) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

describe('PhotoUpload', () => {
  beforeEach(() => {
    received = []
    gate = Promise.resolve()
    downscaleImage.mockReset().mockImplementation(async (file: File) => file)
    vi.stubGlobal('$fetch', vi.fn(fakeFetch))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports that it is uploading until the server responds', async () => {
    // The forms disable submit on this. Without it, submitting mid-upload saved
    // the tree with no photo.
    gate = new Promise((resolve) => {
      release = resolve
    })
    const wrapper = await mountSuspended(PhotoUpload, { props: { modelValue: null, label: 'Photo' } })

    await pick(wrapper, new File(['jpeg'], 'IMG_0001.jpg', { type: 'image/jpeg' }))
    await vi.waitFor(() => expect(received).toHaveLength(1))

    expect(wrapper.emitted('update:uploading')).toEqual([[true]])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    release()
    await vi.waitFor(() => expect(wrapper.emitted('update:uploading')).toEqual([[true], [false]]))
    expect(wrapper.emitted('update:modelValue')).toEqual([[PHOTO_URL]])
  })

  it('sends the downscaled photo, not the original', async () => {
    downscaleImage.mockResolvedValue(new File(['small jpeg'], 'IMG_0001.jpg', { type: 'image/jpeg' }))
    const wrapper = await mountSuspended(PhotoUpload, { props: { modelValue: null, label: 'Photo' } })

    await pick(wrapper, new File(['a much larger original photo'], 'IMG_0001.HEIC', { type: 'image/heic' }))
    await vi.waitFor(() => expect(wrapper.emitted('update:modelValue')).toEqual([[PHOTO_URL]]))

    expect(received).toEqual([
      { url: 'POST /api/dashboard/tree-photo', filename: 'IMG_0001.jpg', data: 'small jpeg' },
    ])
  })

  it('refuses a photo still over 4 MB after downscaling, without sending it', async () => {
    // A browser that cannot decode the photo hands back the original. Sending it
    // would only get Vercel's 413 in place of a readable message.
    const wrapper = await mountSuspended(PhotoUpload, { props: { modelValue: null, label: 'Photo' } })

    await pick(wrapper, new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'IMG_0001.HEIC', { type: 'image/heic' }))
    await flushPromises()

    expect(received).toEqual([])
    expect(wrapper.text()).toContain('4 MB')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
