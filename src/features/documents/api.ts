import { getJson, deleteJson, postJsonAuthed } from '../../lib/backendApi'
import type { ProjectDocument, UploadDocumentInput } from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { destroyCloudinaryAsset } from '../../lib/cloudinaryUpload'
import { authToken, type ApiEnvelope } from '../../lib/authedRequest'

/**
 * Document metadata only: the bytes already live in storage by the time
 * uploadDocument is called (see src/lib/documentUpload.ts).
 */

interface DocumentRow {
  id: string
  project_id: string
  name: string
  mime_type: string
  url: string
  storage_path: string
  size: number
  created_at: string
}

function mapDocument(row: DocumentRow): ProjectDocument {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    mimeType: row.mime_type,
    url: row.url,
    storagePath: row.storage_path,
    size: row.size,
    uploadedAt: row.created_at,
  }
}

export async function fetchDocuments(workspaceId?: string): Promise<ProjectDocument[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<DocumentRow[]>>(`/documents${query}`, authToken())
  return data.map(mapDocument)
}

export async function uploadDocument(input: UploadDocumentInput): Promise<ProjectDocument> {
  const { data } = await postJsonAuthed<ApiEnvelope<DocumentRow>>('/documents', input, authToken())
  emitProjectsChanged()
  return mapDocument(data)
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { data } = await deleteJson<ApiEnvelope<{ id: string; storagePath: string }>>(
    `/documents/${documentId}`,
    authToken(),
  )
  emitProjectsChanged()
  // Best-effort cleanup of the underlying Cloudinary asset, same pattern as
  // AvatarUploader.tsx - the backend only ever tracked the metadata row.
  // storagePath is "<resourceType>:<publicId>" (see documentUpload.ts).
  const [resourceType, publicId] = data.storagePath?.split(':') ?? []
  if (publicId) {
    destroyCloudinaryAsset(publicId, resourceType)
  }
}
