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
  { src: '/auth-slides/slide-1.webp', alt: 'Three colleagues reviewing charts together in a meeting room' },
  { src: '/auth-slides/slide-2.webp', alt: 'Two teammates discussing work at a monitor in a studio office' },
  { src: '/auth-slides/slide-3.webp', alt: 'A team running a stand-up around a sprint board' },
  { src: '/auth-slides/slide-4.webp', alt: 'A woman leaning back from her desk, smiling, work finished' },
  { src: '/auth-slides/slide-5.webp', alt: 'Three colleagues reading a document together over a desk of blueprints' },
  { src: '/auth-slides/slide-6.webp', alt: 'A team working through a plan on a whiteboard in a meeting room' },
]

const ADVANCE_MS = 6000

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
    // No auto-advance under reduced motion: a carousel that moves on its own
    // is exactly the kind of thing that setting asks us to stop doing. The
    // dots still work, so every slide stays reachable.
    if (reduceMotion || paused) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), ADVANCE_MS)
    return () => clearInterval(timer)
  }, [reduceMotion, paused])

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
          transition={{ opacity: { duration: 0.9, ease: EASE_PREMIUM }, scale: { duration: 6.5, ease: 'linear' } }}
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
