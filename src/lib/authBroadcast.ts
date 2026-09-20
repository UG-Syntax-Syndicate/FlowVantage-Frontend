/**
 * Cross-tab auth signalling. Firebase already propagates the raw signed-out
 * state between tabs via its own persistence listener, but not *why* — this
 * channel carries the reason so every open tab can clear the backend session
 * token and render the right UI (silent redirect for a manual logout, the
 * "session expired" screen for an idle timeout).
 */
export type AuthBroadcastEvent = { type: 'logout' | 'expired'; at: number }

const CHANNEL_NAME = 'flowvantage-auth'
const STORAGE_KEY = 'flowvantage.authEvent'

const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null

function isAuthBroadcastEvent(value: unknown): value is AuthBroadcastEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as { type?: unknown }).type === 'logout' || (value as { type?: unknown }).type === 'expired') &&
    typeof (value as { at?: unknown }).at === 'number'
  )
}

/** Notify other tabs that this tab logged out / expired. Does not fire in this tab. */
export function publishAuthEvent(type: AuthBroadcastEvent['type']): void {
  const event: AuthBroadcastEvent = { type, at: Date.now() }

  if (channel) {
    channel.postMessage(event)
    return
  }

  try {
    // `at` keeps the value unique so the `storage` event always fires.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(event))
  } catch {
    // No cross-tab channel available — other tabs fall back to Firebase's own
    // onAuthStateChanged propagation.
  }
}

/** Subscribe to logout/expiry events from other tabs. Returns an unsubscribe fn. */
export function subscribeAuthEvent(handler: (event: AuthBroadcastEvent) => void): () => void {
  if (channel) {
    const listener = (event: MessageEvent<unknown>) => {
      if (isAuthBroadcastEvent(event.data)) handler(event.data)
    }
    channel.addEventListener('message', listener)
    return () => channel.removeEventListener('message', listener)
  }

  const listener = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      const parsed: unknown = JSON.parse(event.newValue)
      if (isAuthBroadcastEvent(parsed)) handler(parsed)
    } catch {
      // ignore malformed payloads
    }
  }
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}
