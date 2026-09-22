/**
 * Single source of truth for "which color represents this person" - a stable
 * hash from member id to one of a fixed palette, so the same person always
 * reads as the same color everywhere (avatar fallback background, calendar
 * event bars colored by assignee, etc). Never inline a second copy of this
 * palette/hash - import from here instead.
 */
interface MemberColor {
  /** Tailwind class, for contexts that render a real element (e.g. avatar background). */
  className: string
  /** Equivalent hex value, for contexts that need an inline style (e.g. calendar event bar backgroundColor). */
  hex: string
}

const MEMBER_COLORS: MemberColor[] = [
  { className: 'bg-accent-500', hex: '#f97316' },
  { className: 'bg-indigo-500', hex: '#6366f1' },
  { className: 'bg-sky-500', hex: '#0ea5e9' },
  { className: 'bg-emerald-500', hex: '#10b981' },
  { className: 'bg-fuchsia-500', hex: '#d946ef' },
  { className: 'bg-rose-500', hex: '#f43f5e' },
]

function hashId(id: string): number {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function memberColorClass(id: string): string {
  return MEMBER_COLORS[hashId(id) % MEMBER_COLORS.length].className
}

export function memberColorHex(id: string): string {
  return MEMBER_COLORS[hashId(id) % MEMBER_COLORS.length].hex
}
