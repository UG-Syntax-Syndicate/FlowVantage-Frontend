import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface ResendCountdownRingProps {
  active: boolean
  durationSeconds: number
  onComplete?: () => void
  size?: number
  strokeWidth?: number
  children: ReactNode
}

export function ResendCountdownRing({
  active,
  durationSeconds,
  onComplete,
  size = 64,
  strokeWidth = 3,
  children,
}: ResendCountdownRingProps) {
  const [runId, setRunId] = useState(0)
  const wasActive = useRef(false)

  useEffect(() => {
    if (active && !wasActive.current) {
      setRunId((value) => value + 1)
    }
    wasActive.current = active
  }, [active])

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => onComplete?.(), durationSeconds * 1000)
    return () => window.clearTimeout(timer)
  }, [active, runId, durationSeconds, onComplete])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-accent-100"
        />
        {active && (
          <circle
            key={runId}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="animate-ring-deplete stroke-accent-500"
            style={
              {
                strokeDasharray: circumference,
                '--ring-circumference': circumference,
                animationDuration: `${durationSeconds}s`,
              } as CSSProperties
            }
          />
        )}
      </svg>
      <div className="relative flex items-center justify-center text-accent-600">{children}</div>
    </div>
  )
}
