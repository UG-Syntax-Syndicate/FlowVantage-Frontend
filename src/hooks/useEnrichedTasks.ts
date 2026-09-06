import { useMemo } from 'react'
import { useMembers, useProjects, useTasks } from './useProjectsData'
import type { Member, Task } from '../types/project'

export interface EnrichedTask extends Task {
  projectName: string
  projectColor: string
  assignees: Member[]
}

/**
 * Derived, read-only projection over the cached tasks/projects/members
 * queries - never its own copy of server state. Every Projects view (list,
 * board, gantt, calendar) reads through this single hook so they can never
 * disagree about what a task's project or assignees are.
 */
export function useEnrichedTasks() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: members = [] } = useMembers()

  const enrichedTasks = useMemo<EnrichedTask[]>(() => {
    const projectById = new Map(projects.map((p) => [p.id, p]))
    const memberById = new Map(members.map((m) => [m.id, m]))

    return tasks.map((task) => {
      const project = projectById.get(task.projectId)
      return {
        ...task,
        projectName: project?.name ?? 'Unknown project',
        projectColor: project?.color ?? '#94a3b8',
        assignees: task.assigneeIds
          .map((id) => memberById.get(id))
          .filter((member): member is Member => Boolean(member)),
      }
    })
  }, [tasks, projects, members])

  return {
    tasks: enrichedTasks,
    projects,
    members,
    isLoading: tasksLoading || projectsLoading,
  }
}
