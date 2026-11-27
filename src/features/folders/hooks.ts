import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as foldersApi from './api'
import { useAuth } from '../../hooks/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'
import type { CreateFolderInput, UpdateFolderInput } from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

export function useFolders() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.folders, activeWorkspaceId],
    queryFn: () => foldersApi.fetchFolders(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: CreateFolderInput) => foldersApi.createFolder(input),
    onSuccess: (folder) => {
      recordAudit('create', 'folder', folder.id, { name: folder.name })
      queryClient.invalidateQueries({ queryKey: queryKeys.folders })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ folderId, input }: { folderId: string; input: UpdateFolderInput }) => foldersApi.updateFolder(folderId, input),
    onSuccess: (folder) => {
      recordAudit('update', 'folder', folder.id, { name: folder.name })
      queryClient.invalidateQueries({ queryKey: queryKeys.folders })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (folderId: string) => foldersApi.deleteFolder(folderId),
    onSuccess: (_data, folderId) => {
      recordAudit('delete', 'folder', folderId)
      queryClient.invalidateQueries({ queryKey: queryKeys.folders })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

/** Adds a project to one more folder (a project can be in several at once) - not a replace. */
export function useAttachProjectToFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, folderId }: { projectId: string; folderId: string }) =>
      foldersApi.attachProjectToFolder(projectId, folderId),
    onSuccess: (project, { folderId }) => {
      recordAudit('update', 'project', project.id, { attachedFolderId: folderId })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

export function useDetachProjectFromFolder() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, folderId }: { projectId: string; folderId: string }) =>
      foldersApi.detachProjectFromFolder(projectId, folderId),
    onSuccess: (project, { folderId }) => {
      recordAudit('update', 'project', project.id, { detachedFolderId: folderId })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}
