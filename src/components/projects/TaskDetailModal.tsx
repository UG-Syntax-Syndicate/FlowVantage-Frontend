import { CalendarDays, Flag, FolderKanban, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'
import { AvatarStack } from '../dashboard/AvatarStack'
import { PriorityBadge } from './StatusBadge'
import { TaskCommentThread } from '../collaboration/TaskCommentThread'
import { useUpdateTaskStatus } from '../../hooks/useProjectsData'
import { TASK_STATUS_META, TASK_STATUS_ORDER } from '../../types/statusMeta'
import { formatDateTime } from '../../lib/formatDate'
import { isTaskOverdue } from '../../lib/taskStats'
import type { TaskStatus } from '../../types/project'
import type { EnrichedTask } from '../../hooks/useEnrichedTasks'

interface TaskDetailModalProps {
  task: EnrichedTask
  onClose: () => void
}

function Field({ icon: Icon, label, children }: { icon: typeof CalendarDays; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={15} className="shrink-0 text-slate-400" />
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto flex items-center gap-2 text-slate-900">{children}</span>
    </div>
  )
}

/**
 * A task, opened from any Projects view.
 *
 * There was no task detail view at all before this - tasks existed only as
 * rows and cards with an inline status select - which is why the comment
 * thread, shipped with a complete backend, had nowhere to live.
 */
export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const updateTaskStatus = useUpdateTaskStatus()
  const overdue = isTaskOverdue(task)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">{task.title}</DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Created {formatDateTime(task.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field icon={FolderKanban} label="Project">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: task.projectColor }} aria-hidden />
            {task.projectName}
          </Field>
          <Field icon={Users} label="Assignees">
            {task.assignees.length > 0 ? (
              <AvatarStack members={task.assignees} size={22} />
            ) : (
              <span className="text-slate-400">Unassigned</span>
            )}
          </Field>
          <Field icon={Flag} label="Priority">
            <PriorityBadge priority={task.priority} />
          </Field>
          <Field icon={CalendarDays} label="Due">
            <span className={overdue ? 'font-medium text-rose-600' : undefined}>{formatDateTime(task.dueDate)}</span>
          </Field>

          <div className="flex items-center gap-3 text-sm">
            <span className={`h-2 w-2 shrink-0 rounded-full ${TASK_STATUS_META[task.status].dotClass}`} aria-hidden />
            <span className="text-slate-500">Status</span>
            <div className="ml-auto w-40">
              <Select
                value={task.status}
                onValueChange={(status) => updateTaskStatus.mutate({ taskId: task.id, status: status as TaskStatus })}
              >
                <SelectTrigger>
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
            </div>
          </div>
        </div>

        <Separator />

        <TaskCommentThread taskId={task.id} projectId={task.projectId} />
      </DialogContent>
    </Dialog>
  )
}
