import { useEffect, useRef } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../animate-ui/components/animate/tooltip'
import type { CalendarEvent, CalendarMeetingEvent, CalendarTaskEvent, CalendarTodoEvent } from '../../types/calendarEvent'
import { calendarEventKey } from '../../types/calendarEvent'
import { isSameDay, isTimedTask, minutesSinceMidnight, toDateOnly } from '../../lib/calendarDate'
import { computeAllDayRowLayout, deadlineEventsForDay } from './monthLayout'
import { packIntervalsIntoLanes } from './intervalLanes'
import { colorForTask, type CalendarColorMode } from './taskColor'
import { formatShortDate, formatTime } from '../../lib/formatDate'
import { TASK_STATUS_META } from '../../types/statusMeta'

const PIXELS_PER_HOUR = 56
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const GUTTER_WIDTH = 56
const INITIAL_SCROLL_HOUR = 7
const MIN_TIMED_MINUTES = 30
const ALL_DAY_LANE_HEIGHT = 20

/** A meeting, or a "timed" (specific-hour) task - both render as a positioned block in the hourly grid. */
type TimedItem = CalendarMeetingEvent | CalendarTaskEvent

function timedRange(item: TimedItem): { start: number; end: number } {
  const start = minutesSinceMidnight(item.kind === 'meeting' ? item.meeting.startTime : item.task.startDate)
  const rawEnd =
    item.kind === 'meeting'
      ? start + (new Date(item.meeting.endTime).getTime() - new Date(item.meeting.startTime).getTime()) / 60_000
      : minutesSinceMidnight(item.task.dueDate)
  return { start, end: Math.max(rawEnd, start + MIN_TIMED_MINUTES) }
}

