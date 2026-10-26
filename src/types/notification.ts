import { z } from 'zod'

/**
 * The event names the backend writes (see its
 * src/modules/notifications/services/notification-events.js). Parsed as a
 * plain string rather than an enum on purpose: a backend that has shipped a
 * new type must not make the whole feed fail to parse on an older client, so
 * an unrecognised type falls back to a default icon.
 */
export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  link: z.string().nullable(),
  projectId: z.string().nullable(),
  workspaceId: z.string().nullable(),
  actorId: z.string().nullable(),
  actorName: z.string().nullable(),
  actorPhotoURL: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
})
export type Notification = z.infer<typeof NotificationSchema>

export interface NotificationFeed {
  notifications: Notification[]
  unreadCount: number
}
