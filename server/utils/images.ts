import { Buffer } from 'node:buffer'

export const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

export type ImageType = keyof typeof IMAGE_EXTENSIONS

// Identifies the image from its first bytes. The browser-supplied type and
// filename are both client-controlled, and the bucket is public, so trusting
// them would let anyone host an SVG with a script in it, or any other file, here.
export function imageTypeOf(data: Buffer): ImageType | null {
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) { return 'image/jpeg' }
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) { return 'image/png' }
  if (data.toString('latin1', 0, 4) === 'RIFF' && data.toString('latin1', 8, 12) === 'WEBP') { return 'image/webp' }
  return null
}
