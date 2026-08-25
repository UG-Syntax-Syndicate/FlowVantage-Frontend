import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from './useAuth'
import { logAuditEvent } from '../lib/auditLog'
import { logoutBackendSession } from '../lib/backendApi'
import { clearBackendSessionToken } from '../lib/backendSession'
import { showToast } from '../lib/toast'

interface LogoutOptions {
  redirectTo?: string
  toastVariant?: 'success' | 'info' | 'error'
  toastMessage?: string
}

export function useLogout() {
  const { currentUser, backendSessionToken } = useAuth()
  const navigate = useNavigate()

  return useCallback(
    async (opts: LogoutOptions = {}) => {
      // Clear the client-owned session synchronously. Network calls below are
      // advisory because backend JWTs are stateless, so they must never keep a
      // user signed in or delay the dashboard logout action.
      const sessionToken = backendSessionToken
      clearBackendSessionToken()

      if (currentUser) {
        void logAuditEvent(currentUser.uid, 'logout').catch((error) => {
          console.warn('Failed to log logout audit event', error)
        })
      }
      if (sessionToken) {
        void logoutBackendSession(sessionToken).catch((error) => {
          console.warn('Failed to clear backend session', error)
        })
      }

      try {
        await signOut(auth)
      } catch (error) {
        showToast('error', 'Could not sign out', 'Please try again.')
        throw error
      }

      showToast(opts.toastVariant ?? 'success', opts.toastMessage ?? 'Signed out')
      navigate(opts.redirectTo ?? '/login', { replace: true })
    },
    [currentUser, backendSessionToken, navigate],
  )
}
