export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024 // 5MB ceiling on the *input* file
export const IMAGE_UPLOAD_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/** File extension (no dot) for a MIME type an OptimizedImage may carry. */
export function extensionForImageType(type: string): string {
  switch (type) {
    case 'image/webp':
      return 'webp'
    case 'image/png':
      return 'png'
    case 'image/gif':
      return 'gif'
    default:
      return 'jpg'
  }
}

/** Returns a user-facing error message, or null if the file is acceptable. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_UPLOAD_ALLOWED_TYPES.includes(file.type)) {
    return 'Please choose a PNG, JPEG, GIF, or WEBP image.'
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return 'Image must be smaller than 5MB.'
  }
  return null
}

/** Reads any Blob/File as a base64 data URL. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image'))
    image.src = src
  })
}

export interface OptimizeImageOptions {
  /** Longest edge of the output, in pixels. Larger images are downscaled to fit. */
  maxDimension: number
  /** WebP/JPEG encoder quality, 0–1. */
  quality: number
  /**
   * Skip re-encoding when the source is already a web-friendly format (webp/jpeg),
   * within `maxDimension`, and no larger than this many bytes.
   */
  skipUnderBytes?: number
}

/** Tuned budgets per surface — bytes/pixels the UI actually needs, not the source. */
export const IMAGE_PRESETS = {
  /** Project cover banners: rendered a few hundred px tall, full-bleed width. */
  cover: { maxDimension: 1600, quality: 0.82, skipUnderBytes: 120 * 1024 },
  /** Avatars: shown at ≤72px, retina-doubled headroom. */
  avatar: { maxDimension: 512, quality: 0.85, skipUnderBytes: 40 * 1024 },
  /** Images attached as project documents: previewed larger, still capped. */
  documentImage: { maxDimension: 2000, quality: 0.8, skipUnderBytes: 200 * 1024 },
} as const satisfies Record<string, OptimizeImageOptions>

export interface OptimizedImage {
  /** The bytes to upload/store. */
  blob: Blob
  /** Same content as `blob`, as a data URL (used by the in-memory data layer). */
  dataUrl: string
  width: number
  height: number
  bytes: number
  /** 'image/webp', or 'image/jpeg' where WebP encoding isn't available. */
  type: string
  /** false when the original was returned untouched (already small, or processing unavailable). */
  optimized: boolean
}

function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas === 'function') {
    try {
      return new OffscreenCanvas(width, height)
    } catch {
      // Some engines expose the constructor but throw — fall back to a DOM canvas.
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

async function encodeCanvas(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  if ('convertToBlob' in canvas) {
    try {
      return await canvas.convertToBlob({ type, quality })
    } catch {
      return null
    }
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // Animated/large/unsupported — fall through to the <img> path.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    return await loadImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function fittedSize(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height, scaled: false }
  const ratio = Math.min(max / width, max / height)
  return { width: Math.round(width * ratio), height: Math.round(height * ratio), scaled: true }
}

/**
 * Downscales an uploaded image to a sensible on-screen size and re-encodes it as
 * WebP (JPEG where the browser can't encode WebP), so what we store is the
 * smallest representation the UI actually needs. Returns both a `Blob` (for real
 * uploads) and a data URL (for the in-memory data layer).
 *
 * Degrades safely: if decoding/encoding isn't possible, or the "optimized"
 * output would be larger than the source, the original file is returned as-is.
 * Animated GIFs are flattened to their first frame — an accepted tradeoff for
 * the static banner/avatar surfaces this serves.
 */
export async function optimizeImage(file: File, options: OptimizeImageOptions): Promise<OptimizedImage> {
  const original = async (): Promise<OptimizedImage> => ({
    blob: file,
    dataUrl: await blobToDataUrl(file),
    width: 0,
    height: 0,
    bytes: file.size,
    type: file.type,
    optimized: false,
  })

  if (typeof document === 'undefined') return original()

  let source: ImageBitmap | HTMLImageElement
  try {
    source = await decodeImage(file)
  } catch {
    return original()
  }

  const srcWidth = 'naturalWidth' in source ? source.naturalWidth : source.width
  const srcHeight = 'naturalHeight' in source ? source.naturalHeight : source.height
  const { width, height, scaled } = fittedSize(srcWidth, srcHeight, options.maxDimension)

  const alreadyWebFriendly = file.type === 'image/webp' || file.type === 'image/jpeg'
  if (
    !scaled &&
    alreadyWebFriendly &&
    options.skipUnderBytes !== undefined &&
    file.size <= options.skipUnderBytes
  ) {
    if ('close' in source) source.close()
    return {
      blob: file,
      dataUrl: await blobToDataUrl(file),
      width: srcWidth,
      height: srcHeight,
      bytes: file.size,
      type: file.type,
      optimized: false,
    }
  }

  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null
  if (!context) {
    if ('close' in source) source.close()
    return original()
  }

  context.drawImage(source as CanvasImageSource, 0, 0, width, height)
  if ('close' in source) source.close()

  // PNG/GIF sources may carry transparency; JPEG can't encode alpha, so a
  // browser that can't encode WebP falls back to PNG (universally supported,
  // lossless) for those instead of silently flattening the alpha channel.
  const sourceMayHaveAlpha = file.type === 'image/png' || file.type === 'image/gif'

  let type = 'image/webp'
  let blob = await encodeCanvas(canvas, type, options.quality)
  if (!blob || blob.type !== 'image/webp') {
    type = sourceMayHaveAlpha ? 'image/png' : 'image/jpeg'
    blob = await encodeCanvas(canvas, type, options.quality)
  }
  if (!blob) return original()

  // If we didn't downscale and the re-encode came out larger, keep the original.
  if (blob.size >= file.size && !scaled) {
    return {
      blob: file,
      dataUrl: await blobToDataUrl(file),
      width: srcWidth,
      height: srcHeight,
      bytes: file.size,
      type: file.type,
      optimized: false,
    }
  }

  return {
    blob,
    dataUrl: await blobToDataUrl(blob),
    width,
    height,
    bytes: blob.size,
    type,
    optimized: true,
  }
}

/**
 * Optimizes an image and returns it as a data URL. Thin wrapper over
 * {@link optimizeImage} for the data-URL-based project/cover surfaces.
 */
export async function convertImageToWebp(
  file: File,
  options: OptimizeImageOptions = IMAGE_PRESETS.cover,
): Promise<string> {
  const result = await optimizeImage(file, options)
  return result.dataUrl
}
