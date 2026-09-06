import { motion } from 'motion/react'
import { EASE_PREMIUM, staggerDelay } from '../../lib/motion'

interface DeliveriesChartProps {
  data: { label: string; value: number }[]
}

const WIDTH = 480
const HEIGHT = 160
const PADDING_X = 12
const PADDING_TOP = 16
const PADDING_BOTTOM = 28

export function DeliveriesChart({ data }: DeliveriesChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const plotWidth = WIDTH - PADDING_X * 2
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0

  const points = data.map((d, i) => ({
    x: PADDING_X + i * stepX,
    y: PADDING_TOP + plotHeight - (d.value / maxValue) * plotHeight,
    ...d,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${PADDING_TOP + plotHeight} L ${points[0]?.x ?? 0} ${PADDING_TOP + plotHeight} Z`

  const peak = points.reduce((max, p) => (p.value > max.value ? p : max), points[0])

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-40 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="deliveriesFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec721d" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ec721d" stopOpacity="0" />
        </linearGradient>
      </defs>

      {peak && (
        <rect
          x={peak.x - stepX / 2.6}
          y={PADDING_TOP}
          width={stepX / 1.3}
          height={plotHeight}
          fill="#ec721d"
          opacity={0.06}
          rx={6}
        />
      )}

      <motion.path
        d={areaPath}
        fill="url(#deliveriesFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: EASE_PREMIUM }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="#ec721d"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: EASE_PREMIUM }}
      />

      {points.map((p, i) => (
        <motion.circle
          key={p.label}
          cx={p.x}
          cy={p.y}
          r={p === peak ? 5 : 3}
          fill="white"
          stroke="#ec721d"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: staggerDelay(i, 0.08, 0.9), ease: EASE_PREMIUM }}
        />
      ))}

      {points.map((p) => (
        <text key={p.label} x={p.x} y={HEIGHT - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
          {p.label}
        </text>
      ))}
    </svg>
  )
}
