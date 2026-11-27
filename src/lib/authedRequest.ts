import { readBackendSessionToken } from './backendSession'

/**
 * Shared by the feature API clients in src/features/<feature>/api.ts: the
 * session for an authenticated call, and the backend's response envelope.
 */

export function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
}
