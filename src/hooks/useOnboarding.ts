import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as onboardingApi from '../api/onboardingApi'
import { useAuth } from './useAuth'
import type { OnboardingMilestone, OnboardingState, OnboardingUpdate } from '../types/onboarding'

const ONBOARDING_KEY = ['onboarding'] as const

/**
 * Onboarding progress for the signed-in user.
 *
 * `staleTime: Infinity` on purpose: this changes only when this client changes
 * it, and every mutation below seeds the cache with the server's response. A
 * refetch on window focus would be a round trip that can never return
 * different data, on every tab switch.
 */
export function useOnboarding() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: onboardingApi.fetchOnboardingState,
    enabled: Boolean(backendSessionToken),
    staleTime: Infinity,
  })
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: OnboardingUpdate) => onboardingApi.updateOnboardingState(updates),
    onSuccess: (state) => queryClient.setQueryData(ONBOARDING_KEY, state),
  })
}

/**
 * Records a first-time milestone.
 *
 * Returns the server's `wasFirst`, which is what the caller branches on to
 * celebrate. Deliberately not optimistic: the whole value of this call is the
 * server's answer, and an optimistic guess would be the bug it exists to
 * prevent.
 */
export function useMarkMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (milestone: OnboardingMilestone) => onboardingApi.markOnboardingMilestone(milestone),
    onSuccess: ({ state }) => queryClient.setQueryData(ONBOARDING_KEY, state),
  })
}

/** Lets non-hook code (a mutation callback) read the cached state without a refetch. */
export function readCachedOnboarding(queryClient: ReturnType<typeof useQueryClient>): OnboardingState | undefined {
  return queryClient.getQueryData<OnboardingState>(ONBOARDING_KEY)
}

export { ONBOARDING_KEY }
