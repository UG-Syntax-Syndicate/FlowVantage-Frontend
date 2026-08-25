import { useEffect, useRef } from 'react'
import { useLogout } from './useLogout'
import { SESSION_TIMEOUT_MS } from '../lib/constants'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

export function useSessionTimeout() {
  const logout = useLogout()
  const logoutRef = useRef(logout)
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  useEffect(() => {
    const handleTimeout = () => {
      logoutRef.current({
        redirectTo: '/login?reason=timeout',
        toastVariant: 'info',
        toastMessage: 'Signed out due to inactivity.',
      })
    }

    const resetTimer = () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(handleTimeout, SESSION_TIMEOUT_MS)
    }

    resetTimer()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }))

    return () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current)
      }
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [])
}
