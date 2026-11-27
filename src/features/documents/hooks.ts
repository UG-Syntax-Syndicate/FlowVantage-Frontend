import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as documentsApi from './api'
import { useAuth } from '../../hooks/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'
import type { UploadDocumentInput } from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

export function useDocuments() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.documents, activeWorkspaceId],
    // An arrow function, not a bare reference: React Query calls queryFn with a
    // QueryFunctionContext, which would otherwise arrive as the workspaceId
    // argument and serialise into ?workspace_id=[object Object].
    queryFn: () => documentsApi.fetchDocuments(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: UploadDocumentInput) => documentsApi.uploadDocument(input),
    onSuccess: (document) => {
      recordAudit('create', 'document', document.id, { fileName: document.name })
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(documentId),
    onSuccess: (_data, documentId) => {
      recordAudit('delete', 'document', documentId)
      queryClient.invalidateQueries({ queryKey: queryKeys.documents })
    },
  })
}
