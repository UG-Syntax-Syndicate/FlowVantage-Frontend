import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getRedirectResult, onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { ensureUserProfileDoc } from '../lib/oauth'
import { logAuditEvent } from '../lib/auditLog'
import { exchangeFirebaseSession } from '../lib/backendApi'
import {
  clearBackendSessionToken,
  readBackendSessionToken,
  storeBackendSessionToken,
} from '../lib/backendSession'
import { AuthContext } from './AuthContext'
import type { UserProfile } from '../types/user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [backendSessionToken, setBackendSessionToken] = useState<string | null>(readBackendSessionToken)

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
      if (!user) {
        setUserProfile(null)
        clearBackendSessionToken()
        setBackendSessionToken(null)
      }
    })

    return unsubscribe
  }, [])

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
      return
    }

    let cancelled = false

    currentUser
      .getIdToken()
      .then((idToken) => exchangeFirebaseSession(idToken))
      .then(({ sessionToken }) => {
        if (!cancelled && auth.currentUser?.uid === currentUser.uid) {
          storeBackendSessionToken(sessionToken)
          setBackendSessionToken(sessionToken)
        }
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

  const loading = !authResolved

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, backendSessionToken }}>
      {children}
    </AuthContext.Provider>
  )
}
