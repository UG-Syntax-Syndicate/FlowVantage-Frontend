import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { ViewSwitcher, type ProjectViewMode } from './ViewSwitcher'
import { ListView } from './ListView'
import { BoardView } from './BoardView'
import { GanttView } from './GanttView'
import { CalendarView } from './CalendarView'
import { CreateTaskModal } from './CreateTaskModal'
import type { EnrichedTask } from '../../hooks/useEnrichedTasks'
import type { Member } from '../../types/project'
import { TASK_STATUS_META } from '../../types/statusMeta'
import { formatShortDate } from '../../lib/formatDate'
import { EASE_PREMIUM } from '../../lib/motion'

interface ProjectTaskWidgetProps {
  projectId: string
  members: Member[]
  tasks: EnrichedTask[]
  /** Bump this (e.g. with a counter) to force the widget open from outside, such as a sidebar "View all". */
  expandSignal?: number
  /** This project's own name/color/due date, shown as a deadline marker on the calendar view. */
  projectName?: string
  projectColor?: string
  projectDueDate?: string
}

const COMPACT_HEIGHT = 'h-[380px]'

export function ProjectTaskWidget({
  projectId,
  members,
  tasks,
  expandSignal,
  projectName,
  projectColor,
  projectDueDate,
}: ProjectTaskWidgetProps) {
  const [viewMode, setViewMode] = useState<ProjectViewMode>('list')
  const [isExpanded, setExpanded] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)

  useEffect(() => {
    if (expandSignal) setExpanded(true)
  }, [expandSignal])

  useEffect(() => {
    if (!isExpanded) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  const activeView =
    viewMode === 'list' ? (
      <ListView tasks={tasks} />
    ) : viewMode === 'board' ? (
      <BoardView tasks={tasks} />
    ) : viewMode === 'gantt' ? (
      <GanttView tasks={tasks} />
    ) : (
      <CalendarView
        events={[
          ...tasks.map((t) => ({
            id: t.id,
            title: t.title,
            date: t.dueDate,
            color: t.projectColor,
            tooltipDetails: [
              `Due ${formatShortDate(t.dueDate)}`,
              TASK_STATUS_META[t.status].label,
              ...(t.assignees.length ? [t.assignees.map((a) => a.name).join(', ')] : []),
            ],
          })),
          ...(projectDueDate
            ? [
                {
                  id: `deadline-${projectId}`,
                  title: projectName ?? 'Project deadline',
                  date: projectDueDate,
                  color: projectColor ?? '#ef4444',
                  variant: 'deadline' as const,
                },
              ]
            : []),
        ]}
      />
    )

  const animatedView = (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.22, ease: EASE_PREMIUM }}
        className="h-full"
      >
        {activeView}
      </motion.div>
    </AnimatePresence>
  )

  const addTaskButton = (
    <button
      type="button"
      onClick={() => setAddTaskOpen(true)}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
    >
      <Plus size={14} strokeWidth={2} />
      Add Task
    </button>
  )

  const modal = addTaskOpen && (
    <CreateTaskModal projectId={projectId} members={members} onClose={() => setAddTaskOpen(false)} />
  )

  if (isExpanded) {
    return (
      <>
        <div className="fixed inset-0 z-30 bg-white/40 backdrop-blur-md" onClick={() => setExpanded(false)} />
        <div className="fixed inset-4 z-40 flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-2xl sm:inset-6 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <ViewSwitcher
                viewMode={viewMode}
                onChangeView={setViewMode}
                isExpanded={isExpanded}
                onToggleExpand={() => setExpanded(false)}
              />
            </div>
            {addTaskButton}
          </div>
          <div className="min-h-0 flex-1">{animatedView}</div>
        </div>
        {modal}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <ViewSwitcher
            viewMode={viewMode}
            onChangeView={setViewMode}
            isExpanded={isExpanded}
            onToggleExpand={() => setExpanded(true)}
            compact
          />
        </div>
        {addTaskButton}
      </div>
      <div className={`${COMPACT_HEIGHT} overflow-hidden`}>{animatedView}</div>
      {modal}
    </div>
  )
}
