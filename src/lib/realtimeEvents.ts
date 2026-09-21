import { API_BASE_URL } from './backendApi'

/** Kept narrow on purpose — see src/hooks/useRealtimeSync.ts for why. */
export type RealtimeResourceType = 'project' | 'task'

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
 * EventSource can't set an Authorization header, so the session token is
 * passed as a query param instead - the backend's requireSession middleware
 * accepts that as a fallback for this one route.
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

  function connect() {
    if (stopped) return

    source = new EventSource(`${API_BASE_URL}/realtime/stream?token=${encodeURIComponent(sessionToken)}`)

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
      if (stopped) return
      reconnectTimer = window.setTimeout(connect, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY_MS)
    }
  }

  connect()

  return () => {
    stopped = true
    window.clearTimeout(reconnectTimer)
    source?.close()
  }
}
