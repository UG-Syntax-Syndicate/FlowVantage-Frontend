import {
  getJson,
  patchJson,
  deleteJson,
  postJsonAuthed,
} from '../../lib/backendApi'
import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { authToken, type ApiEnvelope } from '../../lib/authedRequest'

interface TaskRow {
  id: string
  project_id: string
  title: string
  status: TaskStatus
  priority: Task['priority']
  assignee_id: string | null
  tags: string[]
  start_date: string | null
  due_date: string | null
  created_at: string
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    assigneeIds: row.assignee_id ? [row.assignee_id] : [],
    tags: row.tags || [],
    startDate: row.start_date || row.created_at,
    dueDate: row.due_date || row.created_at,
    createdAt: row.created_at,
  }
}

export async function fetchTasks(workspaceId?: string): Promise<Task[]> {
  const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ''
  const { data } = await getJson<ApiEnvelope<TaskRow[]>>(`/tasks${query}`, authToken())
  return data.map(mapTask)
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  await patchJson(`/tasks/${taskId}`, { status }, authToken())
  emitProjectsChanged()
}

export async function createTask(
  input: CreateTaskInput & { projectId: string; status: TaskStatus },
): Promise<Task> {
  const { data } = await postJsonAuthed<ApiEnvelope<TaskRow>>(
    '/tasks',
    {
      title: input.title,
      priority: input.priority,
      status: input.status,
      startDate: input.startDate,
      dueDate: input.dueDate,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      tags: input.tags,
    },
    authToken(),
  )
  emitProjectsChanged()
  return mapTask(data)
}

/** Full task edit. Only the fields present in `input` are sent. */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await patchJson<ApiEnvelope<TaskRow>>(`/tasks/${taskId}`, input, authToken())
  emitProjectsChanged()
  return mapTask(data)
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteJson(`/tasks/${taskId}`, authToken())
  emitProjectsChanged()
}
