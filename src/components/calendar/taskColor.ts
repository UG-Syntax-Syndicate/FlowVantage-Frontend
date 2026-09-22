import type { EnrichedTask } from '../../hooks/useEnrichedTasks'
import { memberColorHex } from '../../lib/memberColor'

/** How task bars/chips on the calendar are colored - by their project, or by their (first) assignee. */
export type CalendarColorMode = 'project' | 'assignee'

export function colorForTask(task: EnrichedTask, mode: CalendarColorMode): string {
  if (mode === 'assignee' && task.assignees.length > 0) return memberColorHex(task.assignees[0].id)
  return task.projectColor
}
