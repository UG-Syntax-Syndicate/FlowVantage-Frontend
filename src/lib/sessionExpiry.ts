import { SESSION_TIMEOUT_MS } from './constants'

/**
 * Wall-clock timestamp (epoch ms) of the last user activity, persisted so the
 * idle timer survives a tab close / reload. Written by the shared
 * IdleActivityClock (see useIdleActivity.ts) and by markActivityNow() on
 * sign-in; read on boot to decide whether a restored session has already
 * outlived the inactivity window.
 */
export const LAST_ACTIVITY_STORAGE_KEY = 'flowvantage.lastActivityAt'

export function readLastActivity(): number {
  try {
    const raw = window.localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY)
    const parsed = raw ? Number(raw) : Number.NaN
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

export function writeLastActivity(at: number): void {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(at))
  } catch {
    // Storage unavailable (private mode / quota) — idle tracking degrades to
    // per-tab only, which is the pre-existing behaviour.
  }
}

/** Stamps "now" as the last activity — call when a fresh sign-in begins. */
export function markActivityNow(): void {
  writeLastActivity(Date.now())
}

/** Clears the persisted timestamp — call on logout / expiry so the next sign-in starts clean. */
export function clearActivity(): void {
  try {
    window.localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * True when the persisted last-activity timestamp is older than the idle
 * timeout — i.e. a session restored right now should be treated as expired.
 * Returns false when nothing is stored (no session to expire).
 */
export function isIdleExpired(): boolean {
  const last = readLastActivity()
  if (!last || last > Date.now()) return false
  return Date.now() - last > SESSION_TIMEOUT_MS
}
