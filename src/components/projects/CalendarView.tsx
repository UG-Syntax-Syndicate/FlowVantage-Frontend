import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../animate-ui/components/animate/tooltip'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  color: string
  onClick?: () => void
  /** 'deadline' renders as a slim red marker instead of a filled chip, so a project's due date reads as visually distinct from a task. Defaults to a normal chip. */
  variant?: 'task' | 'deadline'
  /** Extra lines shown in the hover tooltip (e.g. project name, status, assignee names). */
  tooltipDetails?: string[]
}

interface CalendarViewProps {
  events: CalendarEvent[]
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function CalendarView({ events }: CalendarViewProps) {
  const [cursor, setCursor] = useState(() => new Date())
  const today = new Date()

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.14)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-900">
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-line text-center text-xs font-medium text-slate-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <TooltipProvider openDelay={150}>
        <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-y-auto">
          {cells.map((date, i) => {
            const dayEvents = date ? events.filter((event) => isSameDay(new Date(event.date), date)) : []
            const deadlineEvents = dayEvents.filter((event) => event.variant === 'deadline')
            const taskEvents = dayEvents.filter((event) => event.variant !== 'deadline')
            return (
              <div
                key={i}
                className={`relative flex min-h-[92px] flex-col gap-1 border-r border-b border-line/70 p-1.5 last:border-r-0 ${
                  date ? '' : 'bg-slate-50/40'
                }`}
              >
                {deadlineEvents.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute inset-y-0 left-0 w-1 rounded-r bg-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <p className="font-semibold">Deadline</p>
                        {deadlineEvents.map((event) => (
                          <p key={event.id}>{event.title}</p>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
                {date && (
                  <span
                    className={`self-start rounded-full px-1.5 text-xs ${
                      isSameDay(date, today) ? 'bg-primary font-semibold text-white' : 'text-slate-500'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  {taskEvents.slice(0, 3).map((event) => (
                    <Tooltip key={event.id}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={event.onClick}
                          className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white ${event.onClick ? 'cursor-pointer hover:brightness-95' : ''}`}
                          style={{ backgroundColor: event.color }}
                        >
                          {event.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <p className="font-semibold">{event.title}</p>
                          {event.tooltipDetails?.map((line, idx) => <p key={idx}>{line}</p>)}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {taskEvents.length > 3 && (
                    <span className="px-1.5 text-[11px] text-slate-400">+{taskEvents.length - 3} more</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
