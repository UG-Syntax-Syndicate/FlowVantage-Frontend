import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as workspacesApi from '../api/workspacesApi'
import { useAuth } from './useAuth'
import type { CreateInviteInput, ProjectRole, WorkspaceRole } from '../types/workspace'

export function useWorkspaces() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: workspacesApi.fetchWorkspaces,
    enabled: Boolean(backendSessionToken),
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => workspacesApi.createOrganization(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })
}

export function useWorkspaceMembers(workspaceId: string | undefined) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.workspaceMembers(workspaceId ?? ''),
    queryFn: () => workspacesApi.fetchWorkspaceMembers(workspaceId as string),
    enabled: Boolean(backendSessionToken) && Boolean(workspaceId),
  })
}

export function useUpdateWorkspaceMemberRole(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: WorkspaceRole }) =>
      workspacesApi.updateWorkspaceMemberRole(workspaceId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(workspaceId) })
    },
  })
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => workspacesApi.removeWorkspaceMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(workspaceId) })
    },
  })
}

export function useProjectMembers(projectId: string | undefined) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.projectMembers(projectId ?? ''),
    queryFn: () => workspacesApi.fetchProjectMembers(projectId as string),
    enabled: Boolean(backendSessionToken) && Boolean(projectId),
  })
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      workspacesApi.addProjectMember(projectId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(projectId) })
    },
  })
}

export function useUpdateProjectMemberRole(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      workspacesApi.updateProjectMemberRole(projectId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(projectId) })
    },
  })
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => workspacesApi.removeProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(projectId) })
    },
  })
}

export function usePendingInvites(workspaceId: string | undefined) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.pendingInvites(workspaceId ?? ''),
    queryFn: () => workspacesApi.fetchPendingInvites(workspaceId as string),
    enabled: Boolean(backendSessionToken) && Boolean(workspaceId),
  })
}

export function useCreateInvite(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateInviteInput) => workspacesApi.createInvite(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingInvites(workspaceId) })
    },
  })
}

export function useRevokeInvite(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) => workspacesApi.revokeInvite(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingInvites(workspaceId) })
    },
  })
}

export function useAcceptInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => workspacesApi.acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
    },
  })
}
