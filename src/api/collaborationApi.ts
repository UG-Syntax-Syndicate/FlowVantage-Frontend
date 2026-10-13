import { getJson, putJson, deleteJson, postJsonAuthed } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import type { ProjectMessage, TaskComment, UnreadMessageCounts } from '../types/collaboration'

/** Client for task comments (/tasks/:id/comments) and project messages (/projects/:id/messages). */

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

// ---------------------------------------------------------------------------
// Task comments
// ---------------------------------------------------------------------------

interface CommentRow {
  id: string
  task_id: string
  author_id: string
  author_name: string | null
  author_avatar_url: string | null
  author_email: string | null
  body: string
  created_at: string
  edited_at: string | null
}

function mapComment(row: CommentRow): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    authorEmail: row.author_email,
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.edited_at,
  }
}

/** Oldest first - a comment thread reads top to bottom. */
export async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data } = await getJson<ApiEnvelope<CommentRow[]>>(`/tasks/${taskId}/comments`, authToken())
  return data.map(mapComment)
}

export async function createTaskComment(taskId: string, body: string): Promise<TaskComment> {
  const { data } = await postJsonAuthed<ApiEnvelope<CommentRow>>(
    `/tasks/${taskId}/comments`,
    { body },
    authToken(),
  )
  return mapComment(data)
}

export async function updateTaskComment(commentId: string, body: string): Promise<TaskComment> {
  const { data } = await putJson<ApiEnvelope<CommentRow>>(`/comments/${commentId}`, { body }, authToken())
  return mapComment(data)
}

export async function deleteTaskComment(commentId: string): Promise<void> {
  await deleteJson(`/comments/${commentId}`, authToken())
}

// ---------------------------------------------------------------------------
// Project messages
// ---------------------------------------------------------------------------

interface MessageRow {
  id: string
  project_id: string
  author_id: string
  author_name: string | null
  author_avatar_url: string | null
  author_email: string | null
  body: string | null
  deleted?: boolean
  created_at: string
  edited_at: string | null
}

function mapMessage(row: MessageRow): ProjectMessage {
  return {
    id: row.id,
    projectId: row.project_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    authorEmail: row.author_email,
    body: row.body,
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    editedAt: row.edited_at,
  }
}

/**
 * A page of the thread, oldest first.
 *
 * Keyset paginated, not OFFSET: a thread grows while it is being read, and an
 * offset would duplicate or skip messages as it shifts. Pass `before` - the
 * created_at of the oldest message held - to fetch the page before it.
 */
export async function fetchProjectMessages(
  projectId: string,
  options: { before?: string; limit?: number } = {},
): Promise<ProjectMessage[]> {
  const params = new URLSearchParams()
  if (options.before) params.set('before', options.before)
  if (options.limit) params.set('limit', String(options.limit))
  const query = params.toString() ? `?${params.toString()}` : ''

  const { data } = await getJson<ApiEnvelope<MessageRow[]>>(
    `/projects/${projectId}/messages${query}`,
    authToken(),
  )
  return data.map(mapMessage)
}

export async function postProjectMessage(projectId: string, body: string): Promise<ProjectMessage> {
  const { data } = await postJsonAuthed<ApiEnvelope<MessageRow>>(
    `/projects/${projectId}/messages`,
    { body },
    authToken(),
  )
  return mapMessage(data)
}

export async function updateProjectMessage(messageId: string, body: string): Promise<ProjectMessage> {
  const { data } = await putJson<ApiEnvelope<MessageRow>>(`/messages/${messageId}`, { body }, authToken())
  return mapMessage(data)
}

/** Soft delete: the server returns the tombstone, which the UI renders in place. */
export async function deleteProjectMessage(messageId: string): Promise<ProjectMessage> {
  const { data } = await deleteJson<ApiEnvelope<MessageRow>>(`/messages/${messageId}`, authToken())
  return mapMessage(data)
}

export async function markProjectMessagesRead(projectId: string): Promise<void> {
  await postJsonAuthed(`/projects/${projectId}/messages/read`, {}, authToken())
}

export async function fetchUnreadMessageCounts(): Promise<UnreadMessageCounts> {
  const { data } = await getJson<ApiEnvelope<UnreadMessageCounts>>('/messages/unread', authToken())
  return data ?? {}
}
