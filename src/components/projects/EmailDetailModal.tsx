import { Star, X } from 'lucide-react'
import type { Email } from '../../types/project'
import { formatDateTime } from '../../lib/formatDate'
import { getPersonPhoto } from '../../lib/avatars'
import { Avatar } from '../common/Avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface EmailDetailModalProps {
  email: Email
  projectName?: string
  onClose: () => void
  onToggleStar: () => void
}

export function EmailDetailModal({ email, projectName, onClose, onToggleStar }: EmailDetailModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar photoURL={getPersonPhoto(email.senderName)} name={email.senderName} size={40} bgColor={email.senderColor} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{email.senderName}</p>
                <p className="text-xs text-slate-400">{formatDateTime(email.receivedAt)}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={onToggleStar}
                aria-label={email.starred ? 'Unstar email' : 'Star email'}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-amber-500"
              >
                <Star size={15} className={email.starred ? 'fill-amber-400 text-amber-400' : ''} />
              </button>
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

        <DialogTitle className="text-base font-semibold text-slate-900">{email.subject}</DialogTitle>

        {projectName && (
          <span className="w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {projectName}
          </span>
        )}

        <p className="max-h-[45vh] overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-slate-600">
          {email.body}
        </p>
      </DialogContent>
    </Dialog>
  )
}
