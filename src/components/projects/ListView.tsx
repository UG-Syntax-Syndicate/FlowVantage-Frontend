import { TASK_STATUS_ORDER, TASK_STATUS_META } from '../../types/statusMeta'
import type { TaskStatus } from '../../types/project'
import type { EnrichedTask } from '../../hooks/useEnrichedTasks'
import { useUpdateTaskStatus } from '../../hooks/useProjectsData'
import { AvatarStack } from '../dashboard/AvatarStack'
import { PriorityBadge } from './StatusBadge'
import { formatShortDate } from '../../lib/formatDate'
import { isTaskOverdue } from '../../lib/taskStats'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

interface ListViewProps {
  tasks: EnrichedTask[]
}

export function ListView({ tasks }: ListViewProps) {
  const updateTaskStatus = useUpdateTaskStatus()

  return (
    <div className="h-full overflow-auto rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.14)]">
      <Table className="min-w-[720px]">
        <TableHeader className="sticky top-0 z-10 bg-slate-50 text-xs font-medium text-slate-500">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-5 py-3">Task</TableHead>
            <TableHead className="px-5 py-3">Project</TableHead>
            <TableHead className="px-5 py-3">Assignees</TableHead>
            <TableHead className="px-5 py-3">Priority</TableHead>
            <TableHead className="px-5 py-3">Status</TableHead>
            <TableHead className="px-5 py-3">Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const overdue = isTaskOverdue(task)
            return (
              <TableRow key={task.id} className="border-t border-line hover:bg-slate-50/60">
                <TableCell className="max-w-[260px] truncate px-5 py-3.5 font-medium text-slate-900">
                  {task.title}
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: task.projectColor }}
                      aria-hidden
                    />
                    {task.projectName}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <AvatarStack members={task.assignees} size={24} />
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <PriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <Select
                    value={task.status}
                    onValueChange={(value) => updateTaskStatus.mutate({ taskId: task.id, status: value as TaskStatus })}
                  >
                    <SelectTrigger
                      size="sm"
                      className={`h-auto gap-1 rounded-full border-0 px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary/40 ${TASK_STATUS_META[task.status].badgeClass}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS_ORDER.map((status) => (
                        <SelectItem key={status} value={status}>
                          {TASK_STATUS_META[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className={`px-5 py-3.5 whitespace-nowrap ${overdue ? 'font-medium text-rose-600' : 'text-slate-500'}`}>
                  {formatShortDate(task.dueDate)}
                </TableCell>
              </TableRow>
            )
          })}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                No tasks match your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
