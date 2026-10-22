import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Link2, MessageCircle, XCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Skeleton } from '../ui/skeleton'
import { Alert } from '../common/Alert'
import {
  useLinkProjectWhatsAppGroup,
  useProjectNotifications,
  useProjectWhatsAppGroup,
} from '../../hooks/useIntegrationsData'
import { formatDateTime } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'
import type { NotificationStatus } from '../../types/integrations'

interface ProjectWhatsAppPanelProps {
  projectId: string
}

const STATUS_META: Record<NotificationStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  sent: { label: 'Delivered', className: 'text-emerald-600', Icon: CheckCircle2 },
  pending: { label: 'Queued', className: 'text-amber-600', Icon: Clock },
  failed: { label: 'Failed', className: 'text-rose-600', Icon: XCircle },
  skipped: { label: 'Skipped', className: 'text-slate-400', Icon: XCircle },
}

/**
 * Per-project WhatsApp configuration and its delivery log.
 *
 * Lives on the project rather than in account settings because linking a group
 * is project configuration, not a user preference — two different people on the
 * same project should not each be able to point it at a different group.
 *
 * The delivery log is the half that earns its place: it is what makes "did my
 * team actually get told?" answerable, including *why* something failed. A
 * notification feature without one is a feature nobody can trust.
 */
export function ProjectWhatsAppPanel({ projectId }: ProjectWhatsAppPanelProps) {
  const { data: group, isLoading: groupLoading } = useProjectWhatsAppGroup(projectId)
  const { data: log = [], isLoading: logLoading } = useProjectNotifications(projectId)
  const linkGroup = useLinkProjectWhatsAppGroup(projectId)

  const [groupId, setGroupId] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  // Seed the fields from what is already linked, once it arrives. React Query's
  // structural sharing keeps the same object identity across a refetch that
  // returns equal data, so a background poll does not reset an in-progress
  // edit - only an actual change does.
  useEffect(() => {
    if (group) {
      setGroupId(group.groupId)
      setInviteLink(group.inviteLink ?? '')
    }
  }, [group])

  async function save() {
    try {
      const result = await linkGroup.mutateAsync({ groupId: groupId.trim(), inviteLink: inviteLink.trim() })
      // The API returns a warning when group messaging is still switched off.
      // Surfacing it is the difference between "saved" and "saved, but nothing
      // will be sent yet".
      showToast(result.warning ? 'info' : 'success', result.warning ?? 'WhatsApp group linked')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not link this group')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MessageCircle size={18} strokeWidth={1.9} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">WhatsApp group</h3>
            <p className="text-xs text-slate-400">
              Optional. Each member who has verified their own number already gets these updates directly — a group is
              for having one shared thread as well.
            </p>
          </div>
        </div>

        {groupLoading ? (
          <Skeleton className="h-24 w-full max-w-md rounded-xl" />
        ) : (
          <div className="flex max-w-md flex-col gap-3 rounded-xl border border-line p-4">
            <div>
              <Label htmlFor="whatsapp-group-id">Group ID</Label>
              <Input
                id="whatsapp-group-id"
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
                placeholder="1203630xxxxxxxxxx@g.us"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp-invite-link">Invite link</Label>
              <Input
                id="whatsapp-invite-link"
                value={inviteLink}
                onChange={(event) => setInviteLink(event.target.value)}
                placeholder="https://chat.whatsapp.com/…"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-slate-400">
                Members join by this link — there is no API to add them, which is also why a group caps at 8 people.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                disabled={groupId.trim().length === 0 || linkGroup.isPending}
                loading={linkGroup.isPending}
                onClick={save}
              >
                <Link2 size={14} strokeWidth={2} />
                {group ? 'Update link' : 'Link group'}
              </Button>
              {group && <span className="text-xs text-slate-400">Updated {formatDateTime(group.updatedAt)}</span>}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Delivery log</p>

        {logLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : log.length === 0 ? (
          <Alert variant="info">
            Nothing sent for this project yet. Change its status, or post a message, and anything queued appears here —
            including why it failed, if it did.
          </Alert>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {log.map((entry) => {
              const meta = STATUS_META[entry.status] ?? STATUS_META.skipped
              return (
                <li key={entry.id} className="flex items-start gap-3 rounded-xl border border-line px-3 py-2.5">
                  <meta.Icon size={15} strokeWidth={2} className={`mt-0.5 shrink-0 ${meta.className}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-900">{entry.summary ?? entry.template ?? 'Notification'}</p>
                    <p className="truncate text-xs text-slate-400">
                      {[
                        meta.label,
                        entry.channel === 'whatsapp_group' ? 'group' : 'direct',
                        entry.recipient,
                        formatDateTime(entry.sentAt ?? entry.createdAt),
                        entry.attempts > 1 ? `${entry.attempts} attempts` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {entry.lastError && <p className="mt-0.5 text-xs text-rose-600">{entry.lastError}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
