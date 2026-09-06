import { useEffect, useState } from 'react'

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

function computeCountdown(targetIso: string): Countdown {
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

/** Ticks every second toward (or past) an ISO deadline. */
export function useCountdown(targetIso: string): Countdown {
  const [countdown, setCountdown] = useState(() => computeCountdown(targetIso))

  useEffect(() => {
    setCountdown(computeCountdown(targetIso))
    const interval = window.setInterval(() => setCountdown(computeCountdown(targetIso)), 1000)
    return () => window.clearInterval(interval)
  }, [targetIso])

  return countdown
}
