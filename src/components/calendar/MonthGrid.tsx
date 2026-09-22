import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../animate-ui/components/animate/tooltip'
import type { CalendarEvent, CalendarMeetingEvent, CalendarTaskEvent, CalendarTodoEvent } from '../../types/calendarEvent'
import { calendarEventKey } from '../../types/calendarEvent'
import { getMonthGridWeeks, isSameDay } from '../../lib/calendarDate'
import { computeAllDayRowLayout, deadlineEventsForDay } from './monthLayout'
import { colorForTask, type CalendarColorMode } from './taskColor'
import { formatShortDate, formatTime } from '../../lib/formatDate'
import { TASK_STATUS_META } from '../../types/statusMeta'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_LANES = 3
const MAX_CHIPS_PER_DAY = 2
const LANE_HEIGHT = 20
const BARS_TOP_OFFSET = 26

interface MonthGridProps {
  cursor: Date
  events: CalendarEvent[]
  colorMode: CalendarColorMode
  onTaskClick: (event: CalendarTaskEvent) => void
  onTodoClick: (event: CalendarTodoEvent) => void
  onMeetingClick: (event: CalendarMeetingEvent) => void
  onDeadlineClick: (projectId: string) => void
  onOverflowClick: (day: Date) => void
}

export function MonthGrid({ cursor, events, colorMode, onTaskClick, onTodoClick, onMeetingClick, onDeadlineClick, onOverflowClick }: MonthGridProps) {
  const weeks = getMonthGridWeeks(cursor)
  const today = new Date()

  return (
    <TooltipProvider openDelay={150}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line text-center text-xs font-medium text-slate-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-2">
              {label}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {weeks.map((week, weekIdx) => {
            const layout = computeAllDayRowLayout(week, events, MAX_LANES, MAX_CHIPS_PER_DAY)
            return (
              <div key={weekIdx} className="relative grid min-h-[152px] grid-cols-7 border-b border-line/70 last:border-b-0">
                {week.map((day, col) => {
                  const inMonth = day.getMonth() === cursor.getMonth()
                  const deadlines = deadlineEventsForDay(events, day)
                  const chips = layout.singleDayChipsByDay[col]
                  const overflow = layout.overflowCountByDay[col]
                  return (
                    <div
                      key={col}
                      className={`relative flex flex-col gap-1 border-r border-line/70 p-1.5 last:border-r-0 ${inMonth ? '' : 'bg-slate-50/50'}`}
                    >
                      {deadlines.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onDeadlineClick(deadlines[0].project.id)}
                              className="absolute inset-y-0 left-0 w-1 rounded-r bg-rose-500"
                              aria-label="Project deadline"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col gap-0.5 text-xs">
                              <p className="font-semibold">Deadline</p>
                              {deadlines.map((event) => (
                                <p key={calendarEventKey(event)}>{event.project.name}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <span
                        className={`h-5 w-fit self-start rounded-full px-1.5 text-xs ${
                          isSameDay(day, today) ? 'bg-primary font-semibold text-white' : inMonth ? 'text-slate-500' : 'text-slate-300'
                        }`}
                      >
                        {day.getDate()}
                      </span>

                      <div style={{ height: MAX_LANES * LANE_HEIGHT }} aria-hidden />

                      <div className="flex flex-col gap-1">
                        {chips.map((event) =>
                          event.kind === 'todo' ? (
                            <Tooltip key={calendarEventKey(event)}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => onTodoClick(event)}
                                  className="flex items-center gap-1 truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-600 hover:bg-slate-200"
                                >
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                                  <span className="truncate">{event.todo.title}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-semibold">{event.todo.title}</p>
                                <p className="text-xs">Due {formatShortDate(event.todo.dueDate)}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : event.kind === 'meeting' ? (
                            <Tooltip key={calendarEventKey(event)}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => onMeetingClick(event)}
                                  style={{ borderLeftColor: event.projectColor ?? '#0d062d' }}
                                  className="flex items-center gap-1 truncate rounded-md border-l-2 bg-white px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                  <span className="truncate">
                                    {formatTime(event.meeting.startTime)} · {event.meeting.title}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-semibold">{event.meeting.title}</p>
                                <p className="text-xs">
                                  {formatTime(event.meeting.startTime)}–{formatTime(event.meeting.endTime)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip key={calendarEventKey(event)}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => onTaskClick(event)}
                                  style={{ borderLeftColor: colorForTask(event.task, colorMode) }}
                                  className="flex items-center gap-1 truncate rounded-md border-l-2 bg-white px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                  <span className="truncate">
                                    {formatTime(event.task.startDate)} · {event.task.title}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-semibold">{event.task.title}</p>
                                <p className="text-xs">{formatTime(event.task.startDate)}</p>
                                <p className="text-xs">{TASK_STATUS_META[event.task.status].label}</p>
                              </TooltipContent>
                            </Tooltip>
                          ),
                        )}
                        {overflow > 0 && (
                          <button
                            type="button"
                            onClick={() => onOverflowClick(day)}
                            className="px-1.5 text-left text-[11px] font-medium text-primary hover:underline"
                          >
                            +{overflow} more
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div
                  className="pointer-events-none absolute inset-x-0 grid grid-cols-7"
                  style={{ top: BARS_TOP_OFFSET, gridTemplateRows: `repeat(${MAX_LANES}, ${LANE_HEIGHT}px)`, alignContent: 'start' }}
                >
                  {layout.bars.map((bar) => (
                    <Tooltip key={calendarEventKey(bar.event)}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onTaskClick(bar.event)}
                          style={{
                            gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                            gridRow: bar.lane + 1,
                            backgroundColor: colorForTask(bar.event.task, colorMode),
                            marginLeft: bar.continuesFromPrevRow ? 0 : 4,
                            marginRight: bar.continuesToNextRow ? 0 : 4,
                            borderTopLeftRadius: bar.continuesFromPrevRow ? 0 : 6,
                            borderBottomLeftRadius: bar.continuesFromPrevRow ? 0 : 6,
                            borderTopRightRadius: bar.continuesToNextRow ? 0 : 6,
                            borderBottomRightRadius: bar.continuesToNextRow ? 0 : 6,
                          }}
                          className="pointer-events-auto truncate px-1.5 text-left text-[11px] font-medium text-white hover:brightness-95"
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
                          <p>{bar.event.task.projectName}</p>
                          <p>{TASK_STATUS_META[bar.event.task.status].label}</p>
                          {bar.event.task.assignees.length > 0 && <p>{bar.event.task.assignees.map((a) => a.name).join(', ')}</p>}
                          {bar.event.task.tags.length > 0 && <p>{bar.event.task.tags.join(', ')}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
