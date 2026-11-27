import {
  getJson,
  patchJson,
  deleteJson,
  postJsonAuthed,
} from '../../lib/backendApi'
import type { CreateTodoInput, Todo, UpdateTodoInput } from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { authToken, type ApiEnvelope } from '../../lib/authedRequest'

interface TodoRow {
  id: string
  project_id: string
  title: string
  done: boolean
  tags: string[]
  due_date: string | null
  created_at: string
}

function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    done: row.done,
    tags: row.tags || [],
    dueDate: row.due_date || row.created_at,
    createdAt: row.created_at,
  }
}

export async function fetchTodos(workspaceId?: string): Promise<Todo[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<TodoRow[]>>(`/todos${query}`, authToken())
  return data.map(mapTodo)
}

export async function toggleTodo(todoId: string): Promise<void> {
  const token = authToken()
  const { data: current } = await getJson<ApiEnvelope<TodoRow>>(`/todos/${todoId}`, token)
  await patchJson(`/todos/${todoId}`, { done: !current.done }, token)
  emitProjectsChanged()
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const { data } = await postJsonAuthed<ApiEnvelope<TodoRow>>('/todos', input, authToken())
  emitProjectsChanged()
  return mapTodo(data)
}

export async function updateTodo(todoId: string, input: UpdateTodoInput): Promise<Todo> {
  const { data } = await patchJson<ApiEnvelope<TodoRow>>(`/todos/${todoId}`, input, authToken())
  emitProjectsChanged()
  return mapTodo(data)
}

export async function deleteTodo(todoId: string): Promise<void> {
  await deleteJson(`/todos/${todoId}`, authToken())
  emitProjectsChanged()
}
