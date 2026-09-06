import { motion } from 'motion/react'
import type { EnrichedTask } from '../../hooks/useEnrichedTasks'
import { TASK_STATUS_META } from '../../types/statusMeta'
import { formatShortDate } from '../../lib/formatDate'
import { EASE_PREMIUM, staggerDelay } from '../../lib/motion'

interface GanttViewProps {
  tasks: EnrichedTask[]
}

const DAY_MS = 86_400_000
const WINDOW_START_OFFSET_DAYS = -7
const WINDOW_LENGTH_DAYS = 45

export function GanttView({ tasks }: GanttViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const windowStart = new Date(today.getTime() + WINDOW_START_OFFSET_DAYS * DAY_MS)
  const windowEnd = new Date(windowStart.getTime() + WINDOW_LENGTH_DAYS * DAY_MS)
  const windowMs = windowEnd.getTime() - windowStart.getTime()

  const days = Array.from({ length: WINDOW_LENGTH_DAYS }, (_, i) => new Date(windowStart.getTime() + i * DAY_MS))
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  function toOffsetPercent(iso: string): number {
    const clamped = Math.min(Math.max(new Date(iso).getTime(), windowStart.getTime()), windowEnd.getTime())
    return ((clamped - windowStart.getTime()) / windowMs) * 100
  }

  const todayOffset = toOffsetPercent(today.toISOString())

  return (
    <div className="h-full overflow-auto rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.14)]">
      <div className="min-w-[1100px]">
        <div className="sticky top-0 z-10 flex border-b border-line bg-slate-50 text-xs text-slate-500">
          <div className="w-[220px] shrink-0 px-4 py-2.5 font-medium">Task</div>
          <div className="relative flex-1">
            <div className="flex">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`flex-1 border-l border-line/70 px-1 py-2.5 text-center ${
                    day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-100/60' : ''
                  }`}
                >
                  {day.getDate() === 1 || i === 0 ? day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : day.getDate()}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-0 w-px bg-primary/70"
            style={{ left: `calc(220px + ${todayOffset}%)` }}
          />
          {sortedTasks.map((task, i) => {
            const left = toOffsetPercent(task.startDate)
            const right = toOffsetPercent(task.dueDate)
            const width = Math.max(right - left, 2)
            const meta = TASK_STATUS_META[task.status]

            return (
              <div key={task.id} className="flex border-b border-line/70 last:border-b-0">
                <div className="w-[220px] shrink-0 truncate px-4 py-3 text-sm text-slate-700">{task.title}</div>
                <div className="relative flex-1 py-3">
                  <motion.div
                    title={`${task.title} · ${formatShortDate(task.startDate)} – ${formatShortDate(task.dueDate)}`}
                    className="absolute top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-full shadow-[0px_4px_10px_rgba(0,0,0,0.12)]"
                    style={{
                      left: `${left}%`,
                      backgroundColor: task.projectColor,
                    }}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${width}%`, opacity: 1 }}
                    transition={{ duration: 0.5, delay: staggerDelay(i, 0.04), ease: EASE_PREMIUM }}
                  >
                    <span className="absolute inset-0 flex items-center truncate px-2 text-[10px] font-medium whitespace-nowrap text-white/90">
                      {meta.label}
                    </span>
                  </motion.div>
                </div>
              </div>
            )
          })}
          {sortedTasks.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-slate-400">No tasks match your search.</div>
          )}
        </div>
      </div>
    </div>
  )
}
