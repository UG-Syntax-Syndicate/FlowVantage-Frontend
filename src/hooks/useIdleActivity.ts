const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'wheel', 'scroll', 'touchstart'] as const
const BROADCAST_CHANNEL_NAME = 'flowvantage-session-activity'
const STORAGE_FALLBACK_KEY = 'flowvantage.lastActivityAt'

type ActivityListener = () => void

/**
 * A single, module-level idle-activity clock shared by every consumer in this
 * tab (so multiple hook instances don't each attach their own DOM listeners),
 * and kept in sync across browser tabs: activity in any open tab resets every
 * tab's clock, via BroadcastChannel where available and a localStorage
 * `storage` event fallback otherwise (older browsers / privacy modes that
 * disable BroadcastChannel).
 */
class IdleActivityClock {
  private lastActivityAt = Date.now()
  private listeners = new Set<ActivityListener>()
  private channel: BroadcastChannel | null = null
  private started = false

  start() {
    if (this.started || typeof window === 'undefined') return
    this.started = true

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, this.handleLocalActivity, { passive: true }))
    document.addEventListener('visibilitychange', this.handleVisibilityChange)

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      this.channel.addEventListener('message', this.handleBroadcastMessage)
    } else {
      window.addEventListener('storage', this.handleStorageEvent)
    }
  }

  getIdleMs(): number {
    return Date.now() - this.lastActivityAt
  }

  subscribe(listener: ActivityListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Explicitly resets the clock (e.g. the "Stay signed in" button), broadcasting to other tabs too. */
  resetActivity = () => {
    this.recordActivity(true)
  }

  private handleLocalActivity = () => {
    this.recordActivity(true)
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') this.recordActivity(true)
  }

  private handleBroadcastMessage = (event: MessageEvent<number>) => {
    this.recordActivity(false, event.data)
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== STORAGE_FALLBACK_KEY || !event.newValue) return
    this.recordActivity(false, Number(event.newValue))
  }

  private recordActivity(broadcast: boolean, at: number = Date.now()) {
    if (at <= this.lastActivityAt) return
    this.lastActivityAt = at
    this.listeners.forEach((listener) => listener())

    if (!broadcast) return
    if (this.channel) {
      this.channel.postMessage(at)
    } else {
      try {
        window.localStorage.setItem(STORAGE_FALLBACK_KEY, String(at))
      } catch {
        // Storage unavailable (private browsing, quota) — cross-tab sync
        // degrades gracefully to per-tab idle tracking only.
      }
    }
  }
}

export const idleActivityClock = new IdleActivityClock()
