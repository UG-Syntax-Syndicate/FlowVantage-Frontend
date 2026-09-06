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
