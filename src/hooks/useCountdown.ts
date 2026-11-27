import { useEffect, useState } from 'react'

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

const NO_DEADLINE: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false }

function computeCountdown(targetIso: string | null): Countdown {
  if (!targetIso) return NO_DEADLINE
  const diffMs = new Date(targetIso).getTime() - Date.now()
  const isPast = diffMs <= 0
  const totalSeconds = Math.max(Math.abs(diffMs), 0) / 1000

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: Math.floor(totalSeconds % 60),
    isPast,
  }
}

/**
 * Ticks every second toward (or past) an ISO deadline; null means there is no
 * deadline and nothing ticks.
 *
 * The target must be stable between renders. A caller that passed
 * `new Date().toISOString()` as a fallback handed the effect a new dependency
 * on every render, so it set state, re-rendered and looped ("Maximum update
 * depth exceeded") for every user with no projects.
 */
export function useCountdown(targetIso: string | null): Countdown {
  const [countdown, setCountdown] = useState(() => computeCountdown(targetIso))

  useEffect(() => {
    setCountdown(computeCountdown(targetIso))
    if (!targetIso) return
    const interval = window.setInterval(() => setCountdown(computeCountdown(targetIso)), 1000)
    return () => window.clearInterval(interval)
  }, [targetIso])

  return countdown
}
