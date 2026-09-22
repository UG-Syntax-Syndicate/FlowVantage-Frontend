import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { ViewSwitcher, type ProjectViewMode } from './ViewSwitcher'
import { ListView } from './ListView'
import { BoardView } from './BoardView'
import { GanttView } from './GanttView'
import { CalendarBoard } from '../calendar/CalendarBoard'
import { CreateTaskModal } from './CreateTaskModal'
import type { EnrichedTask } from '../../hooks/useEnrichedTasks'
import type { Member, Meeting, Project, Todo } from '../../types/project'
import type { CalendarEvent } from '../../types/calendarEvent'
import { EASE_PREMIUM } from '../../lib/motion'

interface ProjectTaskWidgetProps {
  projectId: string
  members: Member[]
  tasks: EnrichedTask[]
  /** This project's own todos/meetings, for the calendar view mode. */
  todos: Todo[]
  meetings: Meeting[]
  /** This project itself, so the calendar view mode can show its deadline marker. */
  project?: Project
  /** Bump this (e.g. with a counter) to force the widget open from outside, such as a sidebar "View all". */
  expandSignal?: number
}

const COMPACT_HEIGHT = 'h-[380px]'

export function ProjectTaskWidget({ projectId, members, tasks, todos, meetings, project, expandSignal }: ProjectTaskWidgetProps) {
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

  const calendarEvents = useMemo<CalendarEvent[]>(
    () => [
      ...tasks.map((task): CalendarEvent => ({ kind: 'task', task })),
      ...todos.map((todo): CalendarEvent => ({ kind: 'todo', todo })),
      ...meetings.map((meeting): CalendarEvent => ({ kind: 'meeting', meeting, projectColor: project?.color })),
      ...(project ? [{ kind: 'deadline', project } as const] : []),
    ],
    [tasks, todos, meetings, project],
  )

  const activeView =
    viewMode === 'list' ? (
      <ListView tasks={tasks} />
    ) : viewMode === 'board' ? (
      <BoardView tasks={tasks} />
    ) : viewMode === 'gantt' ? (
      <GanttView tasks={tasks} />
    ) : (
      <CalendarBoard events={calendarEvents} allowedViewModes={isExpanded ? ['month', 'week', 'day'] : ['month']} />
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
