import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as collaborationApi from '../api/collaborationApi'
import { useAuth } from './useAuth'

/**
 * Comments and messages both arrive over the realtime SSE stream (the backend
 * broadcasts `task_comment` and `project_message`; see useRealtimeSync), so
 * these queries do not poll. The invalidations below cover the local actor's
 * own writes, which land before the broadcast does.
 */

export function useTaskComments(taskId: string | null) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.taskComments(taskId ?? 'none'),
    queryFn: () => collaborationApi.fetchTaskComments(taskId as string),
    enabled: Boolean(backendSessionToken) && Boolean(taskId),
  })
}

export function useCreateTaskComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => collaborationApi.createTaskComment(taskId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.taskComments(taskId) }),
  })
}

export function useUpdateTaskComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      collaborationApi.updateTaskComment(commentId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.taskComments(taskId) }),
  })
}

export function useDeleteTaskComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => collaborationApi.deleteTaskComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.taskComments(taskId) }),
  })
}

// ---------------------------------------------------------------------------
// Project messages
// ---------------------------------------------------------------------------

export function useProjectMessages(projectId: string | null) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.projectMessages(projectId ?? 'none'),
    queryFn: () => collaborationApi.fetchProjectMessages(projectId as string),
    enabled: Boolean(backendSessionToken) && Boolean(projectId),
  })
}

function useInvalidateThread(projectId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projectMessages(projectId) })
    // Posting marks the thread read server-side, and an edit or delete changes
    // what is unread for everyone else, so the badge counts go stale too.
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessages })
  }
}

export function usePostProjectMessage(projectId: string) {
  const invalidate = useInvalidateThread(projectId)
  return useMutation({
    mutationFn: (body: string) => collaborationApi.postProjectMessage(projectId, body),
    onSuccess: invalidate,
  })
}

export function useUpdateProjectMessage(projectId: string) {
  const invalidate = useInvalidateThread(projectId)
  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      collaborationApi.updateProjectMessage(messageId, body),
    onSuccess: invalidate,
  })
}

export function useDeleteProjectMessage(projectId: string) {
  const invalidate = useInvalidateThread(projectId)
  return useMutation({
    mutationFn: (messageId: string) => collaborationApi.deleteProjectMessage(messageId),
    onSuccess: invalidate,
  })
}

/**
 * Moves the read marker to now.
 *
 * Deliberately not invalidating the thread: marking read changes nothing about
 * the messages themselves, and refetching them on every panel open would be a
 * round trip for no visible change.
 */
export function useMarkProjectMessagesRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => collaborationApi.markProjectMessagesRead(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessages }),
  })
}

/** Unread counts for every project at once - one request feeds every badge. */
export function useUnreadMessageCounts() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.unreadMessages,
    queryFn: collaborationApi.fetchUnreadMessageCounts,
    enabled: Boolean(backendSessionToken),
  })
}
