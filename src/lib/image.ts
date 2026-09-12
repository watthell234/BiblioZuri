/**
 * Photos straight from a phone camera are 3-6 MB. We never upload those.
 * Each photo becomes a ~1200px cover (shown when the book is opened) and a
 * ~320px thumbnail (shown on the shelf), both JPEG.
 */

const COVER_MAX = 1200
const THUMB_MAX = 320

export type ProcessedPhoto = {
  cover: Blob
  thumb: Blob
  previewUrl: string
}

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fall through to the <img> path */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Could not read that image.'))
      img.src = url
    })
    return img
  } finally {
    // The bitmap has been decoded into the element by now.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

function scaleTo(width: number, height: number, max: number) {
  const longest = Math.max(width, height)
  if (longest <= max) return { width, height }
  const ratio = max / longest
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

function encode(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  max: number,
  quality: number,
): Promise<Blob> {
  const { width, height } = scaleTo(sourceWidth, sourceHeight, max)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot process images.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not save that image.'))),
      'image/jpeg',
      quality,
    )
  })
}

export async function processPhoto(file: Blob): Promise<ProcessedPhoto> {
  const bitmap = await loadBitmap(file)
  const width = 'width' in bitmap ? bitmap.width : 0
  const height = 'height' in bitmap ? bitmap.height : 0
  const cover = await encode(bitmap, width, height, COVER_MAX, 0.82)
  const thumb = await encode(bitmap, width, height, THUMB_MAX, 0.75)
  if ('close' in bitmap) bitmap.close()
  return { cover, thumb, previewUrl: URL.createObjectURL(thumb) }
}
