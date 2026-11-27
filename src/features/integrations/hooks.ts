import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { queryKeys } from '../../lib/queryClient'
import * as api from './api'
import type { InboxFilters, InboxItem } from './types'

export const inboxKeys = {
  all: ['integrationInbox'] as const,
  list: (filters: InboxFilters) => ['integrationInbox', filters] as const,
}

/** Synced items, newest first, fifty at a time. */
export function useInbox(filters: InboxFilters) {
  const { backendSessionToken } = useAuth()
  return useInfiniteQuery({
    queryKey: inboxKeys.list(filters),
    queryFn: ({ pageParam }) => api.fetchInbox(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(backendSessionToken),
  })
}

/**
 * Files items into a project (or back to the inbox with null).
 *
 * Filing changes what the Email, Calendar, Contacts and project screens show,
 * so their caches are refreshed along with the inbox.
 */
export function useFileItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ items, projectId }: { items: Array<Pick<InboxItem, 'kind' | 'id'>>; projectId: string | null }) =>
      api.fileItems(items, projectId),
    onSuccess: () => {
      for (const queryKey of [inboxKeys.all, queryKeys.emails, queryKeys.meetings, queryKeys.contacts, queryKeys.projects]) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}

export function useRequestSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (provider: string) => api.requestSync(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationConnections })
    },
  })
}
