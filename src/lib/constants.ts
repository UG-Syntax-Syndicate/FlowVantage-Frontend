import type { NotificationPreferences } from '../types/user'

// Matches the backend's default SESSION_INACTIVITY_TIMEOUT_MINUTES (see
// FlowVantage-Backend/src/config/env.js) so the client-side idle timer and
// the server's sliding-window session expiry agree on the same window.
export const SESSION_TIMEOUT_MS = 4 * 60 * 1000
// How long before the timeout to show the "you're about to be signed out" warning.
export const SESSION_WARNING_MS = 60 * 1000
// How often to ping the backend while the user is active, so its last_active_at
// stays fresh even though most of the app never otherwise calls the backend.
export const SESSION_HEARTBEAT_MS = 2 * 60 * 1000

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailOnAssignment: true,
  emailOnMention: true,
  weeklyDigest: true,
  productUpdates: false,
}
