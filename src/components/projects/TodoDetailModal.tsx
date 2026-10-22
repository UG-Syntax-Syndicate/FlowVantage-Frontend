import { useState } from 'react'
import { CalendarDays, Check, Pencil, Trash2, X } from 'lucide-react'
import type { Todo } from '../../types/project'
import { formatDateTime } from '../../lib/formatDate'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { useDeleteTodo, useUpdateTodo } from '../../hooks/useProjectsData'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { showToast } from '../../lib/toast'

interface TodoDetailModalProps {
  todo: Todo
  projectName?: string
  onClose: () => void
  onToggleDone: () => void
}

export function TodoDetailModal({ todo, projectName, onClose, onToggleDone }: TodoDetailModalProps) {
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const [titleDraft, setTitleDraft] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function saveTitle() {
    const title = titleDraft?.trim()
    if (!title || title === todo.title) {
      setTitleDraft(null)
      return
    }
    try {
      await updateTodo.mutateAsync({ todoId: todo.id, input: { title } })
      setTitleDraft(null)
    } catch {
      showToast('error', 'Could not rename this todo')
    }
  }

  async function handleDelete() {
    try {
      await deleteTodo.mutateAsync(todo.id)
      showToast('success', 'Todo deleted')
      onClose()
    } catch {
      showToast('error', 'Could not delete this todo')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <label className="flex min-w-0 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={onToggleDone}
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/40"
              />
              {titleDraft === null ? (
                <DialogTitle
                  className={`text-base font-semibold ${todo.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}
                >
                  {todo.title}
                </DialogTitle>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <Input
                    autoFocus
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void saveTitle()
                      } else if (event.key === 'Escape') {
                        setTitleDraft(null)
                      }
                    }}
                    // The title sits inside a <label> that toggles done; typing
                    // in it must not check the box.
                    onClick={(event) => event.preventDefault()}
                    className="h-8"
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      void saveTitle()
                    }}
                    aria-label="Save title"
                    disabled={updateTodo.isPending}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <Check size={15} />
                  </button>
                </div>
              )}
            </label>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays size={13} />
          Due {formatDateTime(todo.dueDate)}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {projectName && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              {projectName}
            </span>
          )}
          {todo.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => setTitleDraft(todo.title)}
            disabled={titleDraft !== null}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Pencil size={13} strokeWidth={2} />
            Rename
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={13} strokeWidth={2} />
            Delete
          </button>
        </div>

        <ConfirmDialog
          open={confirmingDelete}
          title="Delete this todo?"
          description={`"${todo.title}" will be removed. This cannot be undone.`}
          confirmLabel="Delete todo"
          danger
          loading={deleteTodo.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
        />
      </DialogContent>
    </Dialog>
  )
}
