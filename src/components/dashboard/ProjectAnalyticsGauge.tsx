import { useEffect, useState } from 'react'

interface ProjectAnalyticsGaugeProps {
  completed: number
  inProgress: number
  pending: number
  size?: number
}

const SEGMENTS = [
  { key: 'completed', label: 'Completed', color: '#ec721d' },
  { key: 'inProgress', label: 'In Progress', color: '#fbbf24' },
  { key: 'pending', label: 'Pending', color: '#e2e8f0' },
] as const

export function ProjectAnalyticsGauge({ completed, inProgress, pending, size = 168 }: ProjectAnalyticsGaugeProps) {
  const total = completed + inProgress + pending
  const strokeWidth = size * 0.11
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const values = { completed, inProgress, pending }
  const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  // Segments render collapsed to 0 length on first paint, then grow to their
  // real length once `grown` flips — the existing `transition-all` on each
  // circle animates that change into a "sweep-in" on mount.
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  let cumulative = 0

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 drop-shadow-[0px_6px_16px_rgba(236,114,29,0.25)]">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {total === 0
            ? null
            : SEGMENTS.map((segment, i) => {
                const value = values[segment.key]
                if (value <= 0) return null
                const length = (value / total) * circumference
                const offset = cumulative
                cumulative += length
                return (
                  <circle
                    key={segment.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={grown ? `${Math.max(length - 3, 0)} ${circumference - length + 3}` : `0 ${circumference}`}
                    strokeDashoffset={-offset}
                    className="transition-all duration-700 ease-out"
                    style={{ transitionDelay: `${i * 150}ms` }}
                  />
                )
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-slate-900">{completedPercent}%</p>
          <p className="text-xs text-slate-400">Completed</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        {SEGMENTS.map((segment) => (
          <span key={segment.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
            {segment.label}
          </span>
        ))}
      </div>
    </div>
  )
}
