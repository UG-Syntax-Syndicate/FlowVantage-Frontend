import { CalendarDays, Pencil, Trash2, X } from 'lucide-react'
import type { Note } from '../../types/project'
import { NOTE_COLORS } from '../../lib/noteColors'
import { formatDateTime } from '../../lib/formatDate'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface ViewNoteModalProps {
  note: Note
  projectName?: string
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ViewNoteModal({ note, projectName, onClose, onEdit, onDelete }: ViewNoteModalProps) {
  const meta = NOTE_COLORS[note.color]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`h-3.5 w-3.5 shrink-0 rounded-sm ${meta.badgeBg}`} />
              <DialogTitle className="truncate text-lg font-semibold text-slate-900">{note.title}</DialogTitle>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-slate-400">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label="Edit note"
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Delete note"
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {formatDateTime(note.createdAt)}
          </span>
          {projectName && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500">{projectName}</span>
          )}
        </div>

        <p className="max-h-[50vh] overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-slate-600">
          {note.body}
        </p>
      </DialogContent>
    </Dialog>
  )
}
