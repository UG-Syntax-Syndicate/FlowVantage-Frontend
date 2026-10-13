/**
 * Task comments and project message threads.
 *
 * Both come back with their author's name and avatar already joined in, so a
 * thread never needs a second request per row to be readable.
 */

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  authorName: string | null
  authorAvatarUrl: string | null
  authorEmail: string | null
  body: string
  createdAt: string
  /** Set once the comment has been edited, so the UI can mark it. */
  editedAt: string | null
}

export interface ProjectMessage {
  id: string
  projectId: string
  authorId: string
  authorName: string | null
  authorAvatarUrl: string | null
  authorEmail: string | null
  /**
   * Null on a deleted message. The row survives as a tombstone rather than
   * vanishing, because a thread reads badly when a message disappears and
   * leaves the replies around it referring to nothing.
   */
  body: string | null
  deleted: boolean
  createdAt: string
  editedAt: string | null
}

/** Unread counts keyed by project id, for the whole sidebar in one request. */
export type UnreadMessageCounts = Record<string, number>

export const MAX_MESSAGE_LENGTH = 5000
