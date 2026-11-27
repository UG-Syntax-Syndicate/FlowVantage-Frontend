import { Copy } from 'lucide-react'
import { Button } from '../ui/button'
import { showToast } from '../../lib/toast'
import type { Invitation } from '../../types/workspace'

/**
 * What happened to an invitation just created, with its link.
 *
 * The link is always shown: an email can land in spam or never be sent (a
 * host that blocks SMTP fails silently from the inviter's side), and copying
 * the link into a chat is the one route that always works.
 */
export function InviteLinkNotice({ invite }: { invite: Invitation }) {
  if (!invite.inviteLink) return null
  const link = invite.inviteLink
  const sent = invite.emailSent === true

  return (
    <div className={`rounded-xl border px-4 py-3 ${sent ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <p className={`text-xs font-medium ${sent ? 'text-emerald-900' : 'text-amber-900'}`}>
        {sent
          ? `Invitation emailed to ${invite.email}. You can also send them this link:`
          : `The invitation email to ${invite.email} could not be sent${invite.emailError ? ` (${invite.emailError})` : ''}. Send them this link yourself:`}
      </p>
      {invite.notifiedInApp && (
        <p className="mt-1 text-xs text-slate-600">They already have an account, so it is also waiting in their notifications.</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2.5 py-1.5 text-[11px] text-slate-600">{link}</code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard
              .writeText(link)
              .then(() => showToast('success', 'Link copied'))
              .catch(() => showToast('error', 'Could not copy the link'))
          }}
        >
          <Copy size={13} strokeWidth={2} />
          Copy
        </Button>
      </div>
    </div>
  )
}
