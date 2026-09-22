import { useNavigate } from 'react-router-dom'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { CalendarView, type CalendarEvent } from '../../components/projects/CalendarView'
import { useProjects } from '../../hooks/useProjectsData'
import { useEnrichedTasks } from '../../hooks/useEnrichedTasks'
import { TASK_STATUS_META } from '../../types/statusMeta'
import { formatShortDate } from '../../lib/formatDate'
import { Skeleton } from '../../components/ui/skeleton'

export function CalendarPage() {
  const navigate = useNavigate()
  const { data: projects = [], isLoading } = useProjects()
  const { tasks, isLoading: tasksLoading } = useEnrichedTasks()

  const taskEvents: CalendarEvent[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    date: task.dueDate,
    color: task.projectColor,
    onClick: () => navigate(`/dashboard/projects/${task.projectId}`),
    tooltipDetails: [
      `Due ${formatShortDate(task.dueDate)}`,
      task.projectName,
      TASK_STATUS_META[task.status].label,
      ...(task.assignees.length ? [task.assignees.map((a) => a.name).join(', ')] : []),
    ],
  }))

  const deadlineEvents: CalendarEvent[] = projects.map((project) => ({
    id: `deadline-${project.id}`,
    title: project.name,
    date: project.dueDate,
    color: project.color,
    variant: 'deadline',
    onClick: () => navigate(`/dashboard/projects/${project.id}`),
  }))

  const events = [...taskEvents, ...deadlineEvents]

  return (
    <div className="flex h-full flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar title="Calendar" subtitle="Tasks and project deadlines at a glance." />
      <div className="min-h-[600px] flex-1">
        {isLoading || tasksLoading ? (
          <Skeleton className="h-full min-h-[600px] w-full rounded-2xl" />
        ) : (
          <CalendarView events={events} />
        )}
      </div>
    </div>
  )
}
