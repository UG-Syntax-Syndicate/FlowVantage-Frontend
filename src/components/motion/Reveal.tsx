import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE_PREMIUM, fadeInUp } from '../../lib/motion'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/** One-line entrance animation (fade + rise). Stack increasing `delay` values for a staggered "waterfall" reveal. */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ duration: 0.5, delay, ease: EASE_PREMIUM }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
