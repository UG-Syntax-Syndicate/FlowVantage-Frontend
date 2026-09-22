import type { CalendarDeadlineEvent, CalendarEvent, CalendarMeetingEvent, CalendarTaskEvent, CalendarTodoEvent } from '../../types/calendarEvent'
import { isSameDay, isTimedTask, toDateOnly } from '../../lib/calendarDate'
import { packIntervalsIntoLanes } from './intervalLanes'

export interface PositionedBar {
  event: CalendarTaskEvent
  startCol: number
  span: number
  lane: number
  continuesFromPrevRow: boolean
  continuesToNextRow: boolean
}

export type SingleDayChipEvent = CalendarTodoEvent | CalendarMeetingEvent | CalendarTaskEvent

export interface AllDayRowLayout {
  bars: PositionedBar[]
  /** Todo/meeting/timed-task single-day chips, capped at `maxChipsPerDay`, one array per day (same order as `days`). */
  singleDayChipsByDay: SingleDayChipEvent[][]
  /** Hidden bar-columns + hidden chips per day, for a "+N more" affordance. */
  overflowCountByDay: number[]
}

const DEFAULT_MAX_LANES = 3
const DEFAULT_MAX_CHIPS_PER_DAY = 2

/**
 * Lays out one row of an all-day band (a month week-row, or the week/day
 * all-day strip): clips each non-timed task's [startDate, dueDate] span to
 * this row's date window, lane-packs the resulting bars so overlapping tasks
 * stack instead of colliding, and buckets todos/meetings as single-day chips.
 *
 * "Timed" tasks (single-day, with a real start/due time - see isTimedTask)
 * are excluded from the bars entirely; the month view still shows them as a
 * time-labeled chip (`includeTimedTasksAsChips`), but the week/day view
 * renders them in the hourly grid instead, like a meeting, so that call site
 * passes `includeTimedTasksAsChips: false`.
 */
export function computeAllDayRowLayout(
  days: Date[],
  events: CalendarEvent[],
  maxLanes = DEFAULT_MAX_LANES,
  maxChipsPerDay = DEFAULT_MAX_CHIPS_PER_DAY,
  includeTimedTasksAsChips = true,
): AllDayRowLayout {
  const rowStart = days[0]
  const rowEnd = days[days.length - 1]

  const segments = events
    .filter((e): e is CalendarTaskEvent => e.kind === 'task' && !isTimedTask(e.task.startDate, e.task.dueDate))
    .map((event) => {
      const start = toDateOnly(event.task.startDate)
      const due = toDateOnly(event.task.dueDate)
      if (due < rowStart || start > rowEnd) return null
      const segStart = start < rowStart ? rowStart : start
      const segEnd = due > rowEnd ? rowEnd : due
      const startCol = days.findIndex((day) => isSameDay(day, segStart))
      const endCol = days.findIndex((day) => isSameDay(day, segEnd))
      if (startCol === -1 || endCol === -1) return null
      return {
        event,
        startCol,
        endCol,
        continuesFromPrevRow: start < rowStart,
        continuesToNextRow: due > rowEnd,
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)

  const { packed } = packIntervalsIntoLanes(
    segments,
    (s) => s.startCol,
    (s) => s.endCol,
  )

  const bars: PositionedBar[] = packed
    .filter((p) => p.lane < maxLanes)
    .map((p) => ({
      event: p.item.event,
      startCol: p.item.startCol,
      span: p.item.endCol - p.item.startCol + 1,
      lane: p.lane,
      continuesFromPrevRow: p.item.continuesFromPrevRow,
      continuesToNextRow: p.item.continuesToNextRow,
    }))

  const overflowCountByDay = Array(days.length).fill(0) as number[]
  for (const p of packed) {
    if (p.lane < maxLanes) continue
    for (let col = p.item.startCol; col <= p.item.endCol; col++) overflowCountByDay[col]++
  }

  const singleDayChipsByDay = days.map((day) =>
    events.filter((e): e is SingleDayChipEvent => {
      if (e.kind === 'todo') return isSameDay(toDateOnly(e.todo.dueDate), day)
      if (e.kind === 'meeting') return isSameDay(toDateOnly(e.meeting.startTime), day)
      if (e.kind === 'task' && includeTimedTasksAsChips) {
        return isTimedTask(e.task.startDate, e.task.dueDate) && isSameDay(toDateOnly(e.task.startDate), day)
      }
      return false
    }),
  )

  singleDayChipsByDay.forEach((items, i) => {
    if (items.length > maxChipsPerDay) overflowCountByDay[i] += items.length - maxChipsPerDay
  })

  return {
    bars,
    singleDayChipsByDay: singleDayChipsByDay.map((items) => items.slice(0, maxChipsPerDay)),
    overflowCountByDay,
  }
}

/** Project-deadline markers touching a given day (deadline events are always single-day). */
export function deadlineEventsForDay(events: CalendarEvent[], day: Date): CalendarDeadlineEvent[] {
  return events.filter((e): e is CalendarDeadlineEvent => e.kind === 'deadline' && isSameDay(toDateOnly(e.project.dueDate), day))
}