function hourLabel(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

interface CalendarTimeGridProps {
  /** 7 dates for week view, 1 date for day view - day view is just this component with a single-element array. */
  days: Date[]
  events: CalendarEvent[]
  colorMode: CalendarColorMode
  onTaskClick: (event: CalendarTaskEvent) => void
  onTodoClick: (event: CalendarTodoEvent) => void
  onMeetingClick: (event: CalendarMeetingEvent) => void
  onDeadlineClick: (projectId: string) => void
}

export function CalendarTimeGrid({ days, events, colorMode, onTaskClick, onTodoClick, onMeetingClick, onDeadlineClick }: CalendarTimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  const gridTemplateColumns = `${GUTTER_WIDTH}px repeat(${days.length}, 1fr)`

  // Timed tasks render in the hourly grid below, like a meeting - not in this all-day band.
  const allDay = computeAllDayRowLayout(days, events, 6, 4, false)
  const allDayLanesUsed = Math.max(1, ...allDay.bars.map((b) => b.lane + 1))
  const hasAllDayContent = allDay.bars.length > 0 || allDay.singleDayChipsByDay.some((d) => d.length > 0)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: INITIAL_SCROLL_HOUR * PIXELS_PER_HOUR })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length])

  return (
    <TooltipProvider openDelay={150}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="grid border-b border-line" style={{ gridTemplateColumns }}>
          <div />
          {days.map((day) => {
            const deadlines = deadlineEventsForDay(events, day)
            return (
              <div key={day.toISOString()} className="relative flex flex-col items-center gap-0.5 border-l border-line/70 py-2">
                {deadlines.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onDeadlineClick(deadlines[0].project.id)}
                        className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-rose-500"
                        aria-label="Project deadline"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-semibold">Deadline</p>
                      {deadlines.map((e) => (
                        <p key={calendarEventKey(e)} className="text-xs">
                          {e.project.name}
                        </p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                )}
                <span className="text-[11px] font-medium text-slate-400">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                    isSameDay(day, today) ? 'bg-primary text-white' : 'text-slate-700'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            )
          })}
        </div>

        {hasAllDayContent && (
          <div
            className="relative grid max-h-[160px] overflow-y-auto border-b border-line py-1"
            style={{ gridTemplateColumns }}
          >
            <div className="pt-0.5 pl-1 text-[10px] font-medium text-slate-400">All-day</div>
            {days.map((_day, col) => (
              <div
                key={col}
                className="flex flex-col gap-1 border-l border-line/70 px-1"
                style={{ paddingTop: allDayLanesUsed * ALL_DAY_LANE_HEIGHT }}
              >
                {allDay.singleDayChipsByDay[col].map((event) => {
                  // Timed tasks (includeTimedTasksAsChips: false above) never reach this band -
                  // they render in the hourly grid below, like a meeting.
                  if (event.kind === 'task') return null
                  return event.kind === 'todo' ? (
                    <button
                      key={calendarEventKey(event)}
                      type="button"
                      onClick={() => onTodoClick(event)}
                      className="flex items-center gap-1 truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-600 hover:bg-slate-200"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                      <span className="truncate">{event.todo.title}</span>
                    </button>
                  ) : (
                    <button
                      key={calendarEventKey(event)}
                      type="button"
                      onClick={() => onMeetingClick(event)}
                      style={{ borderLeftColor: event.projectColor ?? '#0d062d' }}
                      className="flex items-center gap-1 truncate rounded-md border-l-2 bg-white px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <span className="truncate">
                        {formatTime(event.meeting.startTime)} · {event.meeting.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}

            <div
              className="pointer-events-none absolute inset-x-0 top-0 grid"
              style={{ gridTemplateColumns, gridTemplateRows: `repeat(${allDayLanesUsed}, ${ALL_DAY_LANE_HEIGHT}px)`, paddingTop: 4 }}
            >
              {allDay.bars.map((bar) => (
                <Tooltip key={calendarEventKey(bar.event)}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onTaskClick(bar.event)}
                      style={{
                        gridColumn: `${bar.startCol + 2} / span ${bar.span}`,
                        gridRow: bar.lane + 1,
                        backgroundColor: colorForTask(bar.event.task, colorMode),
                        marginLeft: bar.continuesFromPrevRow ? 0 : 4,
                        marginRight: bar.continuesToNextRow ? 0 : 4,
                      }}
                      className="pointer-events-auto truncate rounded-md px-1.5 text-left text-[11px] font-medium text-white hover:brightness-95"
                    >
                      {bar.continuesFromPrevRow && '‹ '}
                      {bar.event.task.title}
                      {bar.continuesToNextRow && ' ›'}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-0.5 text-xs">
                      <p className="font-semibold">{bar.event.task.title}</p>
                      <p>Due {formatShortDate(bar.event.task.dueDate)}</p>
                      <p>{TASK_STATUS_META[bar.event.task.status].label}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid" style={{ gridTemplateColumns }}>
            <div className="relative" style={{ height: 24 * PIXELS_PER_HOUR }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-slate-400"
                  style={{ top: hour * PIXELS_PER_HOUR }}
                >
                  {hour > 0 && hourLabel(hour)}
                </div>
              ))}
            </div>

            {days.map((day, col) => {
              const dayMeetings = events.filter(
                (e): e is CalendarMeetingEvent => e.kind === 'meeting' && isSameDay(toDateOnly(e.meeting.startTime), day),
              )
              const dayTimedTasks = events.filter(
                (e): e is CalendarTaskEvent =>
                  e.kind === 'task' && isTimedTask(e.task.startDate, e.task.dueDate) && isSameDay(toDateOnly(e.task.startDate), day),
              )
              const dayTimedItems: TimedItem[] = [...dayMeetings, ...dayTimedTasks]
              const { packed, laneCount } = packIntervalsIntoLanes(
                dayTimedItems,
                (item) => timedRange(item).start,
                (item) => timedRange(item).end,
              )
              return (
                <div key={col} className="relative border-l border-line/70" style={{ height: 24 * PIXELS_PER_HOUR }}>
                  {HOURS.map((hour) => (
                    <div key={hour} className="absolute inset-x-0 border-t border-line/50" style={{ top: hour * PIXELS_PER_HOUR }} />
                  ))}
                  {packed.map(({ item, start, end, lane }) => {
                    const color = item.kind === 'meeting' ? (item.projectColor ?? '#0d062d') : colorForTask(item.task, colorMode)
                    const title = item.kind === 'meeting' ? item.meeting.title : item.task.title
                    const timeLabel = formatTime(item.kind === 'meeting' ? item.meeting.startTime : item.task.startDate)
                    return (
                      <Tooltip key={calendarEventKey(item)}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => (item.kind === 'meeting' ? onMeetingClick(item) : onTaskClick(item))}
                            style={{
                              top: (start / 60) * PIXELS_PER_HOUR,
                              height: ((end - start) / 60) * PIXELS_PER_HOUR - 2,
                              left: `${(lane / laneCount) * 100}%`,
                              width: `${100 / laneCount}%`,
                              borderLeftColor: color,
                            }}
                            className="absolute overflow-hidden rounded-md border-l-[3px] bg-white px-1.5 py-1 text-left text-[11px] shadow-sm hover:bg-slate-50"
                          >
                            <p className="truncate font-medium text-slate-800">{title}</p>
                            <p className="truncate text-slate-400">{timeLabel}</p>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {item.kind === 'meeting' ? (
                            <>
                              <p className="text-xs font-semibold">{item.meeting.title}</p>
                              <p className="text-xs">
                                {formatTime(item.meeting.startTime)}–{formatTime(item.meeting.endTime)}
                              </p>
                              {item.meeting.location && <p className="text-xs">{item.meeting.location}</p>}
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-semibold">{item.task.title}</p>
                              <p className="text-xs">
                                {formatTime(item.task.startDate)}–{formatTime(item.task.dueDate)}
                              </p>
                              <p className="text-xs">{TASK_STATUS_META[item.task.status].label}</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
