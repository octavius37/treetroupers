/** The size that fits `width` × `height` within `maxEdge` on its longer side, keeping the aspect ratio. Never upscales. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number, height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Re-encodes a photo as a JPEG at most `maxEdge` pixels on its longer side.
 * Phone photos are often 4–10 MB, over the 4 MB the upload endpoint accepts;
 * at 2048 px they come out well under 1 MB. Re-encoding also drops EXIF data,
 * including the camera's GPS position.
 *
 * Returns the original file if the browser cannot decode or re-encode it, and
 * leaves the server to accept or reject it.
 */
export async function downscaleImage(file: File, maxEdge = 2048): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  }
  catch {
    return file
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context?.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  if (!context) { return file }

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) { return file }

  return new File([blob], `${file.name.replace(/\.[^.]*$/, '')}.jpg`, { type: 'image/jpeg' })
}
