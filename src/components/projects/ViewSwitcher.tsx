import { CalendarDays, GanttChart, Kanban, List, Maximize2, Minimize2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'

export type ProjectViewMode = 'list' | 'board' | 'gantt' | 'calendar'

const VIEW_OPTIONS: { mode: ProjectViewMode; label: string; icon: LucideIcon }[] = [
  { mode: 'list', label: 'List', icon: List },
  { mode: 'board', label: 'Board', icon: Kanban },
  { mode: 'gantt', label: 'Gantt', icon: GanttChart },
  { mode: 'calendar', label: 'Calendar', icon: CalendarDays },
]

interface ViewSwitcherProps {
  viewMode: ProjectViewMode
  onChangeView: (mode: ProjectViewMode) => void
  isExpanded: boolean
  onToggleExpand: () => void
  compact?: boolean
}

export function ViewSwitcher({ viewMode, onChangeView, isExpanded, onToggleExpand, compact }: ViewSwitcherProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Tabs value={viewMode} onValueChange={(value) => onChangeView(value as ProjectViewMode)}>
        <TabsList className="h-auto gap-1 rounded-xl border border-line bg-white p-1 shadow-sm">
          {VIEW_OPTIONS.map(({ mode, label, icon: Icon }) => (
            <TabsTrigger
              key={mode}
              value={mode}
              className={`flex items-center gap-1.5 rounded-lg font-medium text-slate-500 shadow-none data-active:bg-primary data-active:text-white data-active:shadow-none hover:text-slate-700 dark:data-active:bg-primary dark:data-active:text-white ${
                compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
              }`}
            >
              <Icon size={compact ? 14 : 16} strokeWidth={1.9} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <button
        type="button"
        onClick={onToggleExpand}
        title={isExpanded ? 'Restore view' : 'Expand view'}
        aria-label={isExpanded ? 'Restore view' : 'Expand view'}
        className={`flex shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700 ${
          compact ? 'h-7 w-7' : 'h-9 w-9'
        }`}
      >
        {isExpanded ? (
          <Minimize2 size={compact ? 14 : 16} strokeWidth={1.9} />
        ) : (
          <Maximize2 size={compact ? 14 : 16} strokeWidth={1.9} />
        )}
      </button>
    </div>
  )
}
