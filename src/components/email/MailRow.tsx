import { Star } from 'lucide-react'
import type { Email, Project } from '../../types/project'
import { formatInboxTimestamp } from '../../lib/formatDate'
import { getPersonPhoto } from '../../lib/avatars'
import { Avatar } from '../common/Avatar'

interface MailRowProps {
  email: Email
  project?: Project
  selected: boolean
  onToggleSelect: () => void
  onToggleStar: () => void
}

export function MailRow({ email, project, selected, onToggleSelect, onToggleStar }: MailRowProps) {
  return (
    <div
      className={`flex items-center gap-3 border-b border-line/70 px-4 py-3 last:border-b-0 hover:bg-slate-50/70 ${
        selected ? 'bg-accent-50/50' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/40"
      />

      <Avatar photoURL={getPersonPhoto(email.senderName)} name={email.senderName} size={32} bgColor={email.senderColor} />

      <p className={`w-36 shrink-0 truncate text-sm ${email.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
        {email.senderName}
      </p>

      <div className="min-w-0 flex-1 truncate text-sm">
        <span className={email.read ? 'text-slate-700' : 'font-semibold text-slate-900'}>{email.subject}</span>
        <span className="text-slate-400"> — {email.snippet}</span>
      </div>

      {project && (
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
          {project.name}
        </span>
      )}

      <span className="w-16 shrink-0 text-right text-xs text-slate-400">{formatInboxTimestamp(email.receivedAt)}</span>

      <button
        type="button"
        onClick={onToggleStar}
        aria-label={email.starred ? 'Unstar email' : 'Star email'}
        className="shrink-0 text-slate-300 hover:text-amber-400"
      >
        <Star size={15} className={email.starred ? 'fill-amber-400 text-amber-400' : ''} />
      </button>
    </div>
  )
}
