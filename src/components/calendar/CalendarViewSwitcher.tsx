import { CalendarDays, CalendarRange, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'

export type CalendarViewMode = 'day' | 'week' | 'month'

const VIEW_OPTIONS: { mode: CalendarViewMode; label: string; icon: LucideIcon }[] = [
  { mode: 'day', label: 'Day', icon: Sun },
  { mode: 'week', label: 'Week', icon: CalendarRange },
  { mode: 'month', label: 'Month', icon: CalendarDays },
]

interface CalendarViewSwitcherProps {
  viewMode: CalendarViewMode
  onChangeView: (mode: CalendarViewMode) => void
  allowedViewModes: CalendarViewMode[]
  compact?: boolean
}

/** Visual clone of ViewSwitcher.tsx's TabsList styling, so this looks native next to it. */
export function CalendarViewSwitcher({ viewMode, onChangeView, allowedViewModes, compact }: CalendarViewSwitcherProps) {
  const options = VIEW_OPTIONS.filter((o) => allowedViewModes.includes(o.mode))
  if (options.length <= 1) return null

  return (
    <Tabs value={viewMode} onValueChange={(value) => onChangeView(value as CalendarViewMode)} className="min-w-0">
      <TabsList className="h-auto gap-1 rounded-xl border border-line bg-white p-1 shadow-sm">
        {options.map(({ mode, label, icon: Icon }) => (
          <TabsTrigger
            key={mode}
            value={mode}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg font-medium text-slate-500 shadow-none data-active:bg-primary data-active:text-white data-active:shadow-none hover:text-slate-700 dark:data-active:bg-primary dark:data-active:text-white ${
              compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            }`}
          >
            <Icon size={compact ? 14 : 16} strokeWidth={1.9} />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
