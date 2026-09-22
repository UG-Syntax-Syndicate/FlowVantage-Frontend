import type { EnrichedTask } from '../../hooks/useEnrichedTasks'
import { memberColorHex } from '../../lib/memberColor'

/** How task bars/chips on the calendar are colored - by their project, their (first) assignee, or their (first) tag. */
export type CalendarColorMode = 'project' | 'assignee' | 'tag'

// A different palette than memberColor's, so "color by tag" and "color by
// assignee" don't ever coincidentally produce the exact same hue set.
const TAG_COLORS = ['#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444', '#3b82f6', '#84cc16', '#ec4899', '#78716c']

function hashString(value: string): number {
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function tagColorHex(tag: string): string {
  return TAG_COLORS[hashString(tag) % TAG_COLORS.length]
}

export function colorForTask(task: EnrichedTask, mode: CalendarColorMode): string {
  if (mode === 'assignee' && task.assignees.length > 0) return memberColorHex(task.assignees[0].id)
  if (mode === 'tag' && task.tags.length > 0) return tagColorHex(task.tags[0])
  return task.projectColor
}
