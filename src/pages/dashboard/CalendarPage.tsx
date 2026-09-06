import { useNavigate } from 'react-router-dom'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { CalendarView } from '../../components/projects/CalendarView'
import { useProjects } from '../../hooks/useProjectsData'

export function CalendarPage() {
  const navigate = useNavigate()
  const { data: projects = [], isLoading } = useProjects()

  const events = projects.map((project) => ({
    id: project.id,
    title: project.name,
    date: project.dueDate,
    color: project.color,
    onClick: () => navigate(`/dashboard/projects/${project.id}`),
  }))

  return (
    <div className="flex h-full flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar title="Calendar" subtitle="Project deadlines at a glance." />
      <div className="min-h-[600px] flex-1">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-400">Loading calendar…</p>
        ) : (
          <CalendarView events={events} />
        )}
      </div>
    </div>
  )
}
