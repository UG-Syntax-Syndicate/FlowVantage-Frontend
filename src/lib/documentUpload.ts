import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'
import { extensionForImageType, IMAGE_PRESETS, optimizeImage } from './images'
import type { UploadDocumentInput } from '../types/project'

// Raster formats worth re-encoding. GIF (animation), SVG (vector) and already-
// compact WebP are left untouched so nothing is silently degraded.
const OPTIMIZABLE_IMAGE_TYPES = ['image/png', 'image/jpeg']

function extensionFromFileName(name: string): string {
  const match = /\.([^.]+)$/.exec(name)
  return match ? match[1] : 'bin'
}

/**
 * Turns a picked file into the shape the documents data layer stores. Image
 * attachments (PNG/JPEG) are downscaled and re-encoded to WebP first, so a
 * photo dropped in as a "document" is uploaded at a fraction of its original
 * size; everything else is passed through untouched. Bytes are uploaded
 * directly to Firebase Storage from the browser (the same pattern
 * AvatarUploader.tsx uses for avatars) — the backend only ever stores the
 * resulting metadata/URL, never the file itself.
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

  const extension = extensionFromFileName(name)
  const storagePath = `documents/${projectId}/${crypto.randomUUID()}.${extension}`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, blob, { contentType: mimeType })
  const url = await getDownloadURL(storageRef)

  return { projectId, name, mimeType, url, storagePath, size }
}
