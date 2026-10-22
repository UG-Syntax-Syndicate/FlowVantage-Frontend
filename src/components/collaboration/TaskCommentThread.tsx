import { useState } from 'react'
import { MessageSquare, Pencil, Send, Trash2 } from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Skeleton } from '../ui/skeleton'
import {
  useCreateTaskComment,
  useDeleteTaskComment,
  useTaskComments,
  useUpdateTaskComment,
} from '../../hooks/useCollaborationData'
import { useProjectMembers } from '../../hooks/useWorkspacesData'
import { useAuth } from '../../hooks/useAuth'
import { getUserAvatarUrl } from '../../lib/avatars'
import { formatDateTime } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'
import type { TaskComment } from '../../types/collaboration'

interface TaskCommentThreadProps {
  taskId: string
  /** Used to work out whether the viewer can moderate someone else's comment. */
  projectId: string
}

/**
 * A task's comment thread.
 *
 * The author's name and avatar come joined onto each row, so this renders from
 * one request rather than a lookup per comment.
 *
 * Who can do what matches the server exactly: edit is the author's alone,
 * delete is the author's or a project owner/admin's. Showing a control the
 * server would refuse is worse than not showing it - the user learns the rule
 * from a failure instead of from the interface.
 */
export function TaskCommentThread({ taskId, projectId }: TaskCommentThreadProps) {
  const { currentUser, userProfile } = useAuth()
  const { data: comments = [], isLoading } = useTaskComments(taskId)
  const { data: projectMembers = [] } = useProjectMembers(projectId)
  const createComment = useCreateTaskComment(taskId)
  const updateComment = useUpdateTaskComment(taskId)
  const deleteComment = useDeleteTaskComment(taskId)

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const myId = currentUser?.uid ?? null
  const myRole = projectMembers.find((member) => member.userId === myId)?.role ?? null
  // Owner only. The service also accepts 'admin', but project roles are
  // owner | contributor | viewer - there is no project admin - so that branch
  // can never match and offering it here would show a control the server
  // refuses.
  const canModerate = myRole === 'owner'

  async function post() {
    const body = draft.trim()
    if (!body) return
    try {
      await createComment.mutateAsync(body)
      setDraft('')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not post that comment')
    }
  }

  async function saveEdit(comment: TaskComment) {
    const body = editDraft.trim()
    if (!body) return
    try {
      await updateComment.mutateAsync({ commentId: comment.id, body })
      setEditingId(null)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not save that edit')
    }
  }

  async function remove(comment: TaskComment) {
    try {
      await deleteComment.mutateAsync(comment.id)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not delete that comment')
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageSquare size={14} strokeWidth={2} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">
          Comments
          {comments.length > 0 && <span className="ml-1 font-normal text-slate-400">({comments.length})</span>}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400">No comments yet. Start the conversation below.</p>
      ) : (
        <ol className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const mine = comment.authorId === myId
            const editing = editingId === comment.id

            return (
              <li key={comment.id} className="flex gap-2.5">
                <Avatar
                  photoURL={getUserAvatarUrl(comment.authorAvatarUrl, comment.authorEmail ?? comment.authorId)}
                  name={comment.authorName}
                  size={28}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-700">{comment.authorName ?? comment.authorEmail}</span>
                    {formatDateTime(comment.createdAt)}
                    {comment.editedAt && <span className="italic">edited</span>}
                  </p>

                  {editing ? (
                    <div className="mt-1.5 flex flex-col gap-2">
                      <Textarea
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={editDraft.trim().length === 0 || updateComment.isPending}
                          loading={updateComment.isPending}
                          onClick={() => saveEdit(comment)}
                        >
                          Save
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-0.5 text-sm whitespace-pre-wrap text-slate-700">{comment.body}</p>
                      {(mine || canModerate) && (
                        <div className="mt-1 flex gap-3 text-xs text-slate-400">
                          {mine && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-slate-600"
                              onClick={() => {
                                setEditingId(comment.id)
                                setEditDraft(comment.body)
                              }}
                            >
                              <Pencil size={11} strokeWidth={2} />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-rose-600"
                            disabled={deleteComment.isPending}
                            onClick={() => remove(comment)}
                          >
                            <Trash2 size={11} strokeWidth={2} />
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex gap-2.5">
        <Avatar
          photoURL={getUserAvatarUrl(userProfile?.photoURL, userProfile?.id ?? myId ?? 'user')}
          name={userProfile?.name ?? currentUser?.email}
          size={28}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            placeholder="Add a comment…"
            className="resize-none"
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter inserts a newline - the convention
              // everywhere else people write short messages.
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void post()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Enter to send · Shift+Enter for a new line</span>
            <Button
              type="button"
              size="sm"
              disabled={draft.trim().length === 0 || createComment.isPending}
              loading={createComment.isPending}
              onClick={post}
            >
              <Send size={13} strokeWidth={2} />
              Comment
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
