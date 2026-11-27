import {
  getJson,
  patchJson,
  deleteJson,
  postJsonAuthed,
} from '../../lib/backendApi'
import { GRADIENT_PALETTE, PROJECT_COLOR_PALETTE, pickProjectColorIndex } from '../../lib/constants'
import type {
  CreateProjectInput,
  Project,
  ProjectStatus,
  UpdateProjectInput,
} from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { authToken, type ApiEnvelope } from '../../lib/authedRequest'

export interface ProjectRow {
  id: string
  name: string
  description: string | null
  client: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  tags: string[]
  tagline: string | null
  image: string | null
  color: string | null
  cover_gradient: string | null
  category: string | null
  folder_ids: string[]
  objectives: string[] | null
  owner_id: string
  priority: Project['priority']
  tracked_seconds: number
  memberIds: string[]
  workspace_id: string
  visibility: Project['visibility']
  created_at: string
}

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline || '',
    description: row.description || '',
    client: row.client || '',
    status: row.status,
    color: row.color || PROJECT_COLOR_PALETTE[0],
    image: row.image,
    coverGradient: row.cover_gradient || GRADIENT_PALETTE[0],
    tags: row.tags || [],
    category: row.category || 'General',
    folderIds: row.folder_ids || [],
    objectives: row.objectives || [],
    ownerId: row.owner_id,
    priority: row.priority,
    trackedSeconds: row.tracked_seconds ?? 0,
    memberIds: row.memberIds || [],
    workspaceId: row.workspace_id,
    visibility: row.visibility || 'private',
    startDate: row.start_date || row.created_at,
    dueDate: row.end_date || row.created_at,
    createdAt: row.created_at,
  }
}

/**
 * `workspaceId` scopes the list to one workspace. Omitting it returns every
 * project the caller can see, across all their workspaces - which is what this
 * always did, and why switching workspace in the UI did not re-scope the list.
 */
export async function fetchProjects(workspaceId?: string): Promise<Project[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<ProjectRow[]>>(`/projects${query}`, authToken())
  return data.map(mapProject)
}

export async function fetchProjectById(id: string): Promise<Project | undefined> {
  try {
    const { data } = await getJson<ApiEnvelope<ProjectRow>>(`/projects/${id}`, authToken())
    return mapProject(data)
  } catch {
    return undefined
  }
}

export async function createProject(input: CreateProjectInput, existingColors: string[] = []): Promise<Project> {
  const paletteIndex = pickProjectColorIndex(existingColors)
  const { data } = await postJsonAuthed<ApiEnvelope<ProjectRow>>(
    '/projects',
    {
      name: input.name,
      description: input.description,
      client: input.client,
      tagline: input.description.length > 0 ? input.description.slice(0, 60) : 'A new project',
      status: 'planning',
      color: PROJECT_COLOR_PALETTE[paletteIndex % PROJECT_COLOR_PALETTE.length],
      coverGradient: GRADIENT_PALETTE[paletteIndex % GRADIENT_PALETTE.length],
      category: 'General',
      priority: input.priority ?? 'medium',
      image: input.image,
      memberIds: input.memberIds,
      workspaceId: input.workspaceId,
      visibility: input.visibility,
      startDate: input.startDate,
      dueDate: input.dueDate,
    },
    authToken(),
  )
  emitProjectsChanged()
  return mapProject(data)
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  await patchJson(`/projects/${projectId}`, { status }, authToken())
  emitProjectsChanged()
}

export async function updateProjectImage(projectId: string, image: string | null): Promise<void> {
  await patchJson(`/projects/${projectId}`, { image }, authToken())
  emitProjectsChanged()
}

/**
 * General project edit. Only the fields present in `input` are sent, so the
 * backend keeps the rest untouched - the narrower updateProjectStatus /
 * updateProjectImage above stay as they are because their call sites only ever
 * change that one field.
 */
export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  const { data } = await patchJson<ApiEnvelope<ProjectRow>>(`/projects/${projectId}`, input, authToken())
  emitProjectsChanged()
  return mapProject(data)
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteJson(`/projects/${projectId}`, authToken())
  emitProjectsChanged()
}
