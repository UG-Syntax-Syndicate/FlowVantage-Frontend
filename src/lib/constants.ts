import type { NotificationPreferences } from '../types/user'

// Must match the backend's SESSION_INACTIVITY_TIMEOUT_MINUTES (see
// FlowVantage-Backend/src/config/env.js) so the client-side idle timer and
// the server's sliding-window session expiry agree on the same window — if
// you change this, update that backend default too, or the UI's countdown
// and the server's actual expiry will drift apart.
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000
// How long before the timeout to show the "you're about to be signed out" warning.
export const SESSION_WARNING_MS = 2 * 60 * 1000
// How often to ping the backend while the user is active, so its last_active_at
// stays fresh even though most of the app never otherwise calls the backend.
export const SESSION_HEARTBEAT_MS = 2 * 60 * 1000

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailOnAssignment: true,
  emailOnMention: true,
  weeklyDigest: true,
  productUpdates: false,
}

export const GRADIENTS = {
  sunset: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)',
  violet: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
  amber: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 50%, #f43f5e 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 50%, #34d399 100%)',
  dusk: 'linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #0ea5e9 100%)',
  bloom: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fbbf24 100%)',
}

export const GRADIENT_PALETTE = Object.values(GRADIENTS)
export const PROJECT_COLOR_PALETTE = ['#ec721d', '#6366f1', '#0ea5e9', '#22c55e', '#a855f7', '#f43f5e']
export const FOLDER_COLOR_PALETTE = ['#ec4899', '#22c55e', '#f59e0b', '#0ea5e9', '#8b5cf6', '#6366f1']
