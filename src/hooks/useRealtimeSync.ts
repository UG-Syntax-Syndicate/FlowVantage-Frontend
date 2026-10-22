import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { connectRealtimeEvents, type RealtimeResourceType } from '../lib/realtimeEvents'
import { queryKeys } from '../lib/queryClient'

/**
 * Which resource types push realtime SSE events, and what each one invalidates.
 *
 * Projects and tasks are here because they're visible across the most surfaces
 * at once (dashboard stats, calendar, kanban-style task board, project
 * cards/detail), so they're the ones most likely to be edited in one tab while
 * being watched live in another.
 *
 * Inventory, comments and messages are here because they're collaborative by
 * nature: stock figures are shared state two people can move at the same time,
 * and a comment thread or a project chat where you have to reload to see a
 * reply is not a conversation. The backend already broadcast all three; nothing
 * on this side was listening.
 *
 * Everything else (folders/todos/notes/contacts/documents) still relies on
 * TanStack Query's refetchOnWindowFocus - no server-push cost for data that
 * rarely needs to be instant.
 *
 * The keys are bare base keys, which React Query prefix-matches: invalidating
 * ['inventory'] also covers the workspace-scoped list and every per-item
 * movement ledger.
 */
const QUERY_KEY_BY_RESOURCE_TYPE: Record<RealtimeResourceType, readonly unknown[]> = {
  project: queryKeys.projects,
  task: queryKeys.tasks,
  inventory: queryKeys.inventory,
  task_comment: ['taskComments'],
  project_message: ['projectMessages'],
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
