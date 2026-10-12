import type { NotificationPreferences } from '../types/user'

// Fallback only. The real window is served by the backend as
// `session.inactivityTimeoutMinutes` on GET /auth/me and read by
// useSessionTimeout — the server owns its own expiry policy, so it is the only
// thing that can state it authoritatively.
//
// This used to be the client's own copy of the value, with a comment insisting
// it be kept in step with the backend's SESSION_INACTIVITY_TIMEOUT_MINUTES by
// hand. It wasn't: this said 15 minutes while the backend defaulted to 4, so
// require-session.js had already deleted the session row while the UI still
// showed a live session with 11 minutes left. Every request then 401'd with no
// recovery path. Only used now before the first /auth/me response lands.
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

/**
 * Picks a PROJECT_COLOR_PALETTE index for a new project, preferring one no
 * existing project is already using so two projects don't blur together on
 * the calendar - only degrades to a fully random pick once every palette
 * slot is already taken (an inherent limit of a 6-color palette, not
 * something more colors than that can meaningfully solve). The same index
 * is used for GRADIENT_PALETTE so a project's card gradient and calendar
 * color always agree.
 */
export function pickProjectColorIndex(existingColors: string[]): number {
  const usedIndices = new Set(existingColors.map((color) => PROJECT_COLOR_PALETTE.indexOf(color)).filter((i) => i !== -1))
  const available = PROJECT_COLOR_PALETTE.map((_, i) => i).filter((i) => !usedIndices.has(i))
  const pool = available.length > 0 ? available : PROJECT_COLOR_PALETTE.map((_, i) => i)
  return pool[Math.floor(Math.random() * pool.length)]
}
