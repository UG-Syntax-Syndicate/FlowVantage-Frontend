import { uploadToCloudinary } from './cloudinaryUpload'
import { extensionForImageType, IMAGE_PRESETS, optimizeImage } from './images'
import type { UploadDocumentInput } from '../types/project'

// Raster formats worth re-encoding. GIF (animation), SVG (vector) and already-
// compact WebP are left untouched so nothing is silently degraded.
const OPTIMIZABLE_IMAGE_TYPES = ['image/png', 'image/jpeg']

/**
 * Turns a picked file into the shape the documents data layer stores. Image
 * attachments (PNG/JPEG) are downscaled and re-encoded to WebP first, so a
 * photo dropped in as a "document" is uploaded at a fraction of its original
 * size; everything else is passed through untouched. Bytes are uploaded
 * directly to Cloudinary from the browser via a backend-signed request (the
 * same pattern AvatarUploader.tsx uses for avatars) — the backend only ever
 * stores the resulting metadata/URL, never the file itself. `storagePath`
 * encodes "<resourceType>:<publicId>" so a later delete knows what to pass
 * Cloudinary (see projectsApi.deleteDocument).
 */
export async function prepareDocumentUpload(
  file: File,
  projectId: string,
): Promise<UploadDocumentInput> {
  let name = file.name
  let mimeType = file.type || 'application/octet-stream'
  let blob: Blob = file
  let size = file.size

  if (OPTIMIZABLE_IMAGE_TYPES.includes(file.type)) {
    const optimized = await optimizeImage(file, IMAGE_PRESETS.documentImage)
    if (optimized.optimized) {
      name = file.name.replace(/\.[^.]+$/, '') + '.' + extensionForImageType(optimized.type)
    }
    mimeType = optimized.type
    blob = optimized.blob
    size = optimized.bytes
  }

  const { url, publicId, resourceType } = await uploadToCloudinary(blob, name, 'document', projectId)

  return { projectId, name, mimeType, url, storagePath: `${resourceType}:${publicId}`, size }
}
