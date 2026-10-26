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

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: integrationsApi.disconnectWhatsApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsappPreferences }),
  })
}

// ---------------------------------------------------------------------------
// Google Calendar
// ---------------------------------------------------------------------------

export function useGoogleCalendarStatus() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.googleCalendarStatus,
    queryFn: integrationsApi.fetchGoogleCalendarStatus,
    enabled: Boolean(backendSessionToken),
  })
}

/**
 * Starts the OAuth dance by sending the browser to Google's consent screen.
 *
 * A full-page redirect rather than a popup: the backend's callback answers with
 * a 302 back to the integrations page, which a popup could not hand back to the
 * opener without extra postMessage plumbing.
 */
export function useConnectGoogleCalendar() {
  return useMutation({
    mutationFn: async () => {
      const url = await integrationsApi.fetchGoogleCalendarAuthUrl()
      window.location.assign(url)
    },
  })
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: integrationsApi.disconnectGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.googleCalendarStatus })
      // Events pulled from Google are no longer ours to show.
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings })
    },
  })
}

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: integrationsApi.syncGoogleCalendar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
  })
}

// ---------------------------------------------------------------------------
// Third-party connections
// ---------------------------------------------------------------------------

export function useConnections() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.integrationConnections,
    queryFn: integrationsApi.fetchConnections,
    enabled: Boolean(backendSessionToken),
  })
}

export function useConnection(provider: string) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.integrationConnection(provider),
    queryFn: () => integrationsApi.fetchConnection(provider),
    enabled: Boolean(backendSessionToken) && Boolean(provider),
  })
}

/**
 * Sends the browser to the vendor's sign-in page.
 *
 * A full-page navigation rather than a popup: the vendor redirects back to the
 * backend, which 302s to this provider's settings page, and a popup could not
 * hand that outcome to the opener without extra postMessage plumbing.
 */
export function useStartConnection() {
  return useMutation({
    mutationFn: async (provider: string) => {
      const url = await integrationsApi.startConnection(provider)
      window.location.assign(url)
    },
  })
}

export function useSaveConnectionCredentials(provider: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: Record<string, string>) =>
      integrationsApi.saveConnectionCredentials(provider, credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections })
    },
  })
}

export function useDisconnectConnection(provider: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => integrationsApi.disconnectConnection(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections })
    },
  })
}

/**
 * Reads a resource from a connected provider.
 *
 * Deliberately generic: every provider is reached the same way, so a feature
 * that needs Gmail messages or Slack channels does not need its own hook.
 */
export function useProviderData<T>(
  provider: string,
  resource: string,
  params: Record<string, string | number> = {},
  options: { enabled?: boolean } = {},
) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: ['providerData', provider, resource, params],
    queryFn: () => integrationsApi.readProviderData<T>(provider, resource, params),
    enabled: Boolean(backendSessionToken) && Boolean(provider) && (options.enabled ?? true),
  })
}

/** Writes to a connected provider — sending a mail, posting a message, uploading a file. */
export function useWriteProviderData<T>(provider: string, resource: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: unknown) => integrationsApi.writeProviderData<T>(provider, resource, body),
    onSuccess: () => {
      // A write usually changes what a read of the same resource returns.
      queryClient.invalidateQueries({ queryKey: ['providerData', provider, resource] })
    },
  })
}

// ---------------------------------------------------------------------------
// Project source links, and the sync they drive
// ---------------------------------------------------------------------------

export function useProjectSourceLinks(projectId: string | undefined) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.projectSourceLinks(projectId ?? ''),
    queryFn: () => integrationsApi.fetchProjectLinks(projectId as string),
    enabled: Boolean(backendSessionToken) && Boolean(projectId),
  })
}

export function useCreateProjectLink(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      provider: string
      sourceKind: string
      sourceId: string
      sourceLabel?: string | null
    }) => integrationsApi.createProjectLink(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectSourceLinks(projectId) })
    },
  })
}

export function useDeleteProjectLink(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (linkId: string) => integrationsApi.deleteProjectLink(projectId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectSourceLinks(projectId) })
    },
  })
}

/**
 * Pulls now.
 *
 * Invalidates broadly on purpose: a pull can write emails, calendar events,
 * notes and contacts in one run, and which of those it touched is not known
 * until it returns.
 */
export function useRunProviderSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: string) => integrationsApi.runProviderSync(provider),
    onSuccess: () => {
      for (const key of [
        queryKeys.emails,
        queryKeys.meetings,
        queryKeys.notes,
        queryKeys.contacts,
        queryKeys.syncSkips,
        queryKeys.syncState,
      ]) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export function useSyncSkips(limit = 50) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: [...queryKeys.syncSkips, limit],
    queryFn: () => integrationsApi.fetchSyncSkips(limit),
    enabled: Boolean(backendSessionToken),
  })
}

export function useSyncState() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.syncState,
    queryFn: integrationsApi.fetchSyncState,
    enabled: Boolean(backendSessionToken),
  })
}

export function useWebhookEndpoints() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.webhookEndpoints,
    queryFn: integrationsApi.fetchWebhookEndpoints,
    enabled: Boolean(backendSessionToken),
  })
}

export function useSubscribeToProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: string) => integrationsApi.subscribeToProvider(provider),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.syncState }),
  })
}

export function useUnsubscribeFromProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: string) => integrationsApi.unsubscribeFromProvider(provider),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.syncState }),
  })
}
