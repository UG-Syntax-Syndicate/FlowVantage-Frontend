import { motion } from 'motion/react'

interface ImportProgressRingProps {
  /** 0-100 */
  progress: number
}

const SIZE = 96
const STROKE = 4
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** The FlowVantage logo with a circular progress ring around it that fills as `progress` climbs to 100. */
export function ImportProgressRing({ progress }: ImportProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, progress))
  const offset = CIRCUMFERENCE * (1 - clamped / 100)

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-slate-100" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <motion.img
        src="/flow-vantage-logo.png"
        alt="FlowVantage"
        className="absolute h-10 w-10 drop-shadow-sm"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
