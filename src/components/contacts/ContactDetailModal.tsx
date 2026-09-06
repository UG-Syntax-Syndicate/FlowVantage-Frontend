import { Mail } from 'lucide-react'
import type { Contact } from '../../types/project'
import { CONTACT_STAGE_META, CONTACT_STATUS_META } from '../../types/statusMeta'
import { formatShortDate } from '../../lib/formatDate'
import { Avatar } from '../common/Avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface ContactDetailModalProps {
  contact: Contact
  onClose: () => void
}

export function ContactDetailModal({ contact, onClose }: ContactDetailModalProps) {
  const statusMeta = CONTACT_STATUS_META[contact.status]
  const stageMeta = CONTACT_STAGE_META[contact.stage]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar photoURL={contact.photoURL} name={contact.contactName} size={48} />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-semibold text-slate-900">
                {contact.contactName}
              </DialogTitle>
              <p className="truncate text-xs text-slate-400">
                {contact.role} · {contact.company}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stageMeta.badgeClass}`}>{stageMeta.label}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">{contact.niche}</span>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Email</span>
            <a href={`mailto:${contact.email}`} className="font-medium text-primary hover:underline">
              {contact.email}
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Company</span>
            <span className="font-medium text-slate-700">{contact.company}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Role</span>
            <span className="font-medium text-slate-700">{contact.role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Added</span>
            <span className="font-medium text-slate-700">{formatShortDate(contact.createdAt)}</span>
          </div>
        </div>

        <a
          href={`mailto:${contact.email}`}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-medium text-white hover:brightness-95"
        >
          <Mail size={15} strokeWidth={2} />
          Email {contact.contactName.split(' ')[0]}
        </a>
      </DialogContent>
    </Dialog>
  )
}
