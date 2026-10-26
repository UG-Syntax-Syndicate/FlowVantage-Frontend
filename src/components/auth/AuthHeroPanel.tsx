import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { EASE_PREMIUM } from '../../lib/motion'
import { LogoBadge } from './LogoBadge'

/**
 * The slides, with alt text, because this panel is the only image on the
 * page and a screen reader should get something better than "image".
 *
 * Served from /public rather than imported: they are large photographs, and
 * importing them would inline them into the bundle graph for a panel that is
 * hidden below `lg` and never rendered on a phone at all.
 */
const SLIDES = [
  // The team shot leads: it is the one that says what this is for.
  { src: '/auth-slides/slide-1.webp', alt: 'A team working together at a shared table in a bright office' },
  { src: '/auth-slides/slide-2.webp', alt: 'A woman talking through a set of charts with her colleagues' },
  { src: '/auth-slides/slide-3.webp', alt: 'A team reviewing a board together in a meeting room' },
  { src: '/auth-slides/slide-4.webp', alt: 'Two teammates discussing work at a monitor' },
  { src: '/auth-slides/slide-5.webp', alt: 'A room of people following a presentation on screen' },
]

/**
 * How long each slide holds. Long enough to look at, short enough that the
 * set is seen during a sign-in rather than only by someone who lingers.
 */
const ADVANCE_MS = 5000

interface AuthHeroPanelProps {
  mobileVisible?: boolean
}

/**
 * The image half of the auth pages, as a crossfading slider.
 *
 * The island frame and its radius live on the parent in AuthLayout, so this
 * fills it completely and clips to it - nothing here sets a radius of its
 * own, which is what keeps the two from drifting apart.
 */
export function AuthHeroPanel({ mobileVisible = false }: AuthHeroPanelProps) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  // Stops the carousel the moment someone takes control of it. An auto-rotate
  // that keeps moving under a cursor fights whoever is using it.
  const [paused, setPaused] = useState(false)

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), ADVANCE_MS)
    return () => clearInterval(timer)
  }, [paused])

  return (
    <div
      className={`relative h-full min-h-0 overflow-hidden bg-navy ${mobileVisible ? 'block' : 'hidden lg:block'}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* A crossfade rather than a horizontal slide: the panel is framed and
          inset, so something sliding past its edge reads as broken clipping
          rather than as movement. */}
      <AnimatePresence initial={false}>
        <motion.img
          key={SLIDES[index].src}
          src={SLIDES[index].src}
          alt={SLIDES[index].alt}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          // Under reduced motion it still advances, but cuts rather than
          // fades and drifts. The setting asks for no *motion*, not for a
          // feature to disappear - and pausing is still one hover away, which
          // is the control WCAG actually asks for.
          transition={
            reduceMotion
              ? { duration: 0 }
              : { opacity: { duration: 0.9, ease: EASE_PREMIUM }, scale: { duration: 6.5, ease: 'linear' } }
          }
          className="absolute inset-0 h-full w-full object-cover"
          // The first slide is above the fold on every auth page; the rest
          // are fetched as they come round.
          loading={index === 0 ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
        />
      </AnimatePresence>

      {/* Scrims: the logo sits on whatever the photograph happens to be, and
          the dots do too. Without these both vanish against a light frame. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />

      <div className="absolute top-6 right-6 sm:top-10 sm:right-10">
        <LogoBadge />
      </div>

      {/* Buttons, not dots drawn with divs: each one moves the carousel, so
          each has to be reachable by keyboard and named for a screen reader.
          The hit area is 24px square while the dot itself is 6px. */}
      <div
        className="absolute inset-x-0 bottom-7 flex items-center justify-center gap-1"
        role="group"
        aria-label="Choose a slide"
      >
        {SLIDES.map((slide, slideIndex) => {
          const active = slideIndex === index
          return (
            <button
              key={slide.src}
              type="button"
              onClick={() => go(slideIndex)}
              aria-label={`Slide ${slideIndex + 1} of ${SLIDES.length}`}
              aria-current={active}
              className="group flex h-6 w-6 items-center justify-center rounded-full outline-none"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ease-out ${
                  active
                    ? 'w-5 bg-white'
                    : 'w-1.5 bg-white/50 group-hover:bg-white/80 group-focus-visible:bg-white/80'
                }`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
