import confetti from 'canvas-confetti'
import { PROJECT_COLOR_PALETTE } from './constants'

/**
 * A one-off confetti burst, in the brand palette.
 *
 * Returns whether it actually ran, so a caller can pair it with a toast and
 * know the achievement was still communicated to someone who sees no animation.
 */

const BURST_COLORS = PROJECT_COLOR_PALETTE.slice(0, 5)

function prefersReducedMotion(): boolean {
  // Guarded rather than assumed: matchMedia is absent in a non-browser
  // environment, and this module is imported by code under test.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fires the celebration, unless the viewer has asked for reduced motion.
 *
 * A full-screen particle burst is precisely what that setting exists to
 * prevent - it is a vestibular trigger, not a preference about taste - so this
 * returns early and the caller's toast carries the message instead. The same
 * mechanism `SplashScreen` already uses.
 */
export function celebrate(): boolean {
  if (prefersReducedMotion()) return false

  // Two bursts from the lower corners rather than one from the centre: the
  // centre burst covers whatever the person just did, which here is the task
  // they completed.
  const shared = {
    particleCount: 70,
    spread: 70,
    startVelocity: 45,
    ticks: 180,
    colors: BURST_COLORS,
    disableForReducedMotion: true,
  } as const

  confetti({ ...shared, origin: { x: 0.1, y: 0.9 }, angle: 60 })
  confetti({ ...shared, origin: { x: 0.9, y: 0.9 }, angle: 120 })

  return true
}
