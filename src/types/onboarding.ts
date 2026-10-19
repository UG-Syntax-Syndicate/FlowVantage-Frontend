/**
 * Onboarding progress, held server-side.
 *
 * Not in localStorage: a checklist that resets on another browser is not an
 * onboarding experience, and `clearAllClientSession()` wipes the
 * `flowvantage.*` keys on logout and on session expiry - so a flag kept there
 * would be erased and the whole tour, confetti included, would re-fire after
 * any sign-out.
 */
export interface OnboardingState {
  tourCompletedAt: string | null
  tourDismissedAt: string | null
  /** Which wizard step to resume on. 0 means not started. */
  wizardStep: number
  wizardCompletedAt: string | null
  firstProjectAt: string | null
  firstTaskAt: string | null
  firstTaskCompletedAt: string | null
  firstMemberInvitedAt: string | null
  firstContactImportedAt: string | null
  /** True once the first-task celebration has fired, so it cannot fire twice. */
  celebratedFirstTask: boolean
}

export type OnboardingMilestone =
  | 'firstProjectAt'
  | 'firstTaskAt'
  | 'firstTaskCompletedAt'
  | 'firstMemberInvitedAt'
  | 'firstContactImportedAt'

/** Timestamps are written by sending `true` (meaning now) or `null` (clear) - never a client-chosen time. */
export interface OnboardingUpdate {
  tourCompletedAt?: true | null
  tourDismissedAt?: true | null
  wizardStep?: number
  wizardCompletedAt?: true | null
  celebratedFirstTask?: boolean
}
