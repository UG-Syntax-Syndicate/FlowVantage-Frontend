export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024 // 5MB — also keeps the mock store's data-URL
// strings from growing unbounded, since projects are held in memory (and would matter more if a
// future change adds localStorage persistence on top of this in-memory mock).
export const IMAGE_UPLOAD_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image'))
    image.src = src
  })
}

/**
 * Converts an uploaded image to a WebP data URL. If it's already WebP, it's just read as-is.
 * Otherwise it's drawn to an offscreen canvas and re-encoded as WebP; if the browser can't
 * encode WebP (some silently fall back to PNG) or anything else goes wrong, this degrades
 * gracefully to the original file's data URL rather than failing the upload.
 *
 * Note: for animated GIFs, only the first frame survives the canvas round-trip — an accepted
 * tradeoff since this is meant for static cover banners, not animated ones.
 */
export async function convertImageToWebp(file: File, quality = 0.85): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file)
  if (file.type === 'image/webp') return dataUrl

  try {
    const image = await loadImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl

    ctx.drawImage(image, 0, 0)
    const webpDataUrl = canvas.toDataURL('image/webp', quality)
    return webpDataUrl.startsWith('data:image/webp') ? webpDataUrl : dataUrl
  } catch {
    return dataUrl
  }
}
