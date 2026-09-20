import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { idleActivityClock } from './useIdleActivity'
import { fetchBackendMe } from '../lib/backendApi'
import { SESSION_HEARTBEAT_MS, SESSION_TIMEOUT_MS, SESSION_WARNING_MS } from '../lib/constants'

export type SessionPhase = 'active' | 'warning' | 'expired'

interface SessionTimeoutState {
  /** 'warning' during the last SESSION_WARNING_MS before expiry; 'expired' once signed out. */
  phase: SessionPhase
  /** Only meaningful while phase === 'warning'. */
  secondsRemaining: number
  /** Resets the idle clock (across all open tabs) and refreshes the backend session. */
  stayActive: () => void
}

/**
 * Drives idle-session expiry: watches the shared cross-tab activity clock
 * (see useIdleActivity.ts), surfaces a 'warning' phase SESSION_WARNING_MS
 * before the SESSION_TIMEOUT_MS mark for a UI to render a countdown, and
 * performs a real sign-out (mirroring the backend's own sliding-window
 * inactivity expiry in require-session.js) if nothing resets it in time —
 * ProtectedRoute then shows a blocking "session expired" screen rather than
 * silently redirecting, since expireSession() deliberately doesn't navigate.
 * While active, best-effort pings the backend so its last_active_at stays in
 * sync even though most of the app never otherwise calls it.
 */
export function useSessionTimeout(): SessionTimeoutState {
  const { backendSessionToken, expireSession } = useAuth()
  const [phase, setPhase] = useState<SessionPhase>('active')
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(SESSION_WARNING_MS / 1000))

  const backendSessionTokenRef = useRef(backendSessionToken)
  useEffect(() => {
    backendSessionTokenRef.current = backendSessionToken
  }, [backendSessionToken])

  const expireSessionRef = useRef(expireSession)
  useEffect(() => {
    expireSessionRef.current = expireSession
  }, [expireSession])

  const lastHeartbeatRef = useRef(0)
  const expiredRef = useRef(false)

  const heartbeat = useCallback(() => {
    const token = backendSessionTokenRef.current
    if (!token) return
    lastHeartbeatRef.current = Date.now()
    fetchBackendMe(token).catch(() => {
      // Best-effort only — a missed heartbeat just means the backend's own
      // sliding-window inactivity clock (SESSION_TIMEOUT_MS, kept in sync
      // with the backend's config) may lapse slightly ahead of the
      // client's; it doesn't affect the client-side timeout.
    })
  }, [])

  useEffect(() => {
    idleActivityClock.start()

    const tick = () => {
      if (expiredRef.current) return

      const remainingMs = SESSION_TIMEOUT_MS - idleActivityClock.getIdleMs()

      if (remainingMs <= 0) {
        expiredRef.current = true
        setPhase('expired')
        void expireSessionRef.current()
        return
      }

      if (remainingMs <= SESSION_WARNING_MS) {
        setPhase('warning')
        setSecondsRemaining(Math.ceil(remainingMs / 1000))
        return
      }

      setPhase('active')
      if (Date.now() - lastHeartbeatRef.current > SESSION_HEARTBEAT_MS) {
        heartbeat()
      }
    }

    tick()
    const interval = window.setInterval(tick, 1000)

    // While a tab is hidden the browser throttles setInterval to ~1/minute, so
    // re-check the moment it becomes visible again (covers "left it overnight,
    // came back" without waiting up to a minute for the next throttled tick).
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [heartbeat])

  const stayActive = useCallback(() => {
    idleActivityClock.resetActivity()
    setPhase('active')
    heartbeat()
  }, [heartbeat])

  return { phase, secondsRemaining, stayActive }
}
