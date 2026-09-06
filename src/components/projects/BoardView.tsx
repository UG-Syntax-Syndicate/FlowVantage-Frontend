import { useState } from 'react'
import type { DragEvent } from 'react'
import { TASK_STATUS_ORDER, TASK_STATUS_META } from '../../types/statusMeta'
import type { TaskStatus } from '../../types/project'
import type { EnrichedTask } from '../../hooks/useEnrichedTasks'
import { useUpdateTaskStatus } from '../../hooks/useProjectsData'
import { AvatarStack } from '../dashboard/AvatarStack'
import { PriorityBadge } from './StatusBadge'
import { formatShortDate } from '../../lib/formatDate'

interface BoardViewProps {
  tasks: EnrichedTask[]
}

export function BoardView({ tasks }: BoardViewProps) {
  const updateTaskStatus = useUpdateTaskStatus()
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  function handleDrop(status: TaskStatus, event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOverColumn(null)
    const taskId = event.dataTransfer.getData('text/plain')
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== status) {
      updateTaskStatus.mutate({ taskId, status })
    }
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-2">
      {TASK_STATUS_ORDER.map((status) => {
        const meta = TASK_STATUS_META[status]
        const columnTasks = tasks.filter((task) => task.status === status)

        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverColumn(status)
            }}
            onDragLeave={() => setDragOverColumn((current) => (current === status ? null : current))}
            onDrop={(e) => handleDrop(status, e)}
            className={`flex w-[280px] shrink-0 flex-col gap-3 rounded-2xl border p-3 transition-colors ${
              dragOverColumn === status ? 'border-primary/40 bg-accent-50/40' : 'border-line bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between px-1.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                {meta.label}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-400 shadow-sm">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 overflow-y-auto">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                  className="cursor-grab rounded-xl border border-line bg-white p-3.5 shadow-[0px_10px_24px_4px_rgba(152,150,163,0.14)] active:cursor-grabbing"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.projectColor }} />
                    <span className="truncate">{task.projectName}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs text-slate-400">{formatShortDate(task.dueDate)}</span>
                  </div>
                  <div className="mt-3">
                    <AvatarStack members={task.assignees} size={22} />
                  </div>
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-line/80 py-6 text-center text-xs text-slate-400">
                  Drop a task here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
