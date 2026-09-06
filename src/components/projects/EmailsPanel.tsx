import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Star } from 'lucide-react'
import { useEmails, useProjects, useToggleEmailStar } from '../../hooks/useProjectsData'
import { EmailDetailModal } from './EmailDetailModal'
import { formatInboxTimestamp } from '../../lib/formatDate'
import { getPersonPhoto } from '../../lib/avatars'
import { Avatar } from '../common/Avatar'
import { Card } from '../ui/card'
import type { Email } from '../../types/project'

interface EmailsPanelProps {
  projectId?: string
}

export function EmailsPanel({ projectId }: EmailsPanelProps) {
  const { data: emails = [] } = useEmails()
  const { data: projects = [] } = useProjects()
  const toggleStar = useToggleEmailStar()
  const [viewingEmailId, setViewingEmailId] = useState<string | null>(null)

  const visibleEmails = emails
    .filter((email) => (!projectId || email.projectId === projectId) && email.folder === 'inbox')
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

  const projectById = new Map(projects.map((p) => [p.id, p]))
  const viewingEmail = emails.find((e) => e.id === viewingEmailId) ?? null

  return (
    <Card className="gap-3 overflow-visible rounded-2xl border border-line bg-white p-4 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)] ring-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Mail size={17} strokeWidth={1.9} className="text-primary" />
          Emails ({visibleEmails.length})
        </div>
        <Link to="/dashboard/email" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="flex max-h-[360px] flex-col gap-1 overflow-y-auto pr-1">
        {visibleEmails.map((email: Email) => {
          const project = email.projectId ? projectById.get(email.projectId) : undefined
          return (
            <div
              key={email.id}
              role="button"
              tabIndex={0}
              onClick={() => setViewingEmailId(email.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setViewingEmailId(email.id)
              }}
              className="flex cursor-pointer items-start gap-2.5 rounded-xl p-2 hover:bg-slate-50/70"
            >
              <Avatar photoURL={getPersonPhoto(email.senderName)} name={email.senderName} size={32} bgColor={email.senderColor} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-sm ${email.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                    {email.senderName}
                  </p>
                  <span className="shrink-0 text-[10px] text-slate-400">{formatInboxTimestamp(email.receivedAt)}</span>
                </div>
                <p className="truncate text-xs text-slate-500">{email.subject}</p>
                {!projectId && project && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStar.mutate(email.id)
                }}
                aria-label={email.starred ? 'Unstar email' : 'Star email'}
                className="mt-0.5 shrink-0 text-slate-300 hover:text-amber-400"
              >
                <Star size={13} className={email.starred ? 'fill-amber-400 text-amber-400' : ''} />
              </button>
            </div>
          )
        })}
        {visibleEmails.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No emails yet.</p>}
      </div>

      {viewingEmail && (
        <EmailDetailModal
          email={viewingEmail}
          projectName={viewingEmail.projectId ? projectById.get(viewingEmail.projectId)?.name : undefined}
          onClose={() => setViewingEmailId(null)}
          onToggleStar={() => toggleStar.mutate(viewingEmail.id)}
        />
      )}
    </Card>
  )
}
