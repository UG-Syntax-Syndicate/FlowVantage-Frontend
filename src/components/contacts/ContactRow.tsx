import { ChevronRight, Mail } from 'lucide-react'
import type { Contact } from '../../types/project'
import { CONTACT_STAGE_META, CONTACT_STATUS_META } from '../../types/statusMeta'
import { Avatar } from '../common/Avatar'
import { showToast } from '../../lib/toast'
import { TableCell, TableRow } from '../ui/table'
import { Checkbox } from '../ui/checkbox'

interface ContactRowProps {
  contact: Contact
  selected: boolean
  onToggleSelect: () => void
  onView: () => void
}

export function ContactRow({ contact, selected, onToggleSelect, onView }: ContactRowProps) {
  const statusMeta = CONTACT_STATUS_META[contact.status]
  const stageMeta = CONTACT_STAGE_META[contact.stage]

  return (
    <TableRow className={selected ? 'bg-accent-50/40' : ''}>
      <TableCell className="w-10 pl-4">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label={`Select ${contact.contactName}`} />
      </TableCell>
      <TableCell className="font-medium text-slate-900">{contact.company}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar photoURL={contact.photoURL} name={contact.contactName} size={32} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{contact.contactName}</p>
            <p className="truncate text-xs text-slate-400">{contact.role}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-slate-500">{contact.email}</TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${statusMeta.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
          {statusMeta.label}
        </span>
      </TableCell>
      <TableCell className="text-slate-500">{contact.niche}</TableCell>
      <TableCell>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${stageMeta.badgeClass}`}>
          {stageMeta.label}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              showToast('info', 'Emailing isn’t wired up yet')
            }}
            aria-label={`Email ${contact.contactName}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Mail size={15} strokeWidth={1.9} />
          </button>
          <button
            type="button"
            onClick={onView}
            aria-label={`View ${contact.contactName}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronRight size={15} strokeWidth={1.9} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}
