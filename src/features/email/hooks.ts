import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as emailApi from './api'
import { useAuth } from '../../hooks/useAuth'
import type { ComposeEmailInput, EmailFolder } from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

export function useEmails() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.emails,
    queryFn: emailApi.fetchEmails,
    enabled: Boolean(backendSessionToken),
  })
}

export function useToggleEmailStar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (emailId: string) => emailApi.toggleEmailStar(emailId),
    onMutate: async (emailId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.emails })
      const previousEmails = queryClient.getQueryData(queryKeys.emails)
      queryClient.setQueryData(queryKeys.emails, (old: Awaited<ReturnType<typeof emailApi.fetchEmails>> = []) =>
        old.map((email) => (email.id === emailId ? { ...email, starred: !email.starred } : email)),
      )
      return { previousEmails }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(queryKeys.emails, context.previousEmails)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

export function useMarkEmailsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (emailIds: string[]) => emailApi.markEmailsRead(emailIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

export function useMoveEmailsToFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ emailIds, folder }: { emailIds: string[]; folder: EmailFolder }) =>
      emailApi.moveEmailsToFolder(emailIds, folder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

/**
 * Where a send would go from. Cached like any other read, and cheap - the
 * composer opens far more often than a mailbox is connected or disconnected.
 */
export function useEmailSender() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.emailSender,
    queryFn: emailApi.fetchEmailSender,
    enabled: Boolean(backendSessionToken),
  })
}

/**
 * Sends, rather than filing a draft.
 *
 * Invalidates the email list because the server files a copy in `sent`, and
 * that copy is the only record the user has that the message left.
 */
export function useSendEmail() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: ComposeEmailInput & { contactId?: string | null; projectId?: string | null }) =>
      emailApi.sendEmail(input),
    onSuccess: (email) => {
      recordAudit('create', 'email', email.id, { sent: true })
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}

export function useComposeEmail() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: ComposeEmailInput) => emailApi.composeEmail(input),
    onSuccess: (email) => {
      recordAudit('create', 'email', email.id, { subject: email.subject })
      queryClient.invalidateQueries({ queryKey: queryKeys.emails })
    },
  })
}
