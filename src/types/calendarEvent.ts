import type { Meeting, Project, Todo } from './project'
import type { EnrichedTask } from '../hooks/useEnrichedTasks'

export interface CalendarTaskEvent {
  kind: 'task'
  task: EnrichedTask
}

export interface CalendarTodoEvent {
  kind: 'todo'
  todo: Todo
  projectName?: string
}

export interface CalendarMeetingEvent {
  kind: 'meeting'
  meeting: Meeting
  projectName?: string
  /** Fallback swatch color when the meeting has no project (`meeting.projectId === null`). */
  projectColor?: string
}

export interface CalendarDeadlineEvent {
  kind: 'deadline'
  project: Project
}

export type CalendarEvent = CalendarTaskEvent | CalendarTodoEvent | CalendarMeetingEvent | CalendarDeadlineEvent

export function calendarEventKey(event: CalendarEvent): string {
  switch (event.kind) {
    case 'task':
      return `task-${event.task.id}`
    case 'todo':
      return `todo-${event.todo.id}`
    case 'meeting':
      return `meeting-${event.meeting.id}`
    case 'deadline':
      return `deadline-${event.project.id}`
  }
}
