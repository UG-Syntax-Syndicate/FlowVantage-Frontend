import { useEffect, useRef, useState } from 'react'
import { MessagesSquare, Pencil, Send, Trash2 } from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Skeleton } from '../ui/skeleton'
import {
  useDeleteProjectMessage,
  useMarkProjectMessagesRead,
  usePostProjectMessage,
  useProjectMessages,
  useUpdateProjectMessage,
} from '../../hooks/useCollaborationData'
import { useProjectMembers } from '../../hooks/useWorkspacesData'
import { useAuth } from '../../hooks/useAuth'
import { getUserAvatarUrl } from '../../lib/avatars'
import { formatDateTime } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'
import { MAX_MESSAGE_LENGTH, type ProjectMessage } from '../../types/collaboration'

interface ProjectMessagesPanelProps {
  projectId: string
}

/**
 * The project's message thread.
 *
 * Project membership is the whole access rule - a workspace owner can see that
 * a project exists without belonging in its team conversation - so this panel
 * simply surfaces whatever the server is willing to return.
 *
 * A deleted message renders as a tombstone rather than disappearing: a thread
 * reads badly when a message vanishes and leaves the replies around it
 * referring to nothing.
 */
export function ProjectMessagesPanel({ projectId }: ProjectMessagesPanelProps) {
  const { currentUser, userProfile } = useAuth()
  const { data: messages = [], isLoading } = useProjectMessages(projectId)
  const { data: projectMembers = [] } = useProjectMembers(projectId)
  const postMessage = usePostProjectMessage(projectId)
  const updateMessage = useUpdateProjectMessage(projectId)
  const deleteMessage = useDeleteProjectMessage(projectId)
  const markRead = useMarkProjectMessagesRead()

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const scrollRef = useRef<HTMLOListElement>(null)
  const markReadRef = useRef(markRead.mutate)
  markReadRef.current = markRead.mutate

  const myId = currentUser?.uid ?? null
  // Owner only: project roles are owner | contributor | viewer, so the
  // service's 'admin' branch can never match.
  const canModerate = projectMembers.find((member) => member.userId === myId)?.role === 'owner'

  // Opening the panel is reading the thread. Through a ref so a new mutate
  // identity on each render cannot re-fire this.
  useEffect(() => {
    markReadRef.current(projectId)
  }, [projectId])

  // Pin to the newest message, the way a chat opens.
  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages.length])

  async function send() {
    const body = draft.trim()
    if (!body) return
    try {
      await postMessage.mutateAsync(body)
      setDraft('')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not send that message')
    }
  }

  async function saveEdit(message: ProjectMessage) {
    const body = editDraft.trim()
    if (!body) return
    try {
      await updateMessage.mutateAsync({ messageId: message.id, body })
      setEditingId(null)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not save that edit')
    }
  }

  async function remove(message: ProjectMessage) {
    try {
      await deleteMessage.mutateAsync(message.id)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not delete that message')
    }
  }

  const remaining = MAX_MESSAGE_LENGTH - draft.length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessagesSquare size={15} strokeWidth={2} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Project chat</h3>
        <span className="text-xs text-slate-400">Everyone on this project</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : (
        <ol ref={scrollRef} className="flex max-h-96 min-h-32 flex-col gap-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <li className="flex h-32 items-center justify-center text-sm text-slate-400">
              No messages yet. Say something — everyone on this project will see it.
            </li>
          )}

          {messages.map((message) => {
            const mine = message.authorId === myId
            const editing = editingId === message.id

            if (message.deleted) {
              return (
                <li key={message.id} className="pl-10 text-xs text-slate-400 italic">
                  Message deleted
                </li>
              )
            }

            return (
              <li key={message.id} className="flex gap-2.5">
                <Avatar
                  photoURL={getUserAvatarUrl(message.authorAvatarUrl, message.authorEmail ?? message.authorId)}
                  name={message.authorName}
                  size={30}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-700">{message.authorName ?? message.authorEmail}</span>
                    {formatDateTime(message.createdAt)}
                    {message.editedAt && <span className="italic">edited</span>}
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
                          disabled={editDraft.trim().length === 0 || updateMessage.isPending}
                          loading={updateMessage.isPending}
                          onClick={() => saveEdit(message)}
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
                      <p className="mt-0.5 text-sm whitespace-pre-wrap text-slate-700">{message.body}</p>
                      {(mine || canModerate) && (
                        <div className="mt-1 flex gap-3 text-xs text-slate-400">
                          {mine && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-slate-600"
                              onClick={() => {
                                setEditingId(message.id)
                                setEditDraft(message.body ?? '')
                              }}
                            >
                              <Pencil size={11} strokeWidth={2} />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-rose-600"
                            disabled={deleteMessage.isPending}
                            onClick={() => remove(message)}
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

      <div className="flex gap-2.5 border-t border-line pt-3">
        <Avatar
          photoURL={getUserAvatarUrl(userProfile?.photoURL, userProfile?.id ?? myId ?? 'user')}
          name={userProfile?.name ?? currentUser?.email}
          size={30}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            rows={2}
            placeholder="Message the project team…"
            className="resize-none"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void send()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {remaining < 200 ? `${remaining} characters left` : 'Enter to send · Shift+Enter for a new line'}
            </span>
            <Button
              type="button"
              size="sm"
              disabled={draft.trim().length === 0 || postMessage.isPending}
              loading={postMessage.isPending}
              onClick={send}
            >
              <Send size={13} strokeWidth={2} />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
