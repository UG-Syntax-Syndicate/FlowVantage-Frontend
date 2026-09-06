import { CalendarDays, X } from 'lucide-react'
import type { Todo } from '../../types/project'
import { formatDateTime } from '../../lib/formatDate'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface TodoDetailModalProps {
  todo: Todo
  projectName?: string
  onClose: () => void
  onToggleDone: () => void
}

export function TodoDetailModal({ todo, projectName, onClose, onToggleDone }: TodoDetailModalProps) {
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
              <DialogTitle
                className={`text-base font-semibold ${todo.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}
              >
                {todo.title}
              </DialogTitle>
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
      </DialogContent>
    </Dialog>
  )
}
