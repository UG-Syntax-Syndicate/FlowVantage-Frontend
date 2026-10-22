import { getJson, patchJson, postJsonAuthed } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import type { OnboardingMilestone, OnboardingState, OnboardingUpdate } from '../types/onboarding'

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

/** The row is created on first read, so this never 404s for a signed-in user. */
export async function fetchOnboardingState(): Promise<OnboardingState> {
  const { data } = await getJson<ApiEnvelope<OnboardingState>>('/onboarding', authToken())
  return data
}

export async function updateOnboardingState(updates: OnboardingUpdate): Promise<OnboardingState> {
  const { data } = await patchJson<ApiEnvelope<OnboardingState>>('/onboarding', updates, authToken())
  return data
}

/**
 * Records a first-time milestone and reports whether this call was the one that
 * recorded it.
 *
 * `wasFirst` is decided atomically server-side, which is the only way to
 * celebrate exactly once: a client that read the state, saw a null and then
 * wrote would fire twice whenever two tabs raced.
 */
export async function markOnboardingMilestone(
  milestone: OnboardingMilestone,
): Promise<{ wasFirst: boolean; state: OnboardingState }> {
  const payload = await postJsonAuthed<ApiEnvelope<OnboardingState> & { wasFirst: boolean }>(
    `/onboarding/milestones/${milestone}`,
    {},
    authToken(),
  )
  return { wasFirst: payload.wasFirst, state: payload.data }
}
