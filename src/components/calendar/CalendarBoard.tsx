import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarToolbar } from './CalendarToolbar'
import { MonthGrid } from './MonthGrid'
import { CalendarTimeGrid } from './CalendarTimeGrid'
import { EventDetailSheet } from './EventDetailSheet'
import { MeetingFormModal } from './MeetingFormModal'
import { ConfirmDialog } from '../common/ConfirmDialog'
import type { CalendarViewMode } from './CalendarViewSwitcher'
import type { CalendarColorMode } from './taskColor'
import { TodoDetailModal } from '../projects/TodoDetailModal'
import { Skeleton } from '../ui/skeleton'
import { useDeleteMeeting, useToggleTodo, useUpdateTaskStatus } from '../../hooks/useProjectsData'
import { addDays, startOfWeek, toDateOnly } from '../../lib/calendarDate'
import type { CalendarEvent, CalendarMeetingEvent, CalendarTaskEvent, CalendarTodoEvent } from '../../types/calendarEvent'
import type { Meeting } from '../../types/project'
import { showToast } from '../../lib/toast'

const DEFAULT_VIEW_MODES: CalendarViewMode[] = ['month', 'week', 'day']

interface CalendarBoardProps {
  events: CalendarEvent[]
  isLoading?: boolean
  allowedViewModes?: CalendarViewMode[]
  initialViewMode?: CalendarViewMode
  className?: string
}

function visibleDaysFor(viewMode: CalendarViewMode, cursor: Date): Date[] {
  if (viewMode === 'day') return [toDateOnly(cursor)]
  if (viewMode === 'week') {
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }
  return []
}

export function CalendarBoard({
  events,
  isLoading,
  allowedViewModes = DEFAULT_VIEW_MODES,
  initialViewMode = 'month',
  className = '',
}: CalendarBoardProps) {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<CalendarViewMode>(allowedViewModes.includes(initialViewMode) ? initialViewMode : allowedViewModes[0])
  const [colorMode, setColorMode] = useState<CalendarColorMode>('project')
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedTaskOrMeeting, setSelectedTaskOrMeeting] = useState<CalendarTaskEvent | CalendarMeetingEvent | null>(null)
  const [selectedTodo, setSelectedTodo] = useState<CalendarTodoEvent | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null)

  const updateTaskStatus = useUpdateTaskStatus()
  const toggleTodo = useToggleTodo()
  const deleteMeeting = useDeleteMeeting()

  useEffect(() => {
    if (!allowedViewModes.includes(viewMode)) setViewMode(allowedViewModes[0] ?? 'month')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedViewModes])

  function handleOverflowClick(day: Date) {
    if (!allowedViewModes.includes('day')) return
    setCursor(day)
    setViewMode('day')
  }

  function handleDeadlineClick(projectId: string) {
    navigate(`/dashboard/projects/${projectId}`)
  }

  if (isLoading) {
    return <Skeleton className={`h-full min-h-[400px] w-full rounded-2xl ${className}`} />
  }

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.14)] ${className}`}>
      <CalendarToolbar
        cursor={cursor}
        onCursorChange={setCursor}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        allowedViewModes={allowedViewModes}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
      />

      <div className="min-h-0 flex-1">
        {viewMode === 'month' ? (
          <MonthGrid
            cursor={cursor}
            events={events}
            colorMode={colorMode}
            onTaskClick={setSelectedTaskOrMeeting}
            onTodoClick={setSelectedTodo}
            onMeetingClick={setSelectedTaskOrMeeting}
            onDeadlineClick={handleDeadlineClick}
            onOverflowClick={handleOverflowClick}
          />
        ) : (
          <CalendarTimeGrid
            days={visibleDaysFor(viewMode, cursor)}
            events={events}
            colorMode={colorMode}
            onTaskClick={setSelectedTaskOrMeeting}
            onTodoClick={setSelectedTodo}
            onMeetingClick={setSelectedTaskOrMeeting}
            onDeadlineClick={handleDeadlineClick}
          />
        )}
      </div>

      <EventDetailSheet
        event={selectedTaskOrMeeting}
        colorMode={colorMode}
        onClose={() => setSelectedTaskOrMeeting(null)}
        onStatusChange={(taskId, status) => updateTaskStatus.mutate({ taskId, status })}
        statusUpdatePending={updateTaskStatus.isPending}
        onEditMeeting={(event) => {
          // The form replaces the sheet rather than opening behind it.
          setSelectedTaskOrMeeting(null)
          setEditingMeeting(event.meeting)
        }}
        onDeleteMeeting={(event) => {
          setSelectedTaskOrMeeting(null)
          setDeletingMeeting(event.meeting)
        }}
      />

      {editingMeeting && <MeetingFormModal meeting={editingMeeting} onClose={() => setEditingMeeting(null)} />}

      <ConfirmDialog
        open={Boolean(deletingMeeting)}
        title="Delete this event?"
        description={
          deletingMeeting
            ? `"${deletingMeeting.title}" will be removed from your calendar, and from Google Calendar if it is linked.`
            : ''
        }
        confirmLabel="Delete event"
        danger
        loading={deleteMeeting.isPending}
        onCancel={() => setDeletingMeeting(null)}
        onConfirm={async () => {
          if (!deletingMeeting) return
          try {
            await deleteMeeting.mutateAsync(deletingMeeting.id)
            showToast('success', 'Event deleted')
            setDeletingMeeting(null)
          } catch {
            showToast('error', 'Could not delete this event')
          }
        }}
      />

      {selectedTodo && (
        <TodoDetailModal
          todo={selectedTodo.todo}
          projectName={selectedTodo.projectName}
          onClose={() => setSelectedTodo(null)}
          onToggleDone={() => toggleTodo.mutate(selectedTodo.todo.id)}
        />
      )}
    </div>
  )
}
