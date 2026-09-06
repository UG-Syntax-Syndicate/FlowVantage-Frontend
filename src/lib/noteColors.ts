import type { NoteColor } from '../types/project'

interface NoteColorMeta {
  label: string
  cardBg: string
  badgeBg: string
  iconText: string
}

/**
 * Single source of truth for how a note's color renders anywhere in the app
 * (grid cards, the view modal, the color picker) - extend this map, never
 * inline a color -> class mapping in a component.
 */
export const NOTE_COLORS: Record<NoteColor, NoteColorMeta> = {
  blue: { label: 'Blue', cardBg: 'bg-sky-50', badgeBg: 'bg-sky-400', iconText: 'text-white' },
  green: { label: 'Green', cardBg: 'bg-emerald-50', badgeBg: 'bg-emerald-400', iconText: 'text-white' },
  purple: { label: 'Purple', cardBg: 'bg-violet-50', badgeBg: 'bg-violet-400', iconText: 'text-white' },
  yellow: { label: 'Yellow', cardBg: 'bg-amber-50', badgeBg: 'bg-amber-400', iconText: 'text-white' },
  red: { label: 'Red', cardBg: 'bg-rose-50', badgeBg: 'bg-rose-400', iconText: 'text-white' },
  gray: { label: 'Gray', cardBg: 'bg-slate-100', badgeBg: 'bg-slate-400', iconText: 'text-white' },
}

export const NOTE_COLOR_ORDER: NoteColor[] = ['yellow', 'blue', 'red', 'green', 'gray', 'purple']
