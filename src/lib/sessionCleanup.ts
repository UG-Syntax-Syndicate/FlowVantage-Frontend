import { queryClient } from './queryClient'
import { clearBackendSessionToken } from './backendSession'
import { clearActivity } from './sessionExpiry'
import { clearPendingAuthRedirect } from './pendingAuthRedirect'

/**
 * Wipes every piece of client-owned session state in one place, so logout and
 * idle-expiry can't leave a stale token or a previous user's cached data
 * behind. Deliberately does NOT call Firebase `signOut` — the caller controls
 * that ordering; Firebase clears its own IndexedDB persistence on sign-out.
 */
export function clearAllClientSession(): void {
  clearBackendSessionToken() // localStorage: flowvantage.backendSessionToken
  clearActivity() // localStorage: flowvantage.lastActivityAt
  clearPendingAuthRedirect() // in-memory redirect hint
  queryClient.clear() // drop the previous user's cached projects/contacts/etc.
}
