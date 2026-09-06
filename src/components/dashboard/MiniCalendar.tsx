import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Task } from '../../types/project'
import { Card } from '../ui/card'

interface MiniCalendarProps {
  tasks: Task[]
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function MiniCalendar({ tasks }: MiniCalendarProps) {
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

  return (
    <Card className="block rounded-2xl border border-line bg-white p-4 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)] ring-0">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center text-[11px] text-slate-400">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i}>{label}</div>
        ))}
        {cells.map((date, i) => {
          const hasTask = date ? tasks.some((t) => isSameDay(new Date(t.dueDate), date)) : false
          const isToday = date ? isSameDay(date, today) : false
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 py-0.5">
              {date && (
                <>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday ? 'bg-primary font-semibold text-white' : 'text-slate-600'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span className={`h-1 w-1 rounded-full ${hasTask ? 'bg-primary' : 'bg-transparent'}`} />
                </>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
