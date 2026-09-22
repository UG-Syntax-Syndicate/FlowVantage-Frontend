import { postJsonAuthed } from './backendApi'
import { readBackendSessionToken } from './backendSession'

export type UploadPurpose = 'avatar' | 'project-cover' | 'document'

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  resourceType: string
}

interface UploadSignature {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

async function getUploadSignature(purpose: UploadPurpose, projectId?: string): Promise<UploadSignature> {
  const { data } = await postJsonAuthed<ApiEnvelope<UploadSignature>>('/uploads/sign', { purpose, projectId }, authToken())
  return data
}

/**
 * Uploads a blob straight to Cloudinary from the browser using a payload
 * the backend signs (POST /uploads/sign) - bytes never pass through our
 * server. The destination folder is derived server-side from `purpose`
 * (and `projectId` for covers/documents), never taken from the client.
 */
export async function uploadToCloudinary(
  blob: Blob,
  fileName: string,
  purpose: UploadPurpose,
  projectId?: string,
): Promise<CloudinaryUploadResult> {
  const { signature, timestamp, apiKey, cloudName, folder } = await getUploadSignature(purpose, projectId)

  const formData = new FormData()
  formData.append('file', blob, fileName)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Could not upload the image. Please try again.')
  }

  return { url: payload.secure_url, publicId: payload.public_id, resourceType: payload.resource_type }
}

/**
 * Best-effort delete of a previously uploaded asset (replacing an avatar or
 * cover, removing a document). Fire-and-forget, same as the Firebase
 * Storage cleanup this replaces - callers never surface failures to the user.
 */
export function destroyCloudinaryAsset(publicId: string, resourceType = 'image'): void {
  postJsonAuthed('/uploads/destroy', { publicId, resourceType }, authToken()).catch(() => {})
}

/** Recovers a Cloudinary publicId from a stored secure_url (e.g. to clean up a previous avatar/cover). */
export function extractCloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url) return null
  const match = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/.exec(url)
  return match ? match[1] : null
}
