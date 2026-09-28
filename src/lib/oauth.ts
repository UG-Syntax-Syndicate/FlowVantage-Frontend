import {
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { auth, googleProvider, microsoftProvider } from './firebase'
import { logAuditEvent } from './auditLog'
import { markActivityNow } from './sessionExpiry'
import type { AuthProviderId } from '../types/user'

async function signInWithOAuthProvider(
  provider: typeof googleProvider | typeof microsoftProvider,
  providerId: AuthProviderId,
): Promise<boolean> {
  try {
    const result = await signInWithPopup(auth, provider)
    markActivityNow()
    // No client-side profile doc to create anymore - POST /auth/login (fired
    // by AuthProvider's token-exchange effect right after this resolves)
    // upserts the backend user row on first sign-in, same as email/password.
    await logAuditEvent(result.user.uid, 'login', { provider: providerId }).catch((error) => {
      console.warn('Failed to log login audit event', error)
    })
    return true
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code: string }).code
        : ''

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return false
    }

    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider)
      return false
    }

    throw error
  }
}

export function signInWithGoogle() {
  return signInWithOAuthProvider(googleProvider, 'google.com')
}

export function signInWithMicrosoft() {
  return signInWithOAuthProvider(microsoftProvider, 'microsoft.com')
}
