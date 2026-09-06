import { useState } from 'react'
import type { Variants } from 'motion/react'

/** A soft ease-out-expo-ish curve used everywhere for a consistent "premium" feel. */
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const

/** Standard entrance: fade up slightly. Use with `initial="hidden" animate="visible"`. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

/** Direction-aware slide for carousels — pass `custom={direction}` on the motion element. */
export const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction >= 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction >= 0 ? -32 : 32, opacity: 0 }),
}

/** Caps per-item stagger delay so long lists don't take forever to finish revealing. */
export function staggerDelay(index: number, step = 0.05, max = 0.4): number {
  return Math.min(index * step, max)
}

/**
 * Shared carousel state for the right-rail slider widgets: tracks the active
 * index together with which direction it last moved, so AnimatePresence can
 * slide the right way regardless of whether the user clicked prev/next or a dot.
 */
export function useCarousel(length: number) {
  const [[index, direction], setState] = useState<[number, number]>([0, 0])

  function goBy(delta: number) {
    setState(([current]) => [(current + delta + length) % length, delta])
  }

  function goTo(next: number) {
    setState(([current]) => [next, next > current ? 1 : -1])
  }

  return { index, direction, goBy, goTo }
}
