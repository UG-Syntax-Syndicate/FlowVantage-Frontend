import { useEffect, useState } from 'react'

const CHARS_PER_TICK = 3
const TICK_MS = 12

/**
 * Reveals `text` a few characters at a time while `active` is true, so a fresh AI
 * reply appears to type itself out instead of popping in all at once. When `active`
 * is false the full text is returned immediately (used for messages loaded from history).
 */
export function useTypewriter(text: string, active: boolean): string {
  const [shown, setShown] = useState(active ? '' : text)

  useEffect(() => {
    if (!active) {
      setShown(text)
      return
    }

    setShown('')
    let i = 0
    const interval = window.setInterval(() => {
      i += CHARS_PER_TICK
      setShown(text.slice(0, i))
      if (i >= text.length) window.clearInterval(interval)
    }, TICK_MS)

    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active])

  return shown
}
