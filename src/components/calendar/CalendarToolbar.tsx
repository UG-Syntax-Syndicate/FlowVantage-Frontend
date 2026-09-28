import { ChevronLeft, ChevronRight, Palette } from 'lucide-react'
import { CalendarViewSwitcher, type CalendarViewMode } from './CalendarViewSwitcher'
import type { CalendarColorMode } from './taskColor'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { addDays, startOfWeek } from '../../lib/calendarDate'

interface CalendarToolbarProps {
  cursor: Date
  onCursorChange: (next: Date) => void
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  allowedViewModes: CalendarViewMode[]
  colorMode: CalendarColorMode
  onColorModeChange: (mode: CalendarColorMode) => void
  compact?: boolean
}

function rangeLabel(cursor: Date, viewMode: CalendarViewMode): string {
  if (viewMode === 'day') {
    return cursor.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
  }
  if (viewMode === 'week') {
    const start = startOfWeek(cursor)
    const end = addDays(start, 6)
    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startLabel} – ${endLabel}`
  }
  return cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function step(cursor: Date, viewMode: CalendarViewMode, direction: 1 | -1): Date {
  if (viewMode === 'day') return addDays(cursor, direction)
  if (viewMode === 'week') return addDays(cursor, 7 * direction)
  return new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1)
}

export function CalendarToolbar({
  cursor,
  onCursorChange,
  viewMode,
  onViewModeChange,
  allowedViewModes,
  colorMode,
  onColorModeChange,
  compact,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
      <div className="flex items-center gap-1">
        <p className="mr-2 text-sm font-semibold text-slate-900">{rangeLabel(cursor, viewMode)}</p>
        <button
          type="button"
          onClick={() => onCursorChange(step(cursor, viewMode, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onCursorChange(new Date())}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onCursorChange(step(cursor, viewMode, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Next"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            title="Color tasks by"
            aria-label="Color tasks by"
            className={`flex items-center justify-center rounded-lg border border-line bg-white text-slate-500 shadow-sm outline-none hover:bg-slate-50 hover:text-slate-700 ${compact ? 'h-7 w-7' : 'h-9 w-9'}`}
          >
            <Palette size={compact ? 14 : 16} strokeWidth={1.9} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuRadioGroup value={colorMode} onValueChange={(v) => onColorModeChange(v as CalendarColorMode)}>
              <DropdownMenuRadioItem value="project" className="px-2 py-1.5">
                Color by project
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="assignee" className="px-2 py-1.5">
                Color by assignee
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="tag" className="px-2 py-1.5">
                Color by tag
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <CalendarViewSwitcher
          viewMode={viewMode}
          onChangeView={onViewModeChange}
          allowedViewModes={allowedViewModes}
          compact={compact}
        />
      </div>
    </div>
  )
}
