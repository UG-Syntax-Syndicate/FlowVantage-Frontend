import type { Priority, ProjectStatus, TaskStatus } from '../../types/project'
import { PRIORITY_META, PROJECT_STATUS_META, TASK_STATUS_META } from '../../types/statusMeta'

function Badge({ label, badgeClass, dotClass }: { label: string; badgeClass: string; dotClass: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${badgeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  )
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge {...TASK_STATUS_META[status]} />
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge {...PROJECT_STATUS_META[status]} />
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge {...PRIORITY_META[priority]} />
}
