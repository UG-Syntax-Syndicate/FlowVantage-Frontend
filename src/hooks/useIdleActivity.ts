import { LAST_ACTIVITY_STORAGE_KEY, readLastActivity, writeLastActivity } from '../lib/sessionExpiry'

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'wheel', 'scroll', 'touchstart'] as const
const BROADCAST_CHANNEL_NAME = 'flowvantage-session-activity'
const STORAGE_FALLBACK_KEY = LAST_ACTIVITY_STORAGE_KEY
const PERSIST_THROTTLE_MS = 5000

/**
 * A single, module-level idle-activity clock shared by every consumer in this
 * tab (so multiple hook instances don't each attach their own DOM listeners),
 * and kept in sync across browser tabs: activity in any open tab resets every
 * tab's clock, via BroadcastChannel where available and a localStorage
 * `storage` event fallback otherwise (older browsers / privacy modes that
 * disable BroadcastChannel).
 *
 * The last-activity timestamp is also persisted to localStorage (throttled)
 * and re-seeded from it on start(), so idle time is measured against the last
 * real interaction even across a full app close — not reset to zero on every
 * fresh tab.
 */
class IdleActivityClock {
  private lastActivityAt = Date.now()
  private lastPersistedAt = 0
  private channel: BroadcastChannel | null = null
  private started = false

  start() {
    if (typeof window === 'undefined') return

    // Adopt the persisted timestamp whenever it's newer than what this clock
    // has in memory — not just on the very first start(). A fresh sign-in
    // after logout writes a brand-new value (see resetActivity()) while this
    // singleton (module-scoped, never torn down) still holds its stale
    // pre-logout timestamp; re-checking here on every start() call is what
    // lets the next mount (e.g. DashboardLayout after re-login) pick it up.
    const stored = readLastActivity()
    if (stored && stored <= Date.now() && stored > this.lastActivityAt) {
      this.lastActivityAt = stored
      this.lastPersistedAt = stored
    }

    if (this.started) return
    this.started = true

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, this.handleLocalActivity, { passive: true }))

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

  /** Explicitly resets the clock (e.g. the "Stay signed in" button), broadcasting to other tabs too. */
  resetActivity = () => {
    this.recordActivity(true)
  }

  private handleLocalActivity = () => {
    this.recordActivity(true)
  }

  private handleBroadcastMessage = (event: MessageEvent<number>) => {
    this.recordActivity(false, event.data)
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== STORAGE_FALLBACK_KEY || !event.newValue) return
    this.recordActivity(false, Number(event.newValue))
  }

  private persist(at: number, force = false) {
    if (!force && at - this.lastPersistedAt < PERSIST_THROTTLE_MS) return
    this.lastPersistedAt = at
    writeLastActivity(at)
  }

  private recordActivity(broadcast: boolean, at: number = Date.now()) {
    if (at <= this.lastActivityAt) return
    this.lastActivityAt = at

    if (!broadcast) {
      // Echo of another tab's activity — mirror the timestamp locally so this
      // tab's persisted value stays current too, but don't re-broadcast.
      this.persist(at)
      return
    }

    if (this.channel) {
      this.persist(at)
      this.channel.postMessage(at)
    } else {
      // No BroadcastChannel: the localStorage write is both the cross-tab
      // signal (via the `storage` event) and the cross-reload seed.
      this.persist(at, true)
    }
  }
}

export const idleActivityClock = new IdleActivityClock()
