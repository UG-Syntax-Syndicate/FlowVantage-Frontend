import type { Project, Task } from '../types/project'

/**
 * Single source of truth for "is this task overdue" - derived from status +
 * dueDate, never stored as its own field, so it can never drift out of sync.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  return task.status !== 'done' && new Date(task.dueDate).getTime() < now.getTime()
}

export function computeTaskStats(tasks: Task[]) {
  const now = new Date()
  return {
    completed: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    pendingReview: tasks.filter((t) => t.status === 'in_review').length,
    overdue: tasks.filter((t) => isTaskOverdue(t, now)).length,
  }
}

/** Same pattern as isTaskOverdue, for projects instead of tasks. */
export function isProjectOverdue(project: Project, now: Date = new Date()): boolean {
  return project.status !== 'completed' && new Date(project.dueDate).getTime() < now.getTime()
}

export function computeProjectStats(projects: Project[]) {
  const now = new Date()
  return {
    total: projects.length,
    completed: projects.filter((p) => p.status === 'completed').length,
    pending: projects.filter((p) => p.status === 'planning' || p.status === 'on_hold').length,
    overdue: projects.filter((p) => isProjectOverdue(p, now)).length,
  }
}
