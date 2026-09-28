import { useMemo, useState } from 'react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { CalendarBoard } from '../../components/calendar/CalendarBoard'
import { CalendarFilterBar, ALL_PROJECTS } from '../../components/calendar/CalendarFilterBar'
import { AddTaskFlow } from '../../components/calendar/AddTaskFlow'
import { useProjects, useMeetings, useTodos } from '../../hooks/useProjectsData'
import { useEnrichedTasks } from '../../hooks/useEnrichedTasks'
import { useWorkspaceMembers } from '../../hooks/useWorkspacesData'
import { useWorkspace } from '../../hooks/useWorkspace'
import type { CalendarEvent } from '../../types/calendarEvent'

export function CalendarPage() {
  const { activeWorkspaceId } = useWorkspace()
  const { data: workspaceMembers = [] } = useWorkspaceMembers(activeWorkspaceId ?? undefined)
  const { tasks, isLoading: tasksLoading } = useEnrichedTasks()
  const { data: allProjects = [], isLoading: projectsLoading } = useProjects()
  const { data: todos = [], isLoading: todosLoading } = useTodos()
  const { data: meetings = [], isLoading: meetingsLoading } = useMeetings()

  const [projectFilter, setProjectFilter] = useState<string>(ALL_PROJECTS)
  const [memberFilter, setMemberFilter] = useState<Set<string>>(new Set())

  const projectById = useMemo(() => new Map(allProjects.map((p) => [p.id, p])), [allProjects])

  const events = useMemo<CalendarEvent[]>(() => {
    const filteredTasks = tasks.filter((task) => {
      if (projectFilter !== ALL_PROJECTS && task.projectId !== projectFilter) return false
      if (memberFilter.size > 0 && !task.assigneeIds.some((id) => memberFilter.has(id))) return false
      return true
    })
    const filteredTodos = todos.filter((todo) => projectFilter === ALL_PROJECTS || todo.projectId === projectFilter)
    const filteredMeetings = meetings.filter((meeting) => projectFilter === ALL_PROJECTS || meeting.projectId === projectFilter)
    const filteredProjects = allProjects.filter((project) => projectFilter === ALL_PROJECTS || project.id === projectFilter)

    return [
      ...filteredTasks.map((task): CalendarEvent => ({ kind: 'task', task })),
      ...filteredTodos.map((todo): CalendarEvent => ({ kind: 'todo', todo, projectName: projectById.get(todo.projectId)?.name })),
      ...filteredMeetings.map((meeting): CalendarEvent => {
        const project = meeting.projectId ? projectById.get(meeting.projectId) : undefined
        return { kind: 'meeting', meeting, projectName: project?.name, projectColor: project?.color }
      }),
      ...filteredProjects.map((project): CalendarEvent => ({ kind: 'deadline', project })),
    ]
  }, [tasks, todos, meetings, allProjects, projectById, projectFilter, memberFilter])

  const isLoading = tasksLoading || projectsLoading || todosLoading || meetingsLoading

  return (
    <div className="flex h-full flex-col gap-4 p-6 sm:p-8">
      <PageHeaderBar title="Calendar" subtitle="Tasks, todos, meetings, and project deadlines at a glance." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CalendarFilterBar
          projects={allProjects}
          workspaceMembers={workspaceMembers}
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          memberFilter={memberFilter}
          onMemberFilterChange={setMemberFilter}
        />
        <AddTaskFlow projects={allProjects} />
      </div>

      <div className="min-h-[600px] flex-1">
        <CalendarBoard events={events} isLoading={isLoading} />
      </div>
    </div>
  )
}
