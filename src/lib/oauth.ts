import {
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, microsoftProvider } from './firebase'
import { DEFAULT_NOTIFICATION_PREFERENCES } from './constants'
import { logAuditEvent } from './auditLog'
import type { AuthProviderId } from '../types/user'

export async function ensureUserProfileDoc(
  user: User,
  authProvider: AuthProviderId,
): Promise<void> {
  const profileRef = doc(db, 'users', user.uid)
  const existing = await getDoc(profileRef)

  if (existing.exists()) {
    return
  }

  await setDoc(profileRef, {
    name: user.displayName ?? user.email?.split('@')[0] ?? 'New user',
    email: user.email ?? '',
    role: 'owner',
    authProvider,
    photoURL: user.photoURL ?? null,
    createdAt: serverTimestamp(),
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
  })
}

async function signInWithOAuthProvider(
  provider: typeof googleProvider | typeof microsoftProvider,
  providerId: AuthProviderId,
): Promise<boolean> {
  try {
    const result = await signInWithPopup(auth, provider)
    await ensureUserProfileDoc(result.user, providerId)
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
