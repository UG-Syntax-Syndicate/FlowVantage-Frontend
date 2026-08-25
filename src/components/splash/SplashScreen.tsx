import { useEffect, useState } from 'react'

const HOLD_MS = 1500
const REDUCED_HOLD_MS = 200

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false)
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setExiting(true), reducedMotion ? REDUCED_HOLD_MS : HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 bg-gradient-to-tr from-accent-700/85 via-slate-900/60 to-accent-500/40 ${
        exiting ? 'animate-splash-exit' : ''
      }`}
      onAnimationEnd={(event) => {
        if (exiting && event.animationName === 'splash-fade-out') onDone()
      }}
      role="presentation"
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className={`h-16 w-16 ${reducedMotion ? '' : 'animate-splash-mark'}`}>
        <defs>
          <linearGradient id="splash-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <path d="M16 16 L28 44 L32 34 L20 16 Z M44 16 L28 44 L32 34 L48 16 Z" fill="url(#splash-g)" />
      </svg>
      <p
        className={`mt-4 text-sm uppercase tracking-[0.24em] text-accent-100 ${
          reducedMotion ? '' : 'animate-splash-word'
        }`}
      >
        Flow Vantage
      </p>
    </div>
  )
}
