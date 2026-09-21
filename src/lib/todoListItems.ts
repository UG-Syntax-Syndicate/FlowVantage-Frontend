import type { Todo } from '../types/project'
import type { EnrichedTask } from '../hooks/useEnrichedTasks'

export type TodoListItem =
  | { kind: 'checklist'; id: string; createdAt: string; todo: Todo }
  | { kind: 'task'; id: string; createdAt: string; task: EnrichedTask }

/**
 * Merges the two "todo" concepts this app has - the lightweight `todos`
 * checklist table, and any `task` still in its initial 'todo' status - into
 * one list for the TodosPanel-style widgets. Checking a checklist item just
 * toggles `done`; checking a task item advances its status instead (see
 * TodosPanel/AllTodosModal), so both need to be visible in the same place.
 */
export function buildTodoListItems(
  todos: Todo[],
  tasks: EnrichedTask[],
  projectId?: string,
): TodoListItem[] {
  const checklistItems: TodoListItem[] = todos
    .filter((todo) => !projectId || todo.projectId === projectId)
    .map((todo) => ({ kind: 'checklist', id: `todo-${todo.id}`, createdAt: todo.createdAt, todo }))

  const taskItems: TodoListItem[] = tasks
    .filter((task) => task.status === 'todo' && (!projectId || task.projectId === projectId))
    .map((task) => ({ kind: 'task', id: `task-${task.id}`, createdAt: task.createdAt, task }))

  return [...checklistItems, ...taskItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
