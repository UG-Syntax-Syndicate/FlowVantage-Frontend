import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { idleActivityClock } from './useIdleActivity'
import { fetchBackendMeWithPolicy } from '../lib/backendApi'
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

  // The server's own inactivity window, once it has told us. SESSION_TIMEOUT_MS
  // is only the bootstrap guess; believing a locally-held constant is what let
  // the two sides drift (15 here against 4 there) and expire sessions out from
  // under a UI that thought they were live.
  const timeoutMsRef = useRef(SESSION_TIMEOUT_MS)

  const heartbeat = useCallback(() => {
    const token = backendSessionTokenRef.current
    if (!token) return
    lastHeartbeatRef.current = Date.now()
    fetchBackendMeWithPolicy(token)
      .then(({ session }) => {
        if (session && session.inactivityTimeoutMinutes > 0) {
          timeoutMsRef.current = session.inactivityTimeoutMinutes * 60 * 1000
        }
      })
      .catch(() => {
        // Best-effort. A 401 here is already handled a layer down, where the
        // request transparently re-authenticates and retries, so a rejection
        // at this point means the backend is genuinely unreachable - the
        // client-side countdown carries on regardless.
      })
  }, [])

  useEffect(() => {
    idleActivityClock.start()

    const tick = () => {
      if (expiredRef.current) return

      const remainingMs = timeoutMsRef.current - idleActivityClock.getIdleMs()

      if (remainingMs <= 0) {
        expiredRef.current = true
        setPhase('expired')
        void expireSessionRef.current()
        return
      }

      // Heartbeat before branching on phase, so a due heartbeat is never
      // skipped just because the countdown has reached its warning band. This
      // also covers the case that broke contact import: browsers throttle
      // timers in a hidden tab, so the interval below effectively stops while
      // the user is in another tab, the server-side window lapses, and the
      // session row is deleted. The visibilitychange listener re-ticks on
      // return and this heartbeat revives the session (re-authenticating
      // underneath if the row is already gone) before the user's next action.
      if (Date.now() - lastHeartbeatRef.current > SESSION_HEARTBEAT_MS) {
        heartbeat()
      }

      if (remainingMs <= SESSION_WARNING_MS) {
        setPhase('warning')
        setSecondsRemaining(Math.ceil(remainingMs / 1000))
        return
      }

      setPhase('active')
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
