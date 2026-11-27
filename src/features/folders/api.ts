import {
  getJson,
  patchJson,
  deleteJson,
  postJsonAuthed,
} from '../../lib/backendApi'
import type {
  CreateFolderInput,
  Folder,
  Project,
  UpdateFolderInput,
} from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { authToken, type ApiEnvelope } from '../../lib/authedRequest'
import { type ProjectRow, mapProject } from '../projects/api'

interface FolderRow {
  id: string
  name: string
  icon: Folder['icon']
  color: string | null
  workspace_id: string
  created_at: string
}

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color || '#94a3b8',
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
  }
}

export async function fetchFolders(workspaceId?: string): Promise<Folder[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<FolderRow[]>>(`/folders${query}`, authToken())
  return data.map(mapFolder)
}

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const { data } = await postJsonAuthed<ApiEnvelope<FolderRow>>('/folders', input, authToken())
  emitProjectsChanged()
  return mapFolder(data)
}

export async function updateFolder(folderId: string, input: UpdateFolderInput): Promise<Folder> {
  const { data } = await patchJson<ApiEnvelope<FolderRow>>(`/folders/${folderId}`, input, authToken())
  emitProjectsChanged()
  return mapFolder(data)
}

export async function deleteFolder(folderId: string): Promise<void> {
  await deleteJson(`/folders/${folderId}`, authToken())
  emitProjectsChanged()
}

export async function attachProjectToFolder(projectId: string, folderId: string): Promise<Project> {
  const { data } = await postJsonAuthed<ApiEnvelope<ProjectRow>>(`/projects/${projectId}/folders`, { folderId }, authToken())
  emitProjectsChanged()
  return mapProject(data)
}

export async function detachProjectFromFolder(projectId: string, folderId: string): Promise<Project> {
  const { data } = await deleteJson<ApiEnvelope<ProjectRow>>(`/projects/${projectId}/folders/${folderId}`, authToken())
  emitProjectsChanged()
  return mapProject(data)
}
