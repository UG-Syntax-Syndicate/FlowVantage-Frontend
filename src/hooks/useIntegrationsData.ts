import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as integrationsApi from '../api/integrationsApi'
import { useAuth } from './useAuth'
import type { WhatsAppEvent } from '../types/integrations'

/**
 * WhatsApp preferences are per user, not per workspace: a phone number belongs
 * to a person, and someone in two organisations does not want two numbers. So
 * unlike inventory, none of these keys carry a workspace id.
 */
export function useWhatsAppPreferences() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.whatsappPreferences,
    queryFn: integrationsApi.fetchWhatsAppPreferences,
    enabled: Boolean(backendSessionToken),
  })
}

export function useStartWhatsAppVerification() {
  return useMutation({
    mutationFn: (phone: string) => integrationsApi.startWhatsAppVerification(phone),
  })
}

export function useConfirmWhatsAppVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => integrationsApi.confirmWhatsAppVerification(code),
    // Confirming also enables notifications server-side, so the cached
    // preferences are stale in two ways at once.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsappPreferences }),
  })
}

export function useUpdateWhatsAppPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: { enabled?: boolean; events?: WhatsAppEvent[] }) =>
      integrationsApi.updateWhatsAppPreferences(updates),
    // The server returns the authoritative row, so seed the cache with it
    // rather than refetching what we were just handed.
    onSuccess: (preferences) => queryClient.setQueryData(queryKeys.whatsappPreferences, preferences),
  })
}

export function useProjectWhatsAppGroup(projectId: string | null) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.projectWhatsappGroup(projectId ?? 'none'),
    queryFn: () => integrationsApi.fetchProjectWhatsAppGroup(projectId as string),
    enabled: Boolean(backendSessionToken) && Boolean(projectId),
  })
}

export function useLinkProjectWhatsAppGroup(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { groupId: string; inviteLink?: string }) =>
      integrationsApi.linkProjectWhatsAppGroup(projectId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectWhatsappGroup(projectId) }),
  })
}

export function useProjectNotifications(projectId: string | null) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.projectNotifications(projectId ?? 'none'),
    queryFn: () => integrationsApi.fetchProjectNotifications(projectId as string),
    enabled: Boolean(backendSessionToken) && Boolean(projectId),
    // The outbox drains on a worker tick, so a row sitting at "pending" will
    // change without anything in the UI causing it.
    refetchInterval: 15_000,
  })
}
