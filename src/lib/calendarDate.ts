/** Native-Date calendar helpers - no date library, matching the rest of the codebase (see formatDate.ts). */

export function toDateOnly(value: string | Date): Date {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function startOfWeek(date: Date): Date {
  return addDays(toDateOnly(date), -date.getDay())
}

/** The full visible month grid for `cursor`'s month, as weeks of 7 dates (padded with adjacent-month days). */
export function getMonthGridWeeks(cursor: Date): Date[][] {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Date[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(addDays(firstOfMonth, i - startWeekday))
  for (let i = 0; i < daysInMonth; i++) cells.push(new Date(year, month, i + 1))
  while (cells.length % 7 !== 0) cells.push(addDays(cells[cells.length - 1], 1))

  const weeks: Date[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function minutesSinceMidnight(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

/** True if `iso` carries a real time-of-day (not just a date defaulted to local midnight). */
export function hasTimeOfDay(iso: string): boolean {
  const d = new Date(iso)
  return d.getHours() !== 0 || d.getMinutes() !== 0
}

/**
 * A task is "timed" (rendered like a meeting, at a specific hour) when it's a
 * single-day task with a real start or due time - as opposed to a multi-day
 * or plain all-day task, which renders as a spanning/all-day bar instead.
 */
export function isTimedTask(startDate: string, dueDate: string): boolean {
  if (!isSameDay(toDateOnly(startDate), toDateOnly(dueDate))) return false
  return hasTimeOfDay(startDate) || hasTimeOfDay(dueDate)
}
