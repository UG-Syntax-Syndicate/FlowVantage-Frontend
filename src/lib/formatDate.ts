const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const DAY_MS = 86_400_000

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatInboxTimestamp(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const isSameDay =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  return isSameDay ? formatTime(iso) : formatShortDate(iso)
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export function formatRelativeToNow(iso: string, now: Date = new Date()): string {
  const diffDays = Math.round((new Date(iso).getTime() - now.getTime()) / DAY_MS)
  if (diffDays === 0) return 'Today'
  if (Math.abs(diffDays) < 7) return relativeFormatter.format(diffDays, 'day')
  const diffWeeks = Math.round(diffDays / 7)
  return relativeFormatter.format(diffWeeks, 'week')
}

/**
 * "now", "4m", "3h", "2d", "5w" - the compact form a notification feed needs.
 *
 * Distinct from formatRelativeToNow above, which rounds to whole days and so
 * calls everything that happened today "Today". In a feed where the top item
 * is usually seconds old, that is the one distinction worth keeping.
 */
export function formatCompactAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000))
  if (seconds < 45) return 'now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.round(days / 7)
  if (weeks < 53) return `${weeks}w`
  return `${Math.round(weeks / 52)}y`
}
