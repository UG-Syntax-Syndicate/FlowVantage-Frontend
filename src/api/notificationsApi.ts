import { getJson, postJsonAuthed, deleteJson } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import type { Notification, NotificationFeed } from '../types/notification'

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  project_id: string | null
  workspace_id: string | null
  actor_id: string | null
  actor_name: string | null
  actor_avatar_url: string | null
  read_at: string | null
  created_at: string
}

interface FeedEnvelope {
  success: boolean
  data: NotificationRow[]
  unreadCount: number
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    projectId: row.project_id,
    workspaceId: row.workspace_id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    // Deliberately not run through pickAvatar: a notification with no actor
    // is a system event, and giving it a generated face would imply a person
    // behind it. The bell renders a type icon in that case instead.
    actorPhotoURL: row.actor_avatar_url,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

/**
 * The feed and the unread count come back together - the backend puts
 * `unreadCount` alongside `data` so the bell's badge needs no second request.
 */
export async function fetchNotifications(limit = 20): Promise<NotificationFeed> {
  const response = await getJson<FeedEnvelope>(`/notifications?limit=${limit}`, authToken())
  return {
    notifications: response.data.map(mapNotification),
    unreadCount: response.unreadCount ?? 0,
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await postJsonAuthed(`/notifications/${id}/read`, {}, authToken())
}

export async function markAllNotificationsRead(): Promise<void> {
  await postJsonAuthed('/notifications/read-all', {}, authToken())
}

export async function dismissNotification(id: string): Promise<void> {
  await deleteJson(`/notifications/${id}`, authToken())
}
