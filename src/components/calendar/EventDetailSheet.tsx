import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronDown, Clock, MapPin, Video } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../animate-ui/components/radix/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { TaskStatusBadge, PriorityBadge } from '../projects/StatusBadge'
import { AvatarStack } from '../dashboard/AvatarStack'
import { colorForTask, type CalendarColorMode } from './taskColor'
import { isTimedTask } from '../../lib/calendarDate'
import type { CalendarMeetingEvent, CalendarTaskEvent } from '../../types/calendarEvent'
import type { TaskStatus } from '../../types/project'
import { TASK_STATUS_ORDER } from '../../types/statusMeta'
import { formatShortDate, formatTime } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'

interface EventDetailSheetProps {
  event: CalendarTaskEvent | CalendarMeetingEvent | null
  colorMode: CalendarColorMode
  onClose: () => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  statusUpdatePending?: boolean
}

function durationLabel(startIso: string, endIso: string): string {
  const minutes = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000)
  if (minutes <= 0) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hour' : `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hours`
}

function namesSummary(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
}

export function EventDetailSheet({ event, colorMode, onClose, onStatusChange, statusUpdatePending }: EventDetailSheetProps) {
  const navigate = useNavigate()

  const accentColor =
    event?.kind === 'task' ? colorForTask(event.task, colorMode) : (event?.kind === 'meeting' ? (event.projectColor ?? '#0d062d') : '#94a3b8')

  return (
    <Sheet open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        style={{ top: 16, right: 16, bottom: 16, height: 'auto' }}
        className="flex w-[420px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-none shadow-2xl"
      >
        <div className="h-1.5 shrink-0" style={{ backgroundColor: accentColor }} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {event?.kind === 'task' && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8 text-lg">{event.task.title}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-4">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger disabled={statusUpdatePending} className="outline-none disabled:opacity-50">
                      <span className="flex items-center gap-1">
                        <TaskStatusBadge status={event.task.status} />
                        <ChevronDown size={13} className="text-slate-400" />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {TASK_STATUS_ORDER.map((status) => (
                        <DropdownMenuItem key={status} onClick={() => onStatusChange(event.task.id, status)}>
                          <TaskStatusBadge status={status} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <PriorityBadge priority={event.task.priority} />
                </div>

                <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={15} className="shrink-0 text-slate-400" />
                    {isTimedTask(event.task.startDate, event.task.dueDate) ? (
                      <>
                        {formatTime(event.task.startDate)}–{formatTime(event.task.dueDate)}
                      </>
                    ) : (
                      <>
                        {formatShortDate(event.task.startDate)} – {formatShortDate(event.task.dueDate)}
                      </>
                    )}
                  </div>
                  {isTimedTask(event.task.startDate, event.task.dueDate) && durationLabel(event.task.startDate, event.task.dueDate) && (
                    <span className="shrink-0 text-xs text-slate-400">{durationLabel(event.task.startDate, event.task.dueDate)}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                  {event.task.assignees.length > 0 ? (
                    <>
                      <AvatarStack members={event.task.assignees} size={28} max={4} />
                      <span className="text-slate-600">{namesSummary(event.task.assignees.map((a) => a.name))}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(`/dashboard/projects/${event.task.projectId}`)
                  }}
                  className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: event.task.projectColor }} />
                  {event.task.projectName}
                </button>
              </div>
            </>
          )}

          {event?.kind === 'meeting' && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8 text-lg">{event.meeting.title}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays size={15} className="shrink-0 text-slate-400" />
                  {formatShortDate(event.meeting.startTime)}
                </div>

                <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={15} className="shrink-0 text-slate-400" />
                    {formatTime(event.meeting.startTime)}–{formatTime(event.meeting.endTime)}
                  </div>
                  {durationLabel(event.meeting.startTime, event.meeting.endTime) && (
                    <span className="shrink-0 text-xs text-slate-400">{durationLabel(event.meeting.startTime, event.meeting.endTime)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={15} className="shrink-0 text-slate-400" />
                  {event.meeting.location ?? 'No location set'}
                </div>

                {event.projectName && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      if (event.meeting.projectId) navigate(`/dashboard/projects/${event.meeting.projectId}`)
                    }}
                    className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: event.projectColor ?? '#0d062d' }} />
                    {event.projectName}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => showToast('info', "Meeting rooms aren't wired up yet")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:brightness-95"
                >
                  <Video size={16} strokeWidth={2} />
                  Join meeting
                </button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
