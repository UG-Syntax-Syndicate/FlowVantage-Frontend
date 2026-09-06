import { CalendarDays, Pin } from 'lucide-react'
import type { Note } from '../../types/project'
import { NOTE_COLORS } from '../../lib/noteColors'
import { formatShortDate } from '../../lib/formatDate'

interface NoteCardProps {
  note: Note
  onClick: () => void
  onTogglePin: () => void
}

export function NoteCard({ note, onClick, onTogglePin }: NoteCardProps) {
  const meta = NOTE_COLORS[note.color]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
      className={`flex cursor-pointer flex-col gap-3 rounded-2xl p-5 text-left shadow-[0px_10px_28px_4px_rgba(152,150,163,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0px_14px_32px_6px_rgba(152,150,163,0.2)] ${meta.cardBg}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.badgeBg} ${meta.iconText}`}>
            <CalendarDays size={14} strokeWidth={2} />
          </span>
          <span className="text-xs font-medium text-slate-500">{formatShortDate(note.createdAt)}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin()
          }}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-black/5 hover:text-slate-600"
        >
          <Pin size={15} className={note.pinned ? 'fill-slate-700 text-slate-700' : ''} />
        </button>
      </div>

      <div>
        <p className="text-[15px] font-semibold text-slate-900">{note.title}</p>
        <p className="mt-1.5 line-clamp-5 text-sm leading-relaxed text-slate-600">{note.body}</p>
      </div>
    </div>
  )
}
