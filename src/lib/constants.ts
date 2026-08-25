import type { NotificationPreferences } from '../types/user'

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailOnAssignment: true,
  emailOnMention: true,
  weeklyDigest: true,
  productUpdates: false,
}
