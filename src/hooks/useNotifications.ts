import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as notificationsApi from '../api/notificationsApi'
import { useAuth } from './useAuth'
import type { NotificationFeed } from '../types/notification'

/**
 * The bell's feed.
 *
 * No polling interval: the backend pushes a `notification` SSE event on every
 * write and useRealtimeSync invalidates this key from it, so an interval
 * would only add requests that almost always return what the client already
 * has. refetchOnWindowFocus (the client default) covers a dropped stream.
 */
export function useNotifications(limit = 20) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: [...queryKeys.notifications, limit],
    queryFn: () => notificationsApi.fetchNotifications(limit),
    enabled: Boolean(backendSessionToken),
  })
}

/**
 * Marks one read, optimistically.
 *
 * Optimistic because this fires as the menu is opening or a row is clicked,
 * and a badge that lags a round trip behind the click reads as a bug. The
 * cache is rolled back if the request fails.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications })
      const previous = queryClient.getQueriesData<NotificationFeed>({ queryKey: queryKeys.notifications })

      queryClient.setQueriesData<NotificationFeed>({ queryKey: queryKeys.notifications }, (feed) => {
        if (!feed) return feed
        const target = feed.notifications.find((notification) => notification.id === id)
        if (!target || target.readAt) return feed
        return {
          unreadCount: Math.max(0, feed.unreadCount - 1),
          notifications: feed.notifications.map((notification) =>
            notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification,
          ),
        }
      })

      return { previous }
    },
    onError: (_error, _id, context) => {
      context?.previous.forEach(([key, feed]) => queryClient.setQueryData(key, feed))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications })
      const previous = queryClient.getQueriesData<NotificationFeed>({ queryKey: queryKeys.notifications })
      const readAt = new Date().toISOString()

      queryClient.setQueriesData<NotificationFeed>({ queryKey: queryKeys.notifications }, (feed) =>
        feed
          ? {
              unreadCount: 0,
              notifications: feed.notifications.map((notification) =>
                notification.readAt ? notification : { ...notification, readAt },
              ),
            }
          : feed,
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, feed]) => queryClient.setQueryData(key, feed))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useDismissNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.dismissNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}
