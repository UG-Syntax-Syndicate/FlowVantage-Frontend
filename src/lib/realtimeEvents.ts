import { REALTIME_BASE_URL, fetchRealtimeTicket } from './backendApi'
import { COOKIE_SESSION } from './backendSession'

/** Kept narrow on purpose — see src/hooks/useRealtimeSync.ts for why. */
export type RealtimeResourceType =
  | 'project'
  | 'task'
  | 'inventory'
  | 'task_comment'
  | 'project_message'
  | 'notification'
  | 'integration'
  | 'calendar_event'

export interface RealtimeChangeEvent {
  resourceType: RealtimeResourceType
  action: 'create' | 'update' | 'delete'
  resourceId: string | null
}

function isRealtimeChangeEvent(value: unknown): value is RealtimeChangeEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { resourceType?: unknown }).resourceType === 'string'
  )
}

const RECONNECT_BASE_DELAY_MS = 1000
const RECONNECT_MAX_DELAY_MS = 30_000

/**
 * Opens the backend's SSE stream (see FlowVantage-Backend's
 * src/modules/realtime) and calls `onChange` for each event it pushes.
 * EventSource can't set an Authorization header, so it authenticates with a
 * short-lived ticket in the URL (or, for a pre-cookie Bearer session, the
 * token itself) - the backend accepts these on this one route.
 *
 * Reconnects with exponential backoff on drop/error, since EventSource's own
 * auto-reconnect doesn't back off and would hammer a backend that's down.
 * Returns an unsubscribe function that closes the connection for good.
 */
export function connectRealtimeEvents(sessionToken: string, onChange: (event: RealtimeChangeEvent) => void): () => void {
  let source: EventSource | null = null
  let reconnectTimer: number | undefined
  let reconnectDelay = RECONNECT_BASE_DELAY_MS
  let stopped = false

  /**
   * The stream URL. A cookie session cannot hand its token to EventSource (the
   * point of the cookie is that scripts cannot read it), so it fetches a
   * one-minute ticket first, freshly for every (re)connect. An older Bearer
   * session still passes its token, as before.
   */
  async function streamUrl(): Promise<string> {
    if (sessionToken === COOKIE_SESSION) {
      const ticket = await fetchRealtimeTicket(sessionToken)
      return `${REALTIME_BASE_URL}/realtime/stream?ticket=${encodeURIComponent(ticket)}`
    }
    return `${REALTIME_BASE_URL}/realtime/stream?token=${encodeURIComponent(sessionToken)}`
  }

  function scheduleReconnect() {
    if (stopped) return
    reconnectTimer = window.setTimeout(connect, reconnectDelay)
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY_MS)
  }

  async function connect() {
    if (stopped) return

    let url: string
    try {
      url = await streamUrl()
    } catch {
      scheduleReconnect()
      return
    }
    if (stopped) return

    source = new EventSource(url)

    source.onopen = () => {
      reconnectDelay = RECONNECT_BASE_DELAY_MS
    }

    source.onmessage = (event) => {
      try {
        const parsed: unknown = JSON.parse(event.data)
        if (isRealtimeChangeEvent(parsed)) onChange(parsed)
      } catch {
        // ignore malformed payloads
      }
    }

    source.onerror = () => {
      source?.close()
      scheduleReconnect()
    }
  }

  void connect()

  return () => {
    stopped = true
    window.clearTimeout(reconnectTimer)
    source?.close()
  }
}
