import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getRedirectResult, onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { ensureUserProfileDoc } from '../lib/oauth'
import { logAuditEvent } from '../lib/auditLog'
import { exchangeFirebaseSession, logoutBackendSession } from '../lib/backendApi'
import {
  clearBackendSessionToken,
  readBackendSessionToken,
  storeBackendSessionToken,
} from '../lib/backendSession'
import { AuthContext, type TwoFactorChallenge } from './AuthContext'
import type { UserProfile } from '../types/user'

const VERIFICATION_POLL_MS = 5000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [backendSessionToken, setBackendSessionToken] = useState<string | null>(readBackendSessionToken)
  const [emailVerified, setEmailVerified] = useState(false)
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result) return
      const providerId =
        result.providerId === 'microsoft.com' ? 'microsoft.com' : 'google.com'
      await ensureUserProfileDoc(result.user, providerId)
      await logAuditEvent(result.user.uid, 'login', { provider: providerId })
    }).catch(() => {
      // Ignore redirect-result errors; the user simply lands signed out.
    })
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthResolved(true)
      setEmailVerified(user?.emailVerified ?? false)
      if (user) {
        setSessionExpired(false)
      } else {
        setUserProfile(null)
        clearBackendSessionToken()
        setBackendSessionToken(null)
        setTwoFactorChallenge(null)
      }
    })

    return unsubscribe
  }, [])

  // Polls Firebase for a fresh emailVerified flag while the signed-in user is
  // unverified. `user.reload()` mutates the existing User instance in place
  // and does not re-fire onAuthStateChanged, so this tracks a plain boolean
  // instead of relying on the currentUser object reference to change.
  useEffect(() => {
    if (!currentUser || emailVerified) return

    let cancelled = false

    const checkVerified = async () => {
      try {
        await auth.currentUser?.reload()
      } catch {
        return
      }
      if (cancelled) return
      if (auth.currentUser?.emailVerified) {
        setEmailVerified(true)
      }
    }

    const interval = window.setInterval(checkVerified, VERIFICATION_POLL_MS)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') checkVerified()
    }
    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', checkVerified)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', checkVerified)
    }
  }, [currentUser, emailVerified])

  useEffect(() => {
    if (!currentUser) return

    const profileRef = doc(db, 'users', currentUser.uid)

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Omit<UserProfile, 'id'>
          setUserProfile({ id: snapshot.id, ...data })

          if (currentUser.email && data.email !== currentUser.email) {
            updateDoc(profileRef, { email: currentUser.email }).catch(() => {})
          }
        }
      },
      (error) => {
        console.warn('Failed to load user profile', error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      clearBackendSessionToken()
      setBackendSessionToken(null)
      setTwoFactorChallenge(null)
      return
    }

    let cancelled = false

    currentUser
      .getIdToken()
      .then((idToken) => exchangeFirebaseSession(idToken))
      .then((result) => {
        if (cancelled || auth.currentUser?.uid !== currentUser.uid) return

        if (result.status === 'requiresTwoFactor') {
          clearBackendSessionToken()
          setBackendSessionToken(null)
          setTwoFactorChallenge({ userId: result.userId })
          return
        }

        storeBackendSessionToken(result.sessionToken)
        setBackendSessionToken(result.sessionToken)
        setTwoFactorChallenge(null)
      })
      .catch((error) => {
        // Best-effort only: the app must keep working via Firebase alone if
        // the backend is unreachable or not yet deployed.
        console.warn('Backend session exchange failed', error)
        if (!cancelled && auth.currentUser?.uid === currentUser.uid) {
          clearBackendSessionToken()
          setBackendSessionToken(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [currentUser])

  const resolveTwoFactorChallenge = useCallback((sessionToken: string) => {
    storeBackendSessionToken(sessionToken)
    setBackendSessionToken(sessionToken)
    setTwoFactorChallenge(null)
  }, [])

  const cancelTwoFactorChallenge = useCallback(async () => {
    // There is no valid backend session without completing the challenge, so
    // the only correct way to back out is a full sign-out.
    setTwoFactorChallenge(null)
    await signOut(auth)
  }, [])

  /**
   * Signs out due to inactivity, same security boundary as a normal logout
   * (clears the backend session, signs out of Firebase), but deliberately
   * does not navigate or toast — ProtectedRoute shows a blocking "session
   * expired" screen in place instead, until the user acknowledges it.
   */
  const expireSession = useCallback(async () => {
    const sessionToken = backendSessionToken
    clearBackendSessionToken()
    setBackendSessionToken(null)

    if (sessionToken) {
      void logoutBackendSession(sessionToken).catch((error) => {
        console.warn('Failed to clear backend session', error)
      })
    }

    setSessionExpired(true)

    try {
      await signOut(auth)
    } catch (error) {
      console.warn('Failed to sign out after idle timeout', error)
    }
  }, [backendSessionToken])

  /**
   * Called right before navigating to /login from the "session expired"
   * screen. expireSession() already kicked off signOut() when the timeout
   * fired, but that's fire-and-forget from the timer's perspective — if the
   * user clicks through before it's actually finished, currentUser would
   * still be truthy for a moment and PublicOnlyRoute would bounce /login
   * straight back to /dashboard. Re-awaiting signOut() here (a harmless
   * no-op if it already completed) guarantees currentUser is really null
   * before we clear the flag and let the caller navigate.
   */
  const acknowledgeSessionExpired = useCallback(async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.warn('Failed to confirm sign-out before re-login', error)
    }
    setSessionExpired(false)
  }, [])

  const loading = !authResolved

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        backendSessionToken,
        emailVerified,
        twoFactorChallenge,
        resolveTwoFactorChallenge,
        cancelTwoFactorChallenge,
        sessionExpired,
        expireSession,
        acknowledgeSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
