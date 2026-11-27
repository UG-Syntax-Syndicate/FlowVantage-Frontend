import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as contactsApi from './api'
import { useAuth } from '../../hooks/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'
import type { ContactInput } from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

export function useContacts() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.contacts, activeWorkspaceId],
    queryFn: () => contactsApi.fetchContacts(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: ContactInput) => contactsApi.createContact(input),
    onSuccess: (contact) => {
      recordAudit('create', 'contact', contact.id, { name: contact.contactName })
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ contactId, input }: { contactId: string; input: ContactInput }) =>
      contactsApi.updateContact(contactId, input),
    onSuccess: (_data, { contactId }) => {
      recordAudit('update', 'contact', contactId)
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (contactId: string) => contactsApi.deleteContact(contactId),
    onSuccess: (_data, contactId) => {
      recordAudit('delete', 'contact', contactId)
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useBulkDeleteContacts() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (contactIds: string[]) => contactsApi.bulkDeleteContacts(contactIds),
    onSuccess: (result, contactIds) => {
      recordAudit('delete', 'contact', undefined, { count: result.deleted, requested: contactIds.length })
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}

export function useBulkImportContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      workspaceId,
      contacts,
      onProgress,
      allowDuplicates,
    }: {
      workspaceId: string | undefined
      contacts: ContactInput[]
      onProgress?: (done: number, total: number) => void
      /** Import rows duplicate detection flags anyway (US-C1's "continue as a new contact"). */
      allowDuplicates?: boolean
    }) => contactsApi.bulkImportContactsChunked(workspaceId, contacts, onProgress, allowDuplicates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
    },
  })
}
