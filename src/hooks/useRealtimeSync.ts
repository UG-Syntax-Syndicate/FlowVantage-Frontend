import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { connectRealtimeEvents, type RealtimeResourceType } from '../lib/realtimeEvents'
import { queryKeys } from '../lib/queryClient'

/**
 * Only projects and tasks push realtime SSE events - they're the two
 * entities visible across the most surfaces at once (dashboard stats,
 * calendar, kanban-style task board, project cards/detail), so they're the
 * ones most likely to be edited in one tab while being watched live in
 * another. Everything else (folders/todos/notes/contacts/documents) relies
 * on TanStack Query's refetchOnWindowFocus instead - no server-push cost for
 * data that rarely needs to be instant.
 */
const QUERY_KEY_BY_RESOURCE_TYPE: Record<RealtimeResourceType, readonly unknown[]> = {
  project: queryKeys.projects,
  task: queryKeys.tasks,
}

/** Opens the realtime SSE connection for the signed-in session and keeps React Query fresh from it. */
export function useRealtimeSync(): void {
  const { backendSessionToken } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!backendSessionToken) return

    return connectRealtimeEvents(backendSessionToken, (event) => {
      const queryKey = QUERY_KEY_BY_RESOURCE_TYPE[event.resourceType]
      if (queryKey) queryClient.invalidateQueries({ queryKey })
    })
  }, [backendSessionToken, queryClient])
}
