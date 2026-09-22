import { getJson, patchJson, deleteJson, postJsonAuthed } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import { pickAvatar } from '../lib/avatars'
import type {
  CreateInviteInput,
  Invitation,
  ProjectMember,
  ProjectRole,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from '../types/workspace'

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

interface WorkspaceRow {
  id: string
  name: string
  is_personal: boolean
  created_at: string
  member_role?: WorkspaceRole
  memberRole?: WorkspaceRole
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    isPersonal: row.is_personal,
    memberRole: row.memberRole ?? row.member_role ?? 'member',
    createdAt: row.created_at,
  }
}

interface WorkspaceMemberRow {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  display_name: string
  email: string
  avatar_url: string | null
  joined_at: string
}

function mapWorkspaceMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    name: row.display_name,
    email: row.email,
    photoURL: row.avatar_url || pickAvatar(row.email || row.user_id),
    joinedAt: row.joined_at,
  }
}

interface ProjectMemberRow {
  project_id: string
  user_id: string
  role: ProjectRole
  display_name: string
  email: string
  avatar_url: string | null
  joined_at: string
}

function mapProjectMember(row: ProjectMemberRow): ProjectMember {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    name: row.display_name,
    email: row.email,
    photoURL: row.avatar_url || pickAvatar(row.email || row.user_id),
    joinedAt: row.joined_at,
  }
}

interface InvitationRow {
  id: string
  workspace_id: string
  project_id: string | null
  email: string
  workspace_role: WorkspaceRole
  project_role: ProjectRole | null
  token: string
  status: Invitation['status']
  expires_at: string
  created_at: string
}

function mapInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    email: row.email,
    workspaceRole: row.workspace_role,
    projectRole: row.project_role,
    token: row.token,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const { data } = await getJson<ApiEnvelope<WorkspaceRow[]>>('/workspaces', authToken())
  return data.map(mapWorkspace)
}

export async function createOrganization(name: string): Promise<Workspace> {
  const { data } = await postJsonAuthed<ApiEnvelope<WorkspaceRow>>('/workspaces', { name }, authToken())
  return mapWorkspace(data)
}

export async function fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data } = await getJson<ApiEnvelope<WorkspaceMemberRow[]>>(`/workspaces/${workspaceId}/members`, authToken())
  return data.map(mapWorkspaceMember)
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<void> {
  await patchJson(`/workspaces/${workspaceId}/members/${userId}`, { role }, authToken())
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  await deleteJson(`/workspaces/${workspaceId}/members/${userId}`, authToken())
}

// ---------------------------------------------------------------------------
// Project members
// ---------------------------------------------------------------------------

export async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data } = await getJson<ApiEnvelope<ProjectMemberRow[]>>(`/projects/${projectId}/members`, authToken())
  return data.map(mapProjectMember)
}

export async function addProjectMember(projectId: string, userId: string, role: ProjectRole): Promise<void> {
  await postJsonAuthed(`/projects/${projectId}/members`, { userId, role }, authToken())
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<void> {
  await patchJson(`/projects/${projectId}/members/${userId}`, { role }, authToken())
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await deleteJson(`/projects/${projectId}/members/${userId}`, authToken())
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export async function fetchPendingInvites(workspaceId: string): Promise<Invitation[]> {
  const { data } = await getJson<ApiEnvelope<InvitationRow[]>>(
    `/invitations?workspaceId=${encodeURIComponent(workspaceId)}`,
    authToken(),
  )
  return data.map(mapInvitation)
}

export async function createInvite(input: CreateInviteInput): Promise<Invitation> {
  const { data } = await postJsonAuthed<ApiEnvelope<InvitationRow>>('/invitations', input, authToken())
  return mapInvitation(data)
}

export async function revokeInvite(invitationId: string): Promise<void> {
  await postJsonAuthed(`/invitations/${invitationId}/revoke`, {}, authToken())
}

export async function acceptInvite(token: string): Promise<Invitation> {
  const { data } = await postJsonAuthed<ApiEnvelope<InvitationRow>>(`/invitations/${token}/accept`, {}, authToken())
  return mapInvitation(data)
}
