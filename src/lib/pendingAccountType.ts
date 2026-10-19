/**
 * Carries the account-type choice from signup to the onboarding wizard.
 *
 * The choice is made before an account exists, but acting on it - creating the
 * organization workspace - needs a backend session, which only exists after
 * email verification. So it is parked here in between.
 *
 * sessionStorage rather than localStorage: this is a single sign-up journey, and
 * a stale choice surviving for weeks in a browser would eventually create an
 * organization for someone who had forgotten they ever asked. It is also under
 * the `flowvantage.` prefix deliberately, so the existing session-cleanup sweep
 * picks it up - abandoning signup and logging out should discard it.
 *
 * Every read is wrapped: sessionStorage throws in a private window with site
 * data blocked, and losing this hint must never break signup.
 */

const KEY = 'flowvantage.pendingAccountType'

export type AccountType = 'personal' | 'organization'

export interface PendingAccountType {
  type: AccountType
  /** Only set for an organization. */
  organizationName?: string
}

export function setPendingAccountType(value: PendingAccountType): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // Nothing to do: the wizard asks again if the hint is missing.
  }
}

export function readPendingAccountType(): PendingAccountType | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingAccountType
    return parsed.type === 'personal' || parsed.type === 'organization' ? parsed : null
  } catch {
    return null
  }
}

export function clearPendingAccountType(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Ignore.
  }
}
