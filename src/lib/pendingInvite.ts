/**
 * An invite link opened before signing in.
 *
 * Login keeps the page it came from, but signing up does not: it runs through
 * email verification and two-factor setup before reaching the dashboard, and
 * the invite used to be lost on the way. The token is kept here until the
 * invite page is reached again (DashboardLayout sends the user back to it).
 */
const KEY = 'fv_pending_invite'

export function rememberPendingInvite(token: string): void {
  try {
    localStorage.setItem(KEY, token)
  } catch {
    // Storage unavailable (private mode): the emailed link still works.
  }
}

export function readPendingInvite(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
