import { afterEach, describe, expect, it, vi } from 'vitest'
import { downscaleImage, fitWithin } from '~/utils/downscaleImage'

describe('fitWithin', () => {
  it.each([
    ['landscape', 4000, 3000, { width: 2048, height: 1536 }],
    ['portrait', 3000, 4000, { width: 1536, height: 2048 }],
    ['rounding', 4031, 3023, { width: 2048, height: 1536 }],
    ['already small (never upscales)', 800, 600, { width: 800, height: 600 }],
  ])('%s', (_name, width, height, expected) => {
    expect(fitWithin(width, height, 2048)).toEqual(expected)
  })
})

describe('downscaleImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the original file when the browser cannot decode it', async () => {
    // e.g. a HEIC photo in a browser other than Safari. The server then decides
    // whether it is acceptable.
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new DOMException('decode failed')))
    const file = new File(['not really an image'], 'IMG_0001.HEIC', { type: 'image/heic' })

    await expect(downscaleImage(file)).resolves.toBe(file)
  })

  it('redraws a large photo at the fitted size and returns it as a JPEG', async () => {
    const bitmap = { width: 4000, height: 3000, close: vi.fn() }
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
    // happy-dom has no 2D canvas, so stand in for the two calls that need one.
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never)
    let encoded: { width: number, height: number, type?: string } | undefined
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback, type) {
      encoded = { width: this.width, height: this.height, type }
      callback(new Blob(['jpeg bytes'], { type }))
    })

    const result = await downscaleImage(new File(['original'], 'IMG_0001.HEIC', { type: 'image/heic' }))

    expect(encoded).toEqual({ width: 2048, height: 1536, type: 'image/jpeg' })
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 2048, 1536)
    expect(result.type).toBe('image/jpeg')
    expect(result.name).toBe('IMG_0001.jpg')
    expect(await result.text()).toBe('jpeg bytes')
  })
})
